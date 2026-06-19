import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Lazy load components
const Login = lazy(() => import('./Login'));
const Signup = lazy(() => import('./Signup'));
const VerifyEmail = lazy(() => import('./VerifyEmail'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const Dashboard = lazy(() => import('./Dashboard'));
const RoomConfig = lazy(() => import('./RoomConfig'));
const InterviewRoom = lazy(() => import('./InterviewRoom'));

const LoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div className="loading-spinner">Loading...</div>
  </div>
);

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
          
          {/* Catch-all route redirects to landing page (Dashboard/Login) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
