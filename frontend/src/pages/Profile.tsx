import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";
import "../style/Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await axios.get(`${BACKEND_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setName(res.data.name || "");
        setEmail(res.data.email || "");
        setGeminiApiKey(res.data.geminiApiKey || "");
        setHasApiKey(Boolean(res.data.hasGeminiApiKey));
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");

      if (name.trim()) {
        await axios.put(
          `${BACKEND_URL}/auth/update-name`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await axios.put(
        `${BACKEND_URL}/auth/update-api-key`,
        { geminiApiKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (photo) {
        const formData = new FormData();
        formData.append("profilePhoto", photo);
        await axios.put(
          `${BACKEND_URL}/auth/update-profile-photo`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setHasApiKey(Boolean(geminiApiKey.trim()));
      setMessage("Profile & API Key updated successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND_URL}/auth/send-reset-link`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Failed to send reset link");
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1>Profile & API Settings</h1>
          <p className="profile-subtitle">Manage your account and personal Gemini AI credentials</p>
        </div>

        {message && <div className="profile-alert">{message}</div>}

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} disabled className="form-input disabled" />
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <div className="label-with-status">
            <label>Personal Gemini API Key</label>
            <span className={`status-badge ${hasApiKey ? "configured" : "default"}`}>
              {hasApiKey ? "Personal Key Active" : "Using System Default"}
            </span>
          </div>
          <div className="api-key-input-wrapper">
            <input
              type={showKey ? "text" : "password"}
              placeholder="Paste your Gemini API Key (AIzaSy...)"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="form-input"
            />
            <button
              type="button"
              className="toggle-key-btn"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <small className="field-hint">
            Get your key from Google AI Studio. Leaving empty will use system default.
          </small>
        </div>

        <div className="form-group">
          <label>Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="form-input-file"
          />
        </div>

        <div className="profile-actions">
          <button type="button" className="btn-secondary" onClick={handlePasswordReset}>
            Send Password Reset Link
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;