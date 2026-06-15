
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
