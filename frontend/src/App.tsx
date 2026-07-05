import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Profile from './pages/Profile';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RoomConfig = lazy(() => import('./pages/RoomConfig'));
const InterviewRoom = lazy(() => import('./pages/InterviewRoom'));
const Interviewee = lazy(() => import('./pages/Interviewee'));

const LoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div className="loading-spinner">Loading...</div>
  </div>
);
// function App() {
//   return (
//     <div>
//       <InterviewRoom />
//     </div>
//   );
// }

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/" replace />} 
          />
          <Route 
            path="/roomConfig" 
            element={
              <ProtectedRoute>
                <RoomConfig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/room/:roomName" 
            element={<InterviewRoom />} 
          />
          <Route 
            path="/interviewee/:roomName" 
            element={
              <ProtectedRoute>
                <Interviewee />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route redirects to landing page (Dashboard/Login) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
