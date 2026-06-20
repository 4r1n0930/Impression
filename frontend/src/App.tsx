<<<<<<< HEAD

import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  // const [user, setUser] = useState<any>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchDashboardData = async () => {
  //     try {
  //       const token = localStorage.getItem('token');
  //       const res = await axios.get('http://localhost:5000/dashboard/data', {
  //         headers: {
  //           Authorization: `Bearer ${token}`
  //         }
  //       });
  //       setUser(res.data.user);
  //     } catch (err) {
  //       console.error('Failed to fetch dashboard data', err);
  //       // If the token is invalid or expired, the ProtectedRoute might not catch it initially,
  //       // but the API will. You could handle redirect to login here too.
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchDashboardData();
  // }, []);

  // if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="logo">Impression</h1>
        </div>
        <div className="header-right">
          <div className="user-info" style={{ marginRight: '15px', textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: '600' }}>{/*user?.email  ||*/ 'User'}</span>
          </div>
          <div className="avatar">
            <img src="https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff" alt="User Avatar" />
          </div>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="create-interview-container">
          <h2 style={{ marginBottom: '20px' }}>Welcome, Aditi/*user?.email*/!</h2>
          <p className="create-interview-button">
            <Link to=/*"/RoomConfig"*/"/App">Create Interview</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
=======
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
>>>>>>> main
