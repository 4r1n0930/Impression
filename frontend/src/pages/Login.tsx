import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";
import "../style/Login.css";

export interface LoginProps {
  isModal?: boolean;
  initialMode?: "login" | "signup";
  onClose?: () => void;
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({
  isModal = false,
  initialMode = "login",
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"login" | "signup">(initialMode);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (authMode === "login") {
      try {
        const res = await axios.post(`${BACKEND_URL}/auth/login`, {
          email,
          password,
        });
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        if (onSuccess) {
          onSuccess();
        }
        navigate("/dashboard");
      } catch (err: any) {
        if (err.response?.data?.notVerified) {
          navigate("/verify-email", { state: { email } });
        } else {
          setError(
            err.response?.data?.message || "An error occurred during sign in"
          );
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Sign up mode
      try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        if (profilePhoto) {
          formData.append("profilePhoto", profilePhoto);
        }

        await axios.post(`${BACKEND_URL}/auth/register`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        navigate("/verify-email", { state: { email } });
      } catch (err: any) {
        setError(
          err.response?.data?.message || "An error occurred during registration"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    setError("");
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/google`, {
        credential: credentialResponse.credential,
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (onSuccess) {
        onSuccess();
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError("Google authentication failed");
    }
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
  };

  const cardContent = (
    <div className={`login-card ${isModal ? "modal-card" : ""}`}>
      {isModal && onClose && (
        <button
          type="button"
          className="login-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
      )}

      {/* Mode Switcher Tabs */}
      <div className="auth-tab-group">
        <button
          type="button"
          className={`auth-tab ${authMode === "login" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("login");
            setError("");
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("signup");
            setError("");
          }}
        >
          Create Account
        </button>
      </div>

      <div className="login-header">
        <h1>{authMode === "login" ? "Welcome Back" : "Get Started"}</h1>
        <p>
          {authMode === "login"
            ? "Enter your credentials to access your account"
            : "Create your impression account in seconds"}
        </p>
      </div>

      <form onSubmit={handleAuthSubmit} className="login-form">
        {error && <div className="error-message">{error}</div>}

        {authMode === "signup" && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            {authMode === "login" && (
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            )}
          </div>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
            disabled={loading}
          />
        </div>

        {authMode === "signup" && (
          <div className="form-group">
            <label htmlFor="photo">Profile Picture (Optional)</label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
              className="form-input-file"
              disabled={loading}
            />
          </div>
        )}

        <button type="submit" className="login-button" disabled={loading}>
          {loading
            ? authMode === "login"
              ? "Signing In..."
              : "Registering..."
            : authMode === "login"
            ? "Sign In"
            : "Create Account"}
        </button>
      </form>

      <div className="divider">
        <span>OR</span>
      </div>

      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          theme="filled_black"
          shape="rectangular"
          width="300"
        />
      </div>

      <div className="login-footer">
        <p>
          {authMode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            type="button"
            className="login-switch-btn"
            onClick={() => {
              setAuthMode(authMode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {authMode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="login-modal-overlay" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>{cardContent}</div>
      </div>
    );
  }

  return <div className="login-container">{cardContent}</div>;
};

export default Login;
