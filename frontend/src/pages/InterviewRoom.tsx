import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  ParticipantTile,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../config";
import "../style/InterviewRoom.css";
import { io, Socket } from "socket.io-client";
import AudioCapture from "../../public/audio/AudioCapture";
import { useRef } from "react";

const socket: Socket = io(BACKEND_URL);

const InterviewerLayout = ({ roomName, name }: { roomName: string; name: string }) => {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const captureRef = useRef<AudioCapture | null>(null);
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What is HashMap?",
    "Explain ConcurrentHashMap.",
    "Difference between HashMap and Hashtable."
  ]);

  useEffect(() => {
    const startPCM = async () => {
      try {
        const publication = localParticipant.getTrackPublication(
          Track.Source.Microphone
        );

        if (!publication) {
          console.log("Microphone publication not found");
          return;
        }

        const localAudioTrack = publication.track;

        if (!localAudioTrack) {
          console.log("Local audio track not found");
          return;
        }

        const mediaTrack = localAudioTrack.mediaStreamTrack;

        if (!mediaTrack) {
          console.log("MediaStreamTrack not found");
          return;
        }

        const stream = new MediaStream([mediaTrack]);

        const capture = new AudioCapture();
        captureRef.current = capture;

        await capture.start(stream, (pcm) => {
          if (!isMicrophoneEnabled) return;

          socket.emit("pcm-data", {
            roomName,
            role: "interviewer",
            participantId: localParticipant.identity,
            speakerName: name,
            pcm: Array.from(pcm),
          });

          // next step
          // socket.emit(...)
        });
      } catch (err) {
        console.error(err);
      }
    };

    startPCM();

    return () => {
      captureRef.current?.stop();
    };
  }, [localParticipant, isMicrophoneEnabled]);

  useEffect(() => {
    socket.on("ai-suggested-questions", (questions) => {
      setSuggestedQuestions(questions);
    });

    return () => {
      socket.off("ai-suggested-questions");
    };
  }, []);


  const intervieweeTrack = tracks.find((t) => !t.participant.identity.startsWith("interviewer-"));
  const interviewerTracks = tracks.filter((t) => t.participant.identity.startsWith("interviewer-"));
  const meetingLink = `${window.location.origin}/room/${roomName}`;

  const leaveRoom = () => {
    socket.emit("leaveMeeting", { roomName, userName: name });
    room.disconnect();
  };

  const toggleMic = () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  const toggleCam = () => localParticipant.setCameraEnabled(!isCameraEnabled);
  const toggleScreenShare = () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled);

  return (
    <div className="room-wrapper">
      <header className="room-header">
        <div className="header-left">
          <span className="link-label">Link:</span>
          <code className="link-code">{meetingLink}</code>
          <button className="copy-btn" onClick={() => navigator.clipboard.writeText(meetingLink)}>
            Copy
          </button>
        </div>
        <h2 className="room-name">{roomName}</h2>
        <div className="participant-count">👥 {participants.length}</div>
      </header>

      <main className="interview-room-main">
        <div className="interview-content">
          <div className="video-section">
            <div className="interviewer-row">
              {interviewerTracks.length === 0 ? (
                <p className="waiting-text">No other interviewers</p>
              ) : (
                interviewerTracks.map((t) => (
                  <div key={t.participant.identity} className="interviewer-tile">
                    <ParticipantTile trackRef={t} />
                    <span className="participant-label">
                      {t.participant.name || t.participant.identity}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="interviewee-section">
              {intervieweeTrack ? (
                <div className="interviewee-tile-large">
                  <ParticipantTile trackRef={intervieweeTrack} />
                  <span className="participant-label">
                    {intervieweeTrack.participant.name || "Interviewee"}
                  </span>
                </div>
              ) : (
                <p className="waiting-text">Waiting for interviewee to join...</p>
              )}
            </div>
          </div>

          <div className="ai-panel">
            <h3>🤖 AI Suggested Questions</h3>

            {suggestedQuestions.map((question, index) => (
              <div key={index} className="question-card">
                {index + 1}. {question}
              </div>
            ))}

            <button
              className="refresh-btn"
              onClick={() => {
                socket.emit("refresh-suggestions", { roomName });
              }}
            >
              🔄 Refresh Suggestions
            </button>
          </div>
        </div>
      </main>

      <footer className="room-footer">
        <button
          className={"control-btn" + (isMicrophoneEnabled ? " active" : " inactive")}
          onClick={toggleMic}
          title={isMicrophoneEnabled ? "Mute" : "Unmute"}
        >
          {isMicrophoneEnabled ? "🎤" : "🔇"}
        </button>
        <button
          className={"control-btn" + (isCameraEnabled ? " active" : " inactive")}
          onClick={toggleCam}
          title={isCameraEnabled ? "Camera Off" : "Camera On"}
        >
          {isCameraEnabled ? "📹" : "🚫"}
        </button>
        <button
          className={"control-btn" + (isScreenShareEnabled ? " screen-active" : " active")}
          onClick={toggleScreenShare}
          title={isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
        >
          🖥️
        </button>
        <button className="control-btn chat" title="Chat">
          💬
        </button>
        <button className="control-btn leave" onClick={leaveRoom} title="Leave">
          📞
        </button>
      </footer>
    </div>
  );
};

const InterviewRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [roomStatus, setRoomStatus] = useState<"loading" | "valid" | "invalid">("loading");

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7800";

  useEffect(() => {
    if (!roomName) return;
    axios
      .get(`${BACKEND_URL}/rooms/${roomName}`)
      .then(() => setRoomStatus("valid"))
      .catch(() => setRoomStatus("invalid"));
  }, [roomName]);



  useEffect(() => {
    return () => {
      if (roomName && userName) {
        socket.emit("leaveMeeting", { roomName, userName });
      }
    };
  }, [roomName, userName]);

  const handleJoin = async () => {
    if (!userName.trim() || !email.trim() || !roomName) return;
    setIsJoining(true);
    setError(null);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/token`, {
        roomName,
        name: userName,
        password,
        creator: false,
      });

      socket.emit("joinMeeting", {
        roomName,
        userName: userName,
        email: email,
        role: "interviewer"
      });

      setToken(res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join room. You might not be authorized.");
    } finally {
      setIsJoining(false);
    }
  };

  if (roomStatus === "loading") {
    return (
      <div className="error-container">
        <p>Checking room...</p>
      </div>
    );
  }

  if (roomStatus === "invalid") {
    return (
      <div className="error-container">
        <h2>Room not found</h2>
        <p>The meeting room you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/")}>Back to Dashboard</button>
      </div>
    );
  }

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
            <input
              type="password"
              placeholder="Enter room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
            <button
              className="submit-button"
              onClick={() => handleJoin()}
              disabled={isJoining || !userName || !email || !password}
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={LIVEKIT_URL}
      onDisconnected={() => {
        navigate("/");
      }}
      data-lk-theme="default"
      className="livekit-container"
    >
      <InterviewerLayout roomName={roomName || ""} name={userName} />
    </LiveKitRoom>
  );
};

export default InterviewRoom;
