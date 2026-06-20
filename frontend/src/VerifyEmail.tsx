import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get email from location state if available
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/auth/verify-email",
        { email, code: verificationCode }
      );

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      setSuccess("Email verified successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid or expired verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      return setError("Please enter your email to resend the code");
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // We don't have a dedicated resend endpoint yet, but register can act as one or we can add one.
      // For now, let's assume register doesn't work for existing users.
      // I'll add a resend-code endpoint in the backend.
      await axios.post("http://localhost:5000/auth/resend-code", { email });
      setSuccess("New verification code sent!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Verify Email</h1>
          <p>Enter the code sent to your email</p>
        </div>

        <form onSubmit={handleVerify} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '12px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>{success}</div>}
          
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
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Didn't receive a code? <button onClick={handleResend} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, font: 'inherit' }}>Resend</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
