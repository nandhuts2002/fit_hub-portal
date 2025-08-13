import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ✅ Import all actual components
import YogaIndexPage from './pages/YogaIndexPage';
import ProfessionalLoginPage from './pages/ProfessionalLoginPage';
import SignupPage from './pages/SignupPage';
import UserHomePage from './pages/UserHomePage';
import AdminHomePage from './pages/AdminHomePage';
import TrainerHomePage from './pages/TrainerHomePage';
import TutorialsPage from './components/TutorialsPage';

function App() {
  console.log('App component rendering...');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<YogaIndexPage />} />
        <Route path="/login" element={<ProfessionalLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/user-home" element={<UserHomePage />} />
        <Route path="/admin-home" element={<AdminHomePage />} />
        <Route path="/trainer-home" element={<TrainerHomePage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/userhome" element={<UserHomePage />} />
        <Route path="/adminhome" element={<AdminHomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
