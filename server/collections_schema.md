# MongoDB Collections Schema for Fit-Hub Portal

## 1. Users Collection (`users`)
```javascript
{
  _id: ObjectId("..."),
  email: "trainer@fithub.com",
  password: "$2b$12$hashed_password_here",
  firstName: "John",
  lastName: "Smith",
  phone: "+1234567890",
  role: "trainer", // "user", "trainer", "admin"
  createdAt: "2024-01-15T10:30:00.000Z",
  status: "active",
  dateOfBirth: "1990-05-15",
  gender: "male"
}
```

## 2. Tutorials Collection (`tutorials`) - NEW
```javascript
{
  _id: ObjectId("..."),
  title: "Full Body HIIT Workout for Beginners",
  description: "A comprehensive 30-minute high-intensity interval training session perfect for beginners looking to build strength and endurance.",
  category: "fitness", // "fitness", "nutrition", "yoga", "cardio", "strength", "flexibility"
  content: "Detailed workout instructions and steps...",
  difficulty: "beginner", // "beginner", "intermediate", "advanced"
  duration: "30 minutes",
  tags: ["hiit", "full-body", "beginner", "cardio", "strength"],
  videoUrl: "https://youtube.com/watch?v=example",
  imageUrl: "https://example.com/workout-image.jpg",
  trainer_email: "trainer@fithub.com",
  trainer_name: "John Smith",
  created_at: ISODate("2024-01-15T10:30:00.000Z"),
  updated_at: ISODate("2024-01-15T10:30:00.000Z"),
  status: "published", // "draft", "published", "archived"
  views: 150,
  likes: 23,
  
  // Additional metadata
  equipment_needed: ["dumbbells", "mat"],
  target_muscles: ["chest", "legs", "core"],
  calories_burned: 250
}
```

## 3. Queries Collection (`queries`) - NEW
```javascript
{
  _id: ObjectId("..."),
  title: "How to improve my squat form?",
  description: "I've been doing squats for a few weeks but I'm not sure if my form is correct. Can you help me understand the proper technique?",
  category: "fitness", // "fitness", "nutrition", "general", "injury"
  priority: "medium", // "low", "medium", "high"
  status: "open", // "open", "assigned", "resolved", "closed"
  
  // User information
  user_email: "user@example.com",
  user_name: "Jane Doe",
  
  // Trainer assignment
  assigned_trainer: "trainer@fithub.com", // null if unassigned
  response: "Here's how to improve your squat form...", // trainer's response
  
  // Timestamps
  created_at: ISODate("2024-01-15T09:00:00.000Z"),
  updated_at: ISODate("2024-01-15T14:30:00.000Z"),
  responded_at: ISODate("2024-01-15T14:30:00.000Z"), // when trainer responded
  
  // Additional fields
  attachments: ["image1.jpg", "video1.mp4"], // user uploaded files
  rating: 5, // user rating of trainer's response (1-5)
  is_public: false // whether response can be viewed by other users
}
```

## 4. Workouts Collection (`workouts`) - Existing
```javascript
{
  _id: ObjectId("..."),
  user_email: "user@example.com",
  workout_name: "Morning Cardio",
  duration: 30,
  calories_burned: 250,
  date: ISODate("2024-01-15T06:00:00.000Z"),
  exercises: [
    {
      name: "Running",
      duration: 20,
      intensity: "moderate"
    },
    {
      name: "Jumping Jacks", 
      reps: 50,
      sets: 3
    }
  ]
}
```

## 5. User Progress Collection (`user_progress`) - Optional Future Enhancement
```javascript
{
  _id: ObjectId("..."),
  user_email: "user@example.com",
  tutorial_id: ObjectId("..."),
  status: "completed", // "started", "in_progress", "completed"
  progress_percentage: 100,
  started_at: ISODate("2024-01-15T10:00:00.000Z"),
  completed_at: ISODate("2024-01-15T10:30:00.000Z"),
  notes: "Great workout, felt challenging but manageable"
}
```

## Indexes for Performance

### Users Collection
```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
```

### Tutorials Collection  
```javascript
db.tutorials.createIndex({ "trainer_email": 1 })
db.tutorials.createIndex({ "category": 1 })
db.tutorials.createIndex({ "status": 1 })
db.tutorials.createIndex({ "created_at": -1 })
db.tutorials.createIndex({ "views": -1 })
db.tutorials.createIndex({ "tags": 1 })
```

### Queries Collection
```javascript
db.queries.createIndex({ "user_email": 1 })
db.queries.createIndex({ "assigned_trainer": 1 })
db.queries.createIndex({ "status": 1 })
db.queries.createIndex({ "created_at": -1 })
db.queries.createIndex({ "category": 1 })
```

## Collection Relationships

1. **Users → Tutorials**: One trainer can create many tutorials
   - `tutorials.trainer_email` references `users.email`

2. **Users → Queries**: One user can create many queries
   - `queries.user_email` references `users.email`
   - `queries.assigned_trainer` references `users.email` (where role = "trainer")

3. **Tutorials → User Progress**: One tutorial can have many user progress records
   - `user_progress.tutorial_id` references `tutorials._id`
   - `user_progress.user_email` references `users.email`