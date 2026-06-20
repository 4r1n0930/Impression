import { useEffect, useState } from "react";
import { 
  LiveKitRoom, 
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./InterviewRoom.css";

const InterviewRoom = () => {
  const { roomName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(location.state?.userName || "");
  const [email, setEmail] = useState<string>(location.state?.email || "");
  const [isJoining, setIsJoining] = useState(false);

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7800";

  useEffect(() => {
    // If we already have a token or we don't have a userName yet, wait.
    if (!roomName) return;

    const userStr = localStorage.getItem("user");
    if (userStr && !userName) {
      const user = JSON.parse(userStr);
      setUserName(user.name);
      setEmail(user.email);
    }
  }, [roomName, userName]);

  const handleJoin = async (name: string) => {
    setIsJoining(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:5000/livekit/token", {
        roomName,
        userName: name,
        email: email || name, // Fallback to name if email not available
      });
      setToken(res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join room. You might not be authorized.");
    } finally {
      setIsJoining(false);
    }
  };

  const roomLink = window.location.href;

  if (error) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/roomConfig")}>Back to Dashboard</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="prejoin-container">
        <div className="prejoin-card">
          <h2>Join Interview: {roomName}</h2>
          <div className="room-link-display">
            <p>Share this link with participants:</p>
            <div className="link-box">
               <code>{roomLink}</code>
               <button onClick={() => navigator.clipboard.writeText(roomLink)}>Copy</button>
            </div>
          </div>
          <div className="join-form">
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="form-input"
              required
            />
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
            <button 
                onClick={() => handleJoin(userName)} 
                disabled={isJoining || !userName || !email}
                className="submit-button"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-room-wrapper">
      <div className="room-header">
         <span className="room-info">Room: {roomName}</span>
         <div className="link-display-small">
            <input readOnly value={roomLink} />
            <button onClick={() => navigator.clipboard.writeText(roomLink)}>Copy Link</button>
         </div>
      </div>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={LIVEKIT_URL}
        onDisconnected={() => navigate("/")}
        data-lk-theme="default"
        style={{ height: 'calc(100vh - 60px)' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default InterviewRoom;
