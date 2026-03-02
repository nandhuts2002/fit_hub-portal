try:
    import numpy as np
    from sklearn import svm
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    np = None

from models import exercise_progress_collection

class WorkoutPerformanceClassifier:
    def __init__(self):
        if SKLEARN_AVAILABLE:
            self.model = svm.SVC(kernel='linear', probability=True)
        else:
            self.model = None
        self.is_trained = False

    def extract_features_and_labels(self, user_email):
        sessions = list(exercise_progress_collection.find({'userEmail': user_email}))
        X = []
        y = []
        for s in sessions:
            total_reps = s.get('totalReps', 0)
            sets = s.get('sets', 0)
            total_time = s.get('totalTime', 0)
            calories = s.get('caloriesBurned', 0)
            perf = self.assign_performance_label(total_reps, sets, total_time, calories)
            X.append([sets, total_reps, total_time, calories])
            y.append(perf)
        if SKLEARN_AVAILABLE and X:
            return np.array(X), np.array(y)
        return X, y

    def assign_performance_label(self, total_reps, sets, total_time, calories):
        # Pure-Python heuristic — works with or without numpy
        score = total_reps + 0.5 * sets + 0.05 * calories + 0.01 * total_time
        if score < 30:
            return 'low'
        elif score < 80:
            return 'medium'
        else:
            return 'high'

    def fit(self, user_email):
        if not SKLEARN_AVAILABLE:
            self.is_trained = False
            return
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
        feat = [
            next_features.get('sets', 0),
            next_features.get('totalReps', 0),
            next_features.get('totalTime', 0),
            next_features.get('caloriesBurned', 0),
        ]
        if SKLEARN_AVAILABLE and not self.is_trained:
            self.fit(user_email)
        if SKLEARN_AVAILABLE and self.is_trained:
            return self.model.predict([feat])[0]
        # Fallback: pure-Python rule-based
        return self.assign_performance_label(*feat)
