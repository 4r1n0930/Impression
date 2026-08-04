import { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { BACKEND_URL } from "../config";
import '../style/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BACKEND_URL}/dashboard/data`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getProfileImageUrl = (photoPath: string | undefined) => {
    if (!photoPath) return `https://ui-avatars.com/api/?name=${user?.email?.split('@')[0] || 'User'}&background=3b82f6&color=fff`;
    if (photoPath.startsWith('http')) return photoPath;

    const normalizedPath = photoPath.replace(/\\/g, '/');

    if (normalizedPath.startsWith('uploads/') || normalizedPath.startsWith('/uploads/')) {
      return `${BACKEND_URL}/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
    }

    return `${BACKEND_URL}/uploads/${normalizedPath}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) return <div className="loading-state">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="logo">Impression</h1>
          </div>
        </div>

        <div className="header-right">
          <div className="user-info">
            <span className="user-email">{user?.email || 'User'}</span>
          </div>

          <div className="avatar-wrapper">
            <img
              className="avatar-img"
              src={getProfileImageUrl(user?.profilePhoto)}
              alt="User Avatar"
              onClick={() => setShowMenu(!showMenu)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${user?.email?.split('@')[0] || 'User'}&background=ffffff&color=09090b`;
              }}
            />

            {showMenu && (
              <div className="profile-dropdown-menu">
                <div className="menu-profile-section">
                  <img
                    className="menu-avatar-img"
                    src={getProfileImageUrl(user?.profilePhoto)}
                    alt="Profile"
                  />
                  <p className="menu-user-name">
                    {user?.name || user?.email}
                  </p>
                  <button
                    className="dropdown-btn secondary-btn"
                    onClick={() => navigate("/profile")}
                  >
                    Edit Profile & Settings
                  </button>
                </div>

                <button
                  className="dropdown-btn danger-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h1 className="welcome-title">
              Welcome back, {user?.name || user?.email?.split("@")[0]}
            </h1>
            <p className="welcome-subtitle">
              Create and manage AI mock impressions with ease.
            </p>
          </div>

          <div className="action-card">
            <Link to="/roomConfig" className="create-interview-button">
              <span className="plus-icon">+</span>
              Create Impression
            </Link>
          </div>

          <div className="recent-card">
            <h3>Recent Activity</h3>
            <p>No impressions yet. Create your first impression.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
