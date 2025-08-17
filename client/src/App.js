import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ✅ Import all actual components
import YogaIndexPage from './pages/YogaIndexPage';
import ProfessionalLoginPage from './pages/ProfessionalLoginPage';
import SignupPage from './pages/SignupPage';
import UserHomePage from './pages/UserHomePage';
import AdminHomePage from './pages/AdminHomePage';
import TrainerHomePage from './pages/TrainerHomePage';
import TutorialsPage from './components/TutorialsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  console.log('App component rendering...');

  return (
    <Router>
      <Routes>
        {/* Main homepage - Premium Yoga Design */}
        <Route path="/" element={<YogaIndexPage />} />
        
        {/* Authentication routes */}
        <Route path="/login" element={<ProfessionalLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Dashboard routes */}
        <Route path="/user-home" element={
          <ProtectedRoute requiredRole="user">
            <UserHomePage />
          </ProtectedRoute>
        } />
        <Route path="/admin-home" element={
          <ProtectedRoute requiredRole="admin">
            <AdminHomePage />
          </ProtectedRoute>
        } />
        <Route path="/trainer-home" element={
          <ProtectedRoute requiredRole="trainer">
            <TrainerHomePage />
          </ProtectedRoute>
        } />
        <Route path="/tutorials" element={
          <ProtectedRoute>
            <TutorialsPage />
          </ProtectedRoute>
        } />
        
        {/* Legacy route redirects */}
        <Route path="/userhome" element={<Navigate to="/user-home" replace />} />
        <Route path="/adminhome" element={<Navigate to="/admin-home" replace />} />
        
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
