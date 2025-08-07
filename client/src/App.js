import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ✅ Import all actual components
import SimpleLoginPage from './pages/SimpleLoginPage';
import SignupPage from './pages/SignupPage';
import UserHomePage from './pages/UserHomePage';
import AdminHomePage from './pages/AdminHomePage';

function App() {
  console.log('App component rendering...');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimpleLoginPage />} />
        <Route path="/login" element={<SimpleLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/user-home" element={<UserHomePage />} />
        <Route path="/admin-home" element={<AdminHomePage />} />
        <Route path="/userhome" element={<UserHomePage />} />
        <Route path="/adminhome" element={<AdminHomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
