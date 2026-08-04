import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../config";
import "../style/RoomConfig.css";

const RoomConfig: React.FC = () => {
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [maxInterviewers, setMaxInterviewers] = useState(1);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const increaseInterviewers = () => {
    if (maxInterviewers < 10) {
      setMaxInterviewers((prev) => prev + 1);
    }
  };

  const decreaseInterviewers = () => {
    if (maxInterviewers > 1) {
      setMaxInterviewers((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const nameToUse = roomName.trim() || `room-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND_URL}/rooms`,
        { roomName: nameToUse, maxInterviewers, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const createdRoomName = res.data.room.name;

      navigate(`/interviewee/${encodeURIComponent(createdRoomName)}`, {
        state: { password },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="room-config-container">
      <div className="room-config-card">
        <h2>Create Interview Room</h2>

        <form onSubmit={handleSubmit} className="room-config-form">

          {/* Room Name */}
          <div className="form-group">
            <label>Interview Room Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Name(optional)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>

          {/* Max Interviewers */}
          <div className="form-group">
            <label>Maximum Interviewers</label>

            <div className="participant-control">
              <button
                type="button"
                className="counter-button"
                onClick={decreaseInterviewers}
                disabled={maxInterviewers <= 1}
              >
                -
              </button>

              <span className="participant-count">
                {maxInterviewers}
              </span>

              <button
                type="button"
                className="counter-button"
                onClick={increaseInterviewers}
                disabled={maxInterviewers >= 10}
              >
                +
              </button>
            </div>

            <span className="help-text">
              Candidate is not included in this count.
            </span>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Meeting Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter meeting password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Room"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default RoomConfig;