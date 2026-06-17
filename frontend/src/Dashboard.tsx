import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/dashboard/data', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Dashboard data fetched:', res.data);
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        // If the token is invalid or expired, the ProtectedRoute might not catch it initially,
        // but the API will. You could handle redirect to login here too.
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getProfileImageUrl = (photoPath: string | undefined) => {
    if (!photoPath) return `https://ui-avatars.com/api/?name=${user?.email?.split('@')[0] || 'User'}&background=3b82f6&color=fff`;
    if (photoPath.startsWith('http')) return photoPath;
    
    // Normalize path (replace backslashes with forward slashes)
    const normalizedPath = photoPath.replace(/\\/g, '/');
    
    // Check if path already starts with uploads/ or /uploads/
    if (normalizedPath.startsWith('uploads/') || normalizedPath.startsWith('/uploads/')) {
      return `http://localhost:5000/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
    }
    
    return `http://localhost:5000/uploads/${normalizedPath}`;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="logo">Impression</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info" style={{ marginRight: '15px', textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: '600' }}>{user?.email || 'User'}</span>
          </div>
          <div className="avatar">
            <img 
              src={getProfileImageUrl(user?.profilePhoto)} 
              alt="User Avatar" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = `https://ui-avatars.com/api/?name=${user?.email?.split('@')[0] || 'User'}&background=3b82f6&color=fff`;
              }}
            />
          </div>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="create-interview-container">
          <h2 style={{ marginBottom: '20px' }}>Welcome, {user?.email}!</h2>
          <Link to="/RoomConfig" className="create-interview-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="plus-icon">+</span>
            Create Interview
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
