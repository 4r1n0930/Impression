import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const navigate = useNavigate();

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
  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = e.target.files?.[0];

      if (!file) return;

      setUploading(true);

      const formData = new FormData();
      formData.append("profilePhoto", file);

      const token = localStorage.getItem("token");

      const res = await axios.put(
        "http://localhost:5000/auth/update-profile-photo",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser({
        ...user,
        profilePhoto: res.data.profilePhoto,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }

  }
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user")
    navigate("/login");
  }

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
          <div className="avatar"
            style={{ position: "relative", cursor: "pointer" }}
          >
            <img
              src={getProfileImageUrl(user?.profilePhoto)}
              alt="User Avatar"
              onClick={() => setShowMenu(!showMenu)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${user?.email?.split('@')[0] || 'User'}&background=3b82f6&color=fff`;
              }}
            />

            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  right: "0",
                  width: "220px",
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  zIndex: 1000,
                  color: "#000"
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "10px"
                  }}
                >
                  <img
                    src={getProfileImageUrl(user?.profilePhoto)}
                    alt="Profile"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%"
                    }}
                  />

                  <p
                    style={{
                      marginTop: "8px",
                      fontWeight: "bold"
                    }}
                  >
                    {user?.name || user?.email}
                  </p>
                  <button
                    onClick={async () => {
                      const newName = prompt("Enter new name", user?.name);

                      if (!newName) return;

                      try {
                        const token = localStorage.getItem("token");
                        
                        const res = await axios.put(
                          "http://localhost:5000/auth/update-name",
                          { name: newName },
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );

                        setUser({
                          ...user,
                          name: res.data.name,
                        });

                        alert("Name updated successfully!");

                      } catch (error) {
                        console.error(error);
                        alert("Failed to update name");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginTop: "10px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      background: "#f3f4f6",
                      textAlign: "center"
                    }}
                  >
                    Change Name
                  </button>
                </div>

                <label
                  style={{
                    display: "block",
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #ddd"
                  }}
                >
                  {uploading ? "Uploading..." : "Change Photo"}

                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "8px",
                    border: "none",
                    borderRadius: "6px",
                    background: "#ef4444",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="create-interview-container">
          <h2 style={{ marginBottom: '20px' }}>Welcome, {user?.email}!</h2>
          <Link to="/roomConfig" className="create-interview-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="plus-icon">+</span>
            Create Interview
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
