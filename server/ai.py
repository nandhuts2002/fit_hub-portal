from flask import Blueprint, request, jsonify, current_app
import os
import requests

# Simple AI chat blueprint. Calls OpenAI if OPENAI_API_KEY is set; otherwise returns a heuristic reply.
ai_bp = Blueprint('ai', __name__, url_prefix='/ai')


SYSTEM_PROMPT = (
    "You are FitHub AI Coach, a concise, friendly assistant for yoga and fitness. "
    "Answer with safe, general guidance. Avoid diagnosing. Recommend consulting a professional for injuries or medical issues. "
    "Prefer clear steps, beginner-friendly progressions, and short bullet points."
)


def _call_openai(messages: list):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None
    try:
        # Use the Chat Completions API if available; fall back gracefully.
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        }
        # Support new Project-scoped keys
        project = os.getenv('OPENAI_PROJECT')
        if project:
            headers['OpenAI-Project'] = project
        org = os.getenv('OPENAI_ORG') or os.getenv('OPENAI_ORGANIZATION')
        if org:
            headers['OpenAI-Organization'] = org

        resp = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json={
                'model': os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
                'messages': messages,
                'temperature': 0.3,
                'max_tokens': int(os.getenv('AI_MAX_TOKENS', '256')),
            },
            timeout=30,
        )
        if resp.status_code == 200:
            data = resp.json()
            content = (
                data.get('choices', [{}])[0]
                .get('message', {})
                .get('content', '')
            )
            text = content.strip()
            # Hard cap the length to avoid overly long responses
            max_chars = int(os.getenv('AI_MAX_CHARS', '900'))
            return (text[:max_chars] + ('…' if len(text) > max_chars else ''))
        current_app.logger.error(f"OpenAI API error {resp.status_code}: {resp.text}")
        return None
    except Exception as e:
        current_app.logger.error(f"OpenAI call failed: {e}")
        return None


def _call_mistral(messages: list):
    api_key = os.getenv('MISTRAL_API_KEY')
    if not api_key:
        return None
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        }
        model = os.getenv('MISTRAL_MODEL', 'mistral-small-latest')
        # Convert OpenAI-like messages to Mistral format (compatible)
        resp = requests.post(
            'https://api.mistral.ai/v1/chat/completions',
            headers=headers,
            json={
                'model': model,
                'messages': messages,
                'temperature': 0.3,
                'max_tokens': int(os.getenv('AI_MAX_TOKENS', '256')),
            },
            timeout=30,
        )
        if resp.status_code == 200:
            data = resp.json()
            content = (
                data.get('choices', [{}])[0]
                .get('message', {})
                .get('content', '')
            )
            text = content.strip()
            max_chars = int(os.getenv('AI_MAX_CHARS', '900'))
            return (text[:max_chars] + ('…' if len(text) > max_chars else ''))
        current_app.logger.error(f"Mistral API error {resp.status_code}: {resp.text}")
        return None
    except Exception as e:
        current_app.logger.error(f"Mistral call failed: {e}")
        return None

@ai_bp.route('/chat', methods=['POST'])
def chat():
    try:
        payload = request.get_json(silent=True) or {}
        user_message = (payload.get('message') or '').strip()
        context = payload.get('context') or {}

        if not user_message:
            return jsonify({'error': 'message is required'}), 400

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        # Optionally pass some minimal context
        if isinstance(context, dict) and context:
            messages.append({
                "role": "system",
                "content": f"Context: {context}",
            })

        # Prefer Mistral if key is present, then OpenAI, then fallback
        provider_error = None
        ai_reply = _call_mistral(messages)
        source = 'mistral' if ai_reply else None
        if not ai_reply:
            try:
                ai_reply = _call_openai(messages)
                source = 'openai' if ai_reply else 'fallback'
            except Exception as e:
                provider_error = str(e)
                source = 'fallback'
        if not ai_reply:
            # Fallback simple heuristic response
            ai_reply = (
                "Here are some general tips:\n"
                "- Start with a 5–10 min warm-up (mobility + light cardio).\n"
                "- For yoga: try 3–4 poses held for 30–45s, 2–3 rounds.\n"
                "- For strength: 2–3 sets of 8–12 reps, focus on form.\n"
                "- Rest 48 hours between intense sessions for the same muscle group.\n"
                "- If you have pain or a medical condition, consult a professional."
            )

        return jsonify({
            'reply': ai_reply,
            'source': source,
            'providerError': provider_error,
        }), 200
    except Exception as e:
        current_app.logger.error(f"AI chat error: {e}")
        return jsonify({'error': 'AI chat failed'}), 500


@ai_bp.route('/status', methods=['GET'])
def status():
    try:
        api_key = os.getenv('OPENAI_API_KEY')
        model = os.getenv('OPENAI_MODEL') or 'gpt-4o-mini'
        mistral_key = os.getenv('MISTRAL_API_KEY')
        mistral_model = os.getenv('MISTRAL_MODEL') or 'mistral-small-latest'
        project = os.getenv('OPENAI_PROJECT')
        org = os.getenv('OPENAI_ORG') or os.getenv('OPENAI_ORGANIZATION')
        return jsonify({
            'hasKey': bool(api_key),
            'model': model,
            'hasProject': bool(project),
            'hasOrg': bool(org),
            'hasMistral': bool(mistral_key),
            'mistralModel': mistral_model,
        }), 200
    except Exception:
        return jsonify({'hasKey': False}), 200


