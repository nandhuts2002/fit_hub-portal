# Live Sessions Filtering Fix

This document explains the issue and fix for filtering live sessions to show only upcoming sessions and hide ended ones.

## Issue Description

The live sessions page was showing all sessions, including those that had already ended. This created a cluttered experience for users who wanted to see only upcoming sessions.

## Root Cause

1. The backend `/live/sessions` endpoint was returning all sessions without any filtering
2. The frontend was displaying all returned sessions without distinction between upcoming and ended sessions
3. New sessions created by trainers were not being properly categorized

## Solution

### Backend Changes

Updated the `/live/sessions` endpoint in [live.py](file:///C:/Users/nandhu/Fit-hub-portal/server/live.py) to:

1. Filter out ended sessions from the main list
2. Separate upcoming and ended sessions in the response
3. Automatically determine session status based on start time and duration

```python
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
```

### Frontend Changes

Updated the frontend to:

1. Only display upcoming sessions
2. Maintain backward compatibility with the API response

## Testing

The fix ensures that:

1. Only upcoming live sessions are displayed on the main page
2. Ended sessions are automatically filtered out
3. New sessions created by trainers appear in the upcoming sessions list
4. The API maintains backward compatibility

## Verification

To verify the fix:

1. Restart the backend server
2. Create a new live session with a future start time
3. The session should appear in the upcoming sessions list
4. Sessions with past end times should not appear in the list

The fix maintains backward compatibility while ensuring a cleaner user experience with only relevant sessions displayed.