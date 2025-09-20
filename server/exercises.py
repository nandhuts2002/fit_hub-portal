from flask import Blueprint, jsonify, request
import os
import requests

# Blueprint for ExerciseDB proxy endpoints
exercises_bp = Blueprint('exercises', __name__)

# Environment-configured RapidAPI details
RAPIDAPI_HOST = os.getenv('RAPIDAPI_HOST', 'exercisedb.p.rapidapi.com')
RAPIDAPI_BASE_URL = os.getenv('RAPIDAPI_BASE_URL', 'https://exercisedb.p.rapidapi.com')
RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')

HEADERS = {
    'x-rapidapi-host': RAPIDAPI_HOST,
    'x-rapidapi-key': RAPIDAPI_KEY or ''
}


def _missing_key_response():
    return jsonify({
        'msg': 'RapidAPI key not configured on server',
        'hint': 'Set RAPIDAPI_KEY in server/.env and restart the server.'
    }), 500


@exercises_bp.route('/target-list', methods=['GET'])
def get_target_list():
    """Proxy for ExerciseDB target list: GET /exercises/targetList"""
    if not RAPIDAPI_KEY:
        return _missing_key_response()

    url = f"{RAPIDAPI_BASE_URL}/exercises/targetList"

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        # If API returned an error status, forward meaningful info
        if not resp.ok:
            return jsonify({
                'msg': 'ExerciseDB API error',
                'status_code': resp.status_code,
                'detail': resp.text[:600]
            }), resp.status_code

        data = resp.json()
        return jsonify(data), 200

    except requests.exceptions.RequestException as e:
        return jsonify({'msg': 'Network error contacting ExerciseDB', 'error': str(e)}), 502
    except Exception as e:
        return jsonify({'msg': 'Unexpected server error', 'error': str(e)}), 500