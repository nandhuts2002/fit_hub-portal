# Leave Challenge Feature ✅

## What's New
Users can now **remove themselves** from challenges they've joined. A "Leave" button has been added in two locations for easy access.

---

## Visual Changes

### 🏆 Challenges Tab (ChallengesSection)

**Before:**
```
┌─────────────────────────────────┐
│ [📈 Track My Progress]          │
│      ✅ Joined                  │
└─────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────┐
│ [📈 Track My Progress]          │
│  ✅ Joined        ❌ Leave      │
└─────────────────────────────────┘
```

### 📊 My Progress Tab (ChallengeProgressTracker)

**Before:**
```
┌─────────────────────────────────┐
│ [  + Log Progress  ]            │
└─────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────┐
│ [ + Log Progress ] [  ❌  ]     │
└─────────────────────────────────┘
```

---

## How It Works

### Location 1: Challenges Tab
1. Go to **🏆 Challenges** tab
2. Find a challenge you've joined (has "Track My Progress" button)
3. Look at the bottom → See "✅ Joined" on left, **"❌ Leave"** on right
4. Click **"Leave"** → Confirmation dialog appears
5. Confirm → You're removed from the challenge

### Location 2: My Progress Tab
1. Go to **📊 My Progress** tab
2. See all your active challenges
3. Each challenge card has **[Log Progress]** and **[❌]** buttons
4. Click the **[❌]** button → Confirmation dialog appears
5. Confirm → Challenge removed from your list

---

## Safety Features

### ⚠️ Confirmation Dialog
When you click "Leave", a confirmation appears:
```
Are you sure you want to leave this challenge?
Your progress will be lost.

[Cancel]  [OK]
```

This prevents accidental clicks!

### 🗑️ What Happens When You Leave
- ❌ Removed from participants list
- ❌ Progress data deleted from database
- ❌ Activities/logs cleared
- ✅ Challenge still exists for others
- ✅ Can rejoin later (starts from 0 again)

---

## API Endpoint Used

```javascript
// Leave challenge
await challengesApi.leave(challengeId);

// Backend: DELETE /community/challenges/{id}/leave
// - Removes user from participants array
// - Deletes user_progress_collection record
// - Returns success message
```

---

## UI Components Updated

### 1. ChallengesSection.jsx

**New Function:**
```javascript
const leaveChallenge = async (challengeId) => {
  if (!window.confirm('Are you sure you want to leave this challenge? Your progress will be lost.')) {
    return;
  }

  try {
    const data = await challengesApi.leave(challengeId);
    if (data.ok) {
      alert('✅ Successfully left challenge!');
      fetchChallenges(); // Refresh
    } else {
      alert('❌ ' + (data.error || 'Failed to leave challenge'));
    }
  } catch (error) {
    console.error('Error leaving challenge:', error);
    alert('❌ Failed to leave challenge: ' + (error.message || 'Unknown error'));
  }
};
```

**Button Code:**
```jsx
<div className="flex items-center justify-between">
  <div className="text-xs text-green-600 font-medium">
    ✅ Joined
  </div>
  <button
    onClick={() => leaveChallenge(challenge.id)}
    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 hover:underline"
  >
    <X className="w-3 h-3" />
    Leave
  </button>
</div>
```

### 2. ChallengeProgressTracker.jsx

**New Function:**
```javascript
const handleLeaveChallenge = async (challengeId) => {
  if (!window.confirm('Are you sure you want to leave this challenge? Your progress will be lost.')) {
    return;
  }

  try {
    const data = await challengesApi.leave(challengeId);
    if (data.ok) {
      alert('✅ Successfully left challenge!');
      fetchMyData(currentUser.email); // Refresh
    } else {
      alert('❌ ' + (data.error || 'Failed to leave challenge'));
    }
  } catch (error) {
    console.error('Error leaving challenge:', error);
    alert('❌ Failed to leave challenge');
  }
};
```

**Button Code:**
```jsx
<div className="flex gap-2">
  <button className="flex-1 ...">
    <Plus /> Log Progress
  </button>
  <button
    onClick={() => handleLeaveChallenge(challenge.id)}
    className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
    title="Leave challenge"
  >
    <X className="w-4 h-4" />
  </button>
</div>
```

---

## Design Details

### Button Styling

**In Challenges Tab (Text Link):**
- Size: `text-xs` (small, unobtrusive)
- Color: Red (`text-red-600`)
- Hover: Darker red + underline
- Icon: Small X (`w-3 h-3`)

**In Progress Tab (Icon Button):**
- Size: `px-4 py-2` (matches Log Progress height)
- Color: Red text with red border
- Hover: Light red background
- Icon: X mark (`w-4 h-4`)

---

## User Experience Flow

### Happy Path
1. User joins challenge
2. Logs some progress
3. Decides to leave
4. Clicks "Leave" button
5. Confirms in dialog
6. ✅ Success message
7. Challenge disappears from their list

### Cancel Path
1. User clicks "Leave" button
2. Sees confirmation dialog
3. Clicks "Cancel"
4. ❌ Nothing happens
5. Returns to normal view

### Error Path
1. User clicks "Leave" button
2. Confirms in dialog
3. ❌ API error occurs
4. Error message shown
5. Challenge remains in list
6. User can try again

---

## Testing Checklist

- [x] Leave button appears on joined challenges (Challenges tab)
- [x] Leave button appears on challenge cards (Progress tab)
- [x] Confirmation dialog shows before leaving
- [x] Cancel button works in confirmation dialog
- [x] Leave API call executes successfully
- [x] User removed from participants list
- [x] Progress data deleted from database
- [x] Challenge disappears from My Progress tab
- [x] Challenge appears as "Join Challenge" again
- [x] Can rejoin after leaving
- [x] Error handling works if API fails

---

## Files Modified

1. **ChallengesSection.jsx**
   - Added `X` icon import
   - Added `leaveChallenge()` function
   - Added "Leave" text link in challenge cards

2. **ChallengeProgressTracker.jsx**
   - Added `X` icon import
   - Added `handleLeaveChallenge()` function
   - Added icon button next to "Log Progress"

---

## Related Documentation

- [Challenge Workflow Update](./CHALLENGE_WORKFLOW_UPDATE.md) - How to complete challenges
- [Challenge Completion Guide](./CHALLENGE_COMPLETION_GUIDE.md) - Detailed guide for users
- [Challenge UI Fixes](./CHALLENGE_UI_FIXES.md) - Previous UI improvements

---

*Updated: 2025-10-21*
*Feature: Leave Challenge*
*Status: ✅ Complete*
