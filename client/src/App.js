import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';

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
import ExtendedCommunityPage from './components/community/ExtendedCommunityPage';
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
import AICoachPage from './pages/services/AICoachPage';
import BMICalculatorPage from './pages/services/BMICalculatorPage';
import CalorieDetectorPage from './pages/services/CalorieDetectorPage';
import ShopProfilePage from './pages/ShopProfilePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ProfilePage from './pages/ProfilePage';
import MyCouponsPage from './pages/MyCouponsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import WorkoutVideosPage from './pages/WorkoutVideosPage';
import YogaProgressTracker from './components/YogaProgressTracker';
import ExerciseProgressTracker from './components/ExerciseProgressTracker';
import BlogDetailPage from './pages/BlogDetailPage';
// If you want a dedicated page for Plate Analyzer later, we can add it similarly.

// Debug component to track current route
const RouteDebugger = () => {
  const location = useLocation();
  console.log('Current route:', location.pathname, 'Search:', location.search);
  return null;
};

function App() {
  console.log('FitHub Application: Initializing...');

  return (
    <ToastProvider>
      <Router>
        <RouteDebugger />
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
          {/* Alias used by Start Workout CTA - now redirects to yoga poses */}
          <Route path="/workouts" element={
            <ProtectedRoute>
              <YogaPosesPage />
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
          {/* Community hub */}
          <Route path="/community" element={
            <ProtectedRoute>
              <ExtendedCommunityPage />
            </ProtectedRoute>
          } />
          {/* Legacy posts view still available if needed */}
          <Route path="/community-posts" element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          } />
          <Route path="/blog/:id" element={
            <ProtectedRoute>
              <BlogDetailPage />
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
          <Route path="/coupons" element={
            <ProtectedRoute>
              <MyCouponsPage />
            </ProtectedRoute>
          } />
          <Route path="/my-tickets" element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          } />
          <Route path="/workout-videos" element={
            <ProtectedRoute>
              <WorkoutVideosPage />
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
          <Route path="/yoga-progress" element={
            <ProtectedRoute>
              <YogaProgressTracker />
            </ProtectedRoute>
          } />
          <Route path="/exercise-progress" element={
            <ProtectedRoute>
              <ExerciseProgressTracker />
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
          <Route path="/services/medical-check" element={<MedicalCheckPage />} />
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
          <Route path="/services/bmi" element={
            <ProtectedRoute>
              <BMICalculatorPage />
            </ProtectedRoute>
          } />
          <Route path="/services/calorie-detector" element={
            <ProtectedRoute>
              <CalorieDetectorPage />
            </ProtectedRoute>
          } />
          {/* AI Coach chat */}
          <Route path="/ai-coach" element={
            <ProtectedRoute>
              <AICoachPage />
            </ProtectedRoute>
          } />

          {/* Legacy route redirects */}
          <Route path="/userhome" element={<Navigate to="/user-home" replace />} />
          <Route path="/adminhome" element={<Navigate to="/admin-home" replace />} />

          {/* Catch all route - redirect to home (only for truly unknown routes) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;