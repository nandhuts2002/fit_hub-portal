import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ✅ Import all actual components
import YogaIndexPage from './pages/YogaIndexPage';
import ProfessionalLoginPage from './pages/ProfessionalLoginPage';
import SignupPage from './pages/SignupPage';
import UserHomePage from './pages/UserHomePage';
import AdminHomePage from './pages/AdminHomePage';
import TrainerHomePage from './pages/TrainerHomePage';
import TrainerExerciseManagement from './pages/TrainerExerciseManagement';
import TutorialsPage from './components/TutorialsPage';
import ProtectedRoute from './components/ProtectedRoute';
import MyQueriesChat from './pages/MyQueriesChat';
import ShopPage from './pages/ShopPage';
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import CommunityPage from './pages/CommunityPage';
import QueryDetailPage from './pages/QueryDetailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OrderSummaryPage from './pages/OrderSummaryPage';
import MyOrdersPage from './pages/MyOrdersPage';
import LocationFeaturesPage from './pages/LocationFeaturesPage';
import ExerciseDatabasePage from './pages/ExerciseDatabasePageFixed';
import YogaPosesPage from './pages/YogaPosesPage';
import ServicesPage from './pages/ServicesPage';
import AIPlannerPage from './pages/services/AIPlannerPage';
import ExerciseExplorerPage from './pages/services/ExerciseExplorerPage';
import BodyPartSelectionPage from './pages/services/BodyPartSelectionPage';
import MedicalCheckPage from './pages/services/MedicalCheckPage';
import LiveSessionsPage from './pages/services/LiveSessionsPage';
import LiveSessionDetail from './pages/services/LiveSessionDetail';
import ShopProfilePage from './pages/ShopProfilePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ProfilePage from './pages/ProfilePage';
// If you want a dedicated page for Plate Analyzer later, we can add it similarly.

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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
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
        <Route path="/trainer/exercise-management" element={
          <ProtectedRoute requiredRole="trainer">
            <TrainerExerciseManagement />
          </ProtectedRoute>
        } />
        <Route path="/tutorials" element={
          <ProtectedRoute>
            <TutorialsPage />
          </ProtectedRoute>
        } />
        <Route path="/queries" element={
          <ProtectedRoute>
            <MyQueriesChat />
          </ProtectedRoute>
        } />
        <Route path="/queries/:id" element={
          <ProtectedRoute>
            <QueryDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/shop" element={
          <ProtectedRoute>
            <ShopPage />
          </ProtectedRoute>
        } />
        <Route path="/shop/products/:id" element={
          <ProtectedRoute>
            <ProductDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/shop/profile" element={
          <ProtectedRoute>
            <ShopProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/u/:handle" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/p/:email" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/wishlist" element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        } />
        {/* Community feed (Instagram-like) */}
        <Route path="/community" element={
          <ProtectedRoute>
            <CommunityPage />
          </ProtectedRoute>
        } />
        <Route path="/community-posts" element={
          <ProtectedRoute>
            <CommunityPage />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <MyOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <OrderSummaryPage />
          </ProtectedRoute>
        } />
        <Route path="/location-features" element={
          <ProtectedRoute>
            <LocationFeaturesPage />
          </ProtectedRoute>
        } />
        <Route path="/exercise-database" element={
          <ProtectedRoute>
            <ExerciseDatabasePage />
          </ProtectedRoute>
        } />
        <Route path="/yoga-poses" element={
          <ProtectedRoute>
            <YogaPosesPage />
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        } />
        <Route path="/services/live" element={
          <ProtectedRoute>
            <LiveSessionsPage />
          </ProtectedRoute>
        } />
        <Route path="/services/live/:id" element={
          <ProtectedRoute>
            <LiveSessionDetail />
          </ProtectedRoute>
        } />
        <Route path="/services/body-part-selection" element={
          <ProtectedRoute>
            <BodyPartSelectionPage />
          </ProtectedRoute>
        } />
        <Route path="/services/exercise-explorer" element={
          <ProtectedRoute>
            <ExerciseExplorerPage />
          </ProtectedRoute>
        } />
        <Route path="/services/medical-check" element={
          <ProtectedRoute>
            <MedicalCheckPage />
          </ProtectedRoute>
        } />
        <Route path="/services/exercises" element={
          <ProtectedRoute>
            <ExerciseExplorerPage />
          </ProtectedRoute>
        } />
        <Route path="/services/ai-planner" element={
          <ProtectedRoute>
            <AIPlannerPage />
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
