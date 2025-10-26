# Yoga Progress Tracker Feature 🧘‍♀️

## Overview
A comprehensive yoga workout progress tracking system that stores yoga session data in MongoDB and displays detailed progress analytics to users.

## Features Implemented

### 1. **Backend API (server/yoga_progress.py)**
- **POST `/yoga-progress`** - Save completed yoga sessions
  - Stores: pose name, sanskrit name, category, level, sets, reps, total time, calories burned
  - Automatically calculates calories (4 calories per minute)
  
- **GET `/yoga-progress`** - Fetch user's yoga progress
  - Query params: `limit`, `offset`, `poseName`
  - Returns sessions with aggregated stats
  
- **DELETE `/yoga-progress/<session_id>`** - Delete a specific session
  
- **GET `/yoga-progress/stats`** - Get comprehensive statistics
  - Total sessions, calories burned, total time
  - Unique poses completed, total sets/reps
  - Most practiced pose, categories practiced

### 2. **Database Collection (models.py)**
- **yoga_progress_collection** - Stores all yoga workout sessions
- Schema includes:
  - User email
  - Pose details (name, sanskrit, category, level)
  - Session metrics (sets, reps, time, calories)
  - Timestamps

### 3. **Exercise Session Integration (ExerciseSession.jsx)**
- Automatically saves yoga progress to MongoDB when session is completed
- Saves to both localStorage and MongoDB (backward compatible)
- Extracts data: pose name, sanskrit name, category, level, sets, reps, time, calories

### 4. **Yoga Progress Tracker Component**
- **Stats Dashboard**: 4 key metrics
  - Total Sessions
  - Calories Burned
  - Total Time
  - Unique Poses
  
- **Filters**:
  - Time period: All Time, Today, This Week, This Month
  - Category filter
  - Pose filter
  
- **Session List**:
  - Shows all completed yoga sessions
  - Displays: pose name, sanskrit name, time, sets, reps, calories, date
  - Delete functionality for each session

### 5. **Navigation & Routes**
- Added route: `/yoga-progress`
- Accessible from More Services page as "Yoga Progress Tracker"
- Protected route (requires authentication)

## How It Works

1. **User completes a yoga session** in ExerciseSession modal
2. **Data is saved** to MongoDB via API call to `/yoga-progress` endpoint
3. **Data includes**:
   ```javascript
   {
     poseName: "Boat Pose",
     sanskritName: "Nāvāsana",
     category: "Balance",
     level: "Beginner",
     sets: 3,
     reps: 10,
     totalTime: 900, // seconds
     totalReps: 30,
     caloriesBurned: 60,
     completedSets: [...],
     timestamp: "2024-01-15T10:30:00Z"
   }
   ```

4. **User views progress** at `/yoga-progress` page
5. **Statistics are calculated** and displayed:
   - Total sessions completed
   - Total calories burned
   - Total time spent
   - Unique poses practiced
   - Most practiced pose

## API Endpoints

All endpoints are protected with JWT authentication:

```bash
# Save a session
POST http://localhost:5000/yoga-progress
Authorization: Bearer <token>
Body: {
  "poseName": "Boat Pose",
  "sanskritName": "Nāvāsana",
  "category": "Balance",
  "level": "Beginner",
  "sets": 3,
  "reps": 10,
  "totalTime": 900,
  "totalReps": 30,
  "completedSets": [...]
}

# Get all sessions
GET http://localhost:5000/yoga-progress?limit=50&offset=0

# Get stats
GET http://localhost:5000/yoga-progress/stats

# Delete a session
DELETE http://localhost:5000/yoga-progress/<session_id>
```

## Data Storage

**MongoDB Collection:** `yoga_progress`
```javascript
{
  "_id": "uuid",
  "userEmail": "user@example.com",
  "poseName": "Boat Pose",
  "sanskritName": "Nāvāsana",
  "category": "Balance",
  "level": "Beginner",
  "sets": 3,
  "reps": 10,
  "totalTime": 900,
  "totalReps": 30,
  "caloriesBurned": 60,
  "completedSets": [...],
  "timestamp": "2024-01-15T10:30:00Z",
  "createdAt": 1705314200000,
  "date": "2024-01-15",
  "exerciseType": "yoga"
}
```

## Calories Calculation

- Formula: 4 calories per minute of yoga
- Time-based estimation
- Adjusts based on session duration

## Future Enhancements

- Weekly/Monthly progress charts
- Progress streaks
- Achievement badges
- Share progress on community feed
- Compare with friends
- Export data to CSV/PDF
- Advanced analytics with graphs
- Pose difficulty progression tracking

## Testing

To test the feature:
1. Navigate to `/workouts` (now redirects to yoga poses)
2. Start a yoga session
3. Complete the session
4. Data will be saved automatically
5. Go to `/yoga-progress` to view your progress
6. Or access from "More Services" page

## Files Modified

- `models.py` - Added yoga_progress_collection
- `app.py` - Registered yoga_progress blueprint
- `server/yoga_progress.py` - Created backend API
- `client/src/components/ExerciseSession.jsx` - Added MongoDB save functionality
- `client/src/components/YogaProgressTracker.jsx` - Created progress display component
- `client/src/App.js` - Added route and import
- `client/src/pages/ServicesPage.jsx` - Added to services list

## User Benefits

✅ Track all completed yoga sessions  
✅ Monitor calories burned  
✅ See total time invested  
✅ Track different poses practiced  
✅ Filter by date, category, or pose  
✅ Delete unwanted sessions  
✅ View comprehensive statistics  
✅ Set and achieve fitness goals  

## Technical Notes

- All API calls are authenticated with JWT
- Data is stored securely in MongoDB
- Backward compatible with localStorage
- Responsive design for all devices
- Error handling implemented
- No breaking changes to existing code

