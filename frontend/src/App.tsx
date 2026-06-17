import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import VerifyEmail from './VerifyEmail';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Dashboard';
import RoomConfig from './RoomConfig';
import ProtectedRoute from './ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
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
        
        {/* Catch-all route redirects to landing page (Dashboard/Login) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
