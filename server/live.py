import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from flask import Blueprint, jsonify, request
from email_utils import send_email
from models import live_sessions_collection

live_bp = Blueprint('live', __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load() -> Dict[str, Any]:
    """Load all sessions from MongoDB"""
    try:
        sessions = list(live_sessions_collection.find({}))
        # Convert MongoDB _id to string format for compatibility
        for session in sessions:
            if '_id' in session:
                del session['_id']
        return {"sessions": sessions}
    except Exception as e:
        print(f"Error loading sessions: {e}")
        return {"sessions": []}


def _save(payload: Dict[str, Any]):
    """Save session data - MongoDB is updated inline, no save needed"""
    pass


@live_bp.route('/sessions', methods=['GET'])
def list_sessions():
    data = _load()
    all_sessions = data.get('sessions', [])
    
    # Filter out ended sessions and separate upcoming from ended
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    upcoming_sessions = []
    ended_sessions = []
    
    for session in all_sessions:
        try:
            start_time = datetime.fromisoformat(session.get('startTime', '').replace('Z', '+00:00'))
            end_time = start_time.replace(second=0, microsecond=0)  # Remove seconds/microseconds for comparison
            
            # Add duration to get end time
            from datetime import timedelta
            end_time = end_time + timedelta(minutes=int(session.get('duration', 60)))
            
            if end_time > now:
                upcoming_sessions.append(session)
            else:
                ended_sessions.append(session)
        except Exception:
            # If there's an error parsing the date, include it in upcoming (safer default)
            upcoming_sessions.append(session)
    
    # Return only upcoming sessions by default
    return jsonify({"ok": True, "data": upcoming_sessions, "ended": ended_sessions})


@live_bp.route('/config', methods=['GET'])
def live_config():
    """Public, read-only config for client fallbacks. Returns Razorpay Key ID only."""
    key_id = os.environ.get('REACT_APP_RAZORPAY_KEY_ID') or os.environ.get('RAZORPAY_KEY_ID') or ''
    return jsonify({"ok": True, "razorpayKeyId": key_id})


@live_bp.route('/sessions/<sid>', methods=['GET'])
def get_session(sid):
    session = live_sessions_collection.find_one({"id": sid})
    if session:
        if '_id' in session:
            del session['_id']
        return jsonify({"ok": True, "data": session})
    return jsonify({"ok": False, "error": "Not found"}), 404


@live_bp.route('/sessions/<sid>/approve', methods=['POST'])
def approve_reservation(sid):
    body = request.get_json(force=True) or {}
    email = (body.get('email') or '').strip()
    if not email:
        return jsonify({"ok": False, "error": "email is required"}), 400
    
    # Find session in MongoDB
    session = live_sessions_collection.find_one({"id": sid})
    if not session:
        return jsonify({"ok": False, "error": "Not found"}), 404
    
    reservations = session.get('reservations', [])
    approved = _count_approved(reservations)
    cap = int(session.get('capacity') or 0)
    if cap and approved >= cap:
        return jsonify({"ok": False, "error": "Session is full"}), 409
    target = next((r for r in reservations if r.get('email') == email), None)
    if not target:
        return jsonify({"ok": False, "error": "Reservation not found"}), 404
    target['status'] = 'approved'
    
    # Update MongoDB
    live_sessions_collection.update_one(
        {"id": sid},
        {"$set": {"reservations": reservations}}
    )
    
    # Remove _id for response
    if '_id' in session:
        del session['_id']
    
    # notify user of approval
    body_txt = (
        f"Hi {target.get('name') or 'there'},\n\n"
        f"Your seat for '{session.get('title','Live Session')}' is approved.\n"
        f"Join link: {session.get('meetingUrl')}\n\n"
        f"If payment is required, please complete it before joining.\n\n"
        f"Thanks,\nFit Hub Team"
    )
    send_email(email, subject="Seat approved", body=body_txt)
    return jsonify({"ok": True, "data": session})


@live_bp.route('/sessions/<sid>/reject', methods=['POST'])
def reject_reservation(sid):
    body = request.get_json(force=True) or {}
    email = (body.get('email') or '').strip()
    if not email:
        return jsonify({"ok": False, "error": "email is required"}), 400
    
    session = live_sessions_collection.find_one({"id": sid})
    if not session:
        return jsonify({"ok": False, "error": "Not found"}), 404
    
    reservations = session.get('reservations', [])
    target = next((r for r in reservations if r.get('email') == email), None)
    if not target:
        return jsonify({"ok": False, "error": "Reservation not found"}), 404
    target['status'] = 'rejected'
    
    live_sessions_collection.update_one(
        {"id": sid},
        {"$set": {"reservations": reservations}}
    )
    
    if '_id' in session:
        del session['_id']
    
    send_email(email, subject="Seat request update", body="We're sorry, your request could not be approved this time.")
    return jsonify({"ok": True, "data": session})


@live_bp.route('/sessions/<sid>/reservations', methods=['GET'])
def list_reservations(sid):
    session = live_sessions_collection.find_one({"id": sid})
    if session:
        return jsonify({"ok": True, "data": session.get('reservations', [])})
    return jsonify({"ok": False, "error": "Not found"}), 404


@live_bp.route('/sessions/<sid>/mark-paid', methods=['POST'])
def mark_paid(sid):
    body = request.get_json(force=True) or {}
    email = (body.get('email') or '').strip()
    if not email:
        return jsonify({"ok": False, "error": "email is required"}), 400
    
    session = live_sessions_collection.find_one({"id": sid})
    if not session:
        return jsonify({"ok": False, "error": "Not found"}), 404
    
    reservations = session.get('reservations', [])
    target = next((r for r in reservations if r.get('email') == email), None)
    if not target:
        return jsonify({"ok": False, "error": "Reservation not found"}), 404
    target['payStatus'] = 'paid'
    
    live_sessions_collection.update_one(
        {"id": sid},
        {"$set": {"reservations": reservations}}
    )
    
    return jsonify({"ok": True})


@live_bp.route('/sessions', methods=['POST'])
def create_session():
    body = request.get_json(force=True) or {}
    # Minimal validation
    title = (body.get('title') or '').strip()
    meeting_url = (body.get('meetingUrl') or '').strip()
    start_time = (body.get('startTime') or '').strip()  # ISO string
    duration = int(body.get('duration') or 60)
    capacity = int(body.get('capacity') or 50)
    platform = (body.get('platform') or '').strip()  # 'zoom' | 'meet'

    if not title or not meeting_url or not start_time:
        return jsonify({"ok": False, "error": "title, meetingUrl, startTime are required"}), 400

    new_item = {
        "id": uuid.uuid4().hex,
        "title": title,
        "description": body.get('description') or '',
        "trainerId": body.get('trainerId') or '',
        "trainerName": body.get('trainerName') or '',
        "platform": platform or ('zoom' if 'zoom' in meeting_url.lower() else 'meet'),
        "meetingUrl": meeting_url,
        "startTime": start_time,
        "duration": duration,
        "capacity": capacity,
        "price": float(body.get('price') or 0),
        "level": body.get('level') or 'all',
        "style": body.get('style') or '',
        "reservations": [],
        "createdAt": _now_iso(),
    }

    # Save to MongoDB instead of JSON file
    try:
        live_sessions_collection.insert_one(new_item.copy())  # Use copy to avoid _id issues
    except Exception as e:
        print(f"Error saving session to MongoDB: {e}")
        return jsonify({"ok": False, "error": "Failed to save session"}), 500

    return jsonify({"ok": True, "data": new_item})


def _count_approved(reservations):
    return sum(1 for r in reservations if r.get('status') == 'approved')


@live_bp.route('/sessions/<sid>/reserve', methods=['POST'])
def reserve_session(sid):
    """Backward compatible: treat reserve as a request (pending)."""
    return request_seat(sid)


@live_bp.route('/sessions/<sid>/request', methods=['POST'])
def request_seat(sid):
    body = request.get_json(force=True) or {}
    email = (body.get('email') or '').strip()
    name = (body.get('name') or '').strip()

    if not email:
        return jsonify({"ok": False, "error": "email is required"}), 400

    session = live_sessions_collection.find_one({"id": sid})
    if not session:
        return jsonify({"ok": False, "error": "Not found"}), 404
    
    reservations = session.get('reservations', [])
    # if already exists, set to pending again
    existing = next((r for r in reservations if r.get('email') == email), None)
    if existing:
        existing['status'] = 'pending'
        existing['requestedAt'] = _now_iso()
    else:
        res_obj = {
            "email": email,
            "name": name,
            "requestedAt": _now_iso(),
            "status": 'pending',  # pending | approved | rejected
            "payStatus": 'unpaid',  # unpaid | paid
        }
        reservations.append(res_obj)
    
    live_sessions_collection.update_one(
        {"id": sid},
        {"$set": {"reservations": reservations}}
    )
    
    # Remove _id for response
    if '_id' in session:
        del session['_id']
    
    # Optional: notify user their request is received
    start_str = session.get('startTime') or ''
    body_txt = (
        f"Hi {name or 'there'},\n\n"
        f"We've received your seat request for: {session.get('title','Live Session')}\n"
        f"When: {start_str}\n"
        f"We'll email you once the trainer approves.\n\n"
        f"Thanks,\nFit Hub Team"
    )
    send_email(email, subject="Seat request received", body=body_txt)
    return jsonify({"ok": True, "data": session})


@live_bp.route('/sessions/<sid>/update', methods=['PATCH'])
def update_session(sid):
    body = request.get_json(force=True) or {}
    
    session = live_sessions_collection.find_one({"id": sid})
    if not session:
        return jsonify({"ok": False, "error": "Not found"}), 404
    
    # Build update data
    update_data = {}
    for key in [
        'title', 'description', 'platform', 'meetingUrl', 'startTime', 'duration', 'capacity', 'price', 'level', 'style'
    ]:
        if key in body:
            update_data[key] = body[key]
    
    # Update MongoDB
    if update_data:
        live_sessions_collection.update_one(
            {"id": sid},
            {"$set": update_data}
        )
    
    # Get updated session
    updated_session = live_sessions_collection.find_one({"id": sid})
    if '_id' in updated_session:
        del updated_session['_id']
    
    return jsonify({"ok": True, "data": updated_session})
