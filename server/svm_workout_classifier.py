import numpy as np
from sklearn import svm
from models import exercise_progress_collection

class WorkoutPerformanceClassifier:
    def __init__(self):
        self.model = svm.SVC(kernel='linear', probability=True)
        self.is_trained = False
    
    def extract_features_and_labels(self, user_email):
        # Get user session data
        sessions = list(exercise_progress_collection.find({'userEmail': user_email}))
        X = []
        y = []
        for s in sessions:
            # Simple rule for label: totalReps or caloriesBurned
            total_reps = s.get('totalReps', 0)
            sets = s.get('sets', 0)
            total_time = s.get('totalTime', 0)
            calories = s.get('caloriesBurned', 0)
            # Label: low, medium, high (define thresholds simply)
            perf = self.assign_performance_label(total_reps, sets, total_time, calories)
            feats = [sets, total_reps, total_time, calories]
            X.append(feats)
            y.append(perf)
        return np.array(X), np.array(y)
    
    def assign_performance_label(self, total_reps, sets, total_time, calories):
        # Simple heuristic: based on total reps & calories
        score = total_reps + 0.5*sets + 0.05*calories + 0.01*total_time
        if score < 30:
            return 'low'
        elif score < 80:
            return 'medium'
        else:
            return 'high'
    
    def fit(self, user_email):
        X, y = self.extract_features_and_labels(user_email)
        if len(set(y)) > 1 and len(X) >= 5:
            self.model.fit(X, y)
            self.is_trained = True
        else:
            self.is_trained = False
    
    def predict_next(self, user_email, next_features):
        """
        next_features: dict with keys: sets, totalReps, totalTime, caloriesBurned
        """
        if not self.is_trained:
            self.fit(user_email)
        feat = [
            next_features.get('sets',0),
            next_features.get('totalReps',0),
            next_features.get('totalTime',0),
            next_features.get('caloriesBurned',0)
        ]
        if self.is_trained:
            return self.model.predict([feat])[0]
        else:
            # Fallback: rules
            return self.assign_performance_label(*feat)
