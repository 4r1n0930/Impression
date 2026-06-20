import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './RoomConfig.css';

const RoomConfig: React.FC = () => {
  const navigate = useNavigate();
  const [meetingName, setMeetingName] = useState("Interview-" + Math.floor(Math.random() * 1000));
  const [participants, setParticipants] = useState(2);
  const [meetingType, setMeetingType] = useState("Strict");
  const [allowedParticipants, setAllowedParticipants] = useState("");
  const [myName, setMyName] = useState("");
  const [micStatus, setMicStatus] = useState("Not Checked");
  const [cameraStatus, setCameraStatus] = useState("Not Checked");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setMyName(user.name);
    }
  }, []);

  const increaseParticipants = () => {
    if (participants < 6) {
      setParticipants((prev) => prev + 1);
    }
  };

  const decreaseParticipants = () => {
    if (participants > 1) {
      setParticipants((prev) => prev - 1);
    }
  };

  const checkMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setMicStatus("Microphone Working");
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      setMicStatus("Microphone Access Denied");
    }
  };

  const checkCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus("Camera Working");
    } catch (error) {
      setCameraStatus("Camera Access Denied");
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      const participantsList = allowedParticipants
        .split(",")
        .map(p => p.trim())
        .filter(p => p !== "");

      // 1. Create room on backend
      await axios.post("http://localhost:5000/livekit/create-room", {
        roomName: meetingName,
        allowedParticipants: participantsList,
        creator: user?.email || myName,
      });

      // 2. Redirect to the room
      navigate(`/room/${meetingName}`, { 
        state: { 
          userName: myName,
          email: user?.email
        } 
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="room-config-container">
      <div className="room-config-card">
        <div className="room-config-header">
          <h2>Create Meeting</h2>
        </div>

        <form onSubmit={handleSubmit} className="room-config-form">
          {error && <div className="error-message" style={{color: 'red', textAlign: 'center'}}>{error}</div>}
          
          {/* Meeting Name */}
          <div className="form-group">
            <label>Meeting Name</label>
            <input
              className="form-input"
              type="text"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              placeholder="Enter meeting name"
              required
            />
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              className="form-input"
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="Your display name"
              required
            />
          </div>

          {/* Allowed Participants */}
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              type="text"
              value={allowedParticipants}
              onChange={(e) => setAllowedParticipants(e.target.value)}
              placeholder="enter password"
            />
            <span className="help-text">Only these people can join the interview.</span>
          </div>

          {/* Participants Count */}
          <div className="form-group">
            <label>Number of Participants</label>
            <div className="participant-control">
              <button
                type="button"
                className="counter-button"
                onClick={decreaseParticipants}
                disabled={participants <= 1}
              >
                -
              </button>
              <span className="participant-count">{participants}</span>
              <button
                type="button"
                className="counter-button"
                onClick={increaseParticipants}
                disabled={participants >= 6}
              >
                +
              </button>
            </div>
            <span className="help-text">Maximum 6 participants</span>
          </div>

          {/* Meeting Type */}
          <div className="form-group">
            <label>Meeting Type</label>
            <select
              className="form-input"
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
            >
              <option value="Strict">Strict</option>
              <option value="Casual">Casual</option>
            </select>
          </div>

          <div className="media-check-section">
            <div className="form-group">
              <button
                type="button"
                className="secondary-button"
                onClick={checkMicrophone}
              >
                Check Microphone
              </button>
              <p className={`status-text ${micStatus === "Microphone Working" ? "success" : micStatus.includes("Denied") ? "error" : ""}`}>
                {micStatus}
              </p>
            </div>

            <div className="form-group">
              <button
                type="button"
                className="secondary-button"
                onClick={checkCamera}
              >
                Check Camera
              </button>
              <p className={`status-text ${cameraStatus === "Camera Working" ? "success" : cameraStatus.includes("Denied") ? "error" : ""}`}>
                {cameraStatus}
              </p>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-preview"
              />
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Creating..." : "Create Meeting"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomConfig;