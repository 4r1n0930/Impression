import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "../config";
import "../style/InterviewRoom.css";
import "../style/Interviewee.css";
import AudioCapture from "../../public/audio/AudioCapture";
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff, Users, Copy, HelpCircle } from "lucide-react";

const socket: Socket = io(BACKEND_URL);

const IntervieweeLayout = ({ roomName, name }: { roomName: string; name: string }) => {
  const navigate = useNavigate();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const room = useRoomContext();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const captureRef = useRef<AudioCapture | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);

  // Audio PCM capture setup
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
            role: "interviewee",
            participantId: localParticipant.identity,
            speakerName: name,
            pcm: Array.from(pcm),
          });
        });
      } catch (err) {
        console.error("PCM Capture Error:", err);
      }
    };

    startPCM();

    return () => {
      captureRef.current?.stop();
    };
  }, [localParticipant, isMicrophoneEnabled, roomName, name]);

  // Socket event listener for Question
  useEffect(() => {
    socket.on("question:detected", (data: any) => {
      if (data && data.question) {
        setCurrentQuestion(data.question);
      }
    });

    return () => {
      socket.off("question:detected");
    };
  }, []);

  const interviewerTracks = tracks.filter((t: any) => !t.participant.isLocal);
  const localTrack = tracks.find((t: any) => t.participant.isLocal);
  const meetingLink = `${window.location.origin}/room/${roomName}`;

  const leaveRoom = () => {
    socket.emit("leaveMeeting", { roomName, userName: name });
    room.disconnect();
    navigate(`/feedback/${encodeURIComponent(roomName)}`);
  };

  const toggleMic = () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  const toggleCam = () => localParticipant.setCameraEnabled(!isCameraEnabled);
  const toggleScreenShare = () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled);

  return (
    <div className="room-wrapper">
      <header className="room-header">
        <div className="header-left">
          <span className="link-label">Interviewer Link:</span>
          <code className="link-code">{meetingLink}</code>
          <button className="copy-btn" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }} onClick={() => {
            navigator.clipboard.writeText(meetingLink);
            alert("Interviewer link copied!");
          }}>
            <Copy size={13} /> Copy Link
          </button>
        </div>
        <h2 className="room-name">Interview Room: {roomName}</h2>
        <div className="participant-count" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={16} /> {participants.length} (Candidate)
        </div>
      </header>

      <main className="interviewee-main" style={{ display: "flex", gap: "16px", padding: "16px", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {interviewerTracks.length === 0 ? (
            <div className="waiting-container" style={{ textAlign: "center" }}>
              <p className="waiting-text" style={{ fontSize: "20px", color: "#94a3b8" }}>
                Waiting for interviewers to join...
              </p>
            </div>
          ) : (
            <div className="interviewer-grid">
              {interviewerTracks.map((t: any) => (
                <div key={t.participant.identity} className="interviewee-tile">
                  <ParticipantTile trackRef={t} />
                  <span className="participant-label">
                    {t.participant.name || t.participant.identity}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pip-tile">
            {localTrack && (
              <>
                <ParticipantTile trackRef={localTrack} />
                <span className="participant-label">You</span>
              </>
            )}
          </div>
        </div>

        {currentQuestion && (
          <aside className="ai-panel" style={{ width: "300px", flexShrink: 0 }}>
            <div className="current-question-box">
              <h4 style={{ color: "#3b82f6", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <HelpCircle size={16} /> Active Question
              </h4>
              <p style={{ fontSize: "14px", lineHeight: "1.5" }}>{currentQuestion}</p>
            </div>
          </aside>
        )}
      </main>

      <footer className="room-footer">
        <button
          className={"control-btn" + (isMicrophoneEnabled ? " active" : " inactive")}
          onClick={toggleMic}
          title={isMicrophoneEnabled ? "Mute" : "Unmute"}
        >
          {isMicrophoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          className={"control-btn" + (isCameraEnabled ? " active" : " inactive")}
          onClick={toggleCam}
          title={isCameraEnabled ? "Camera Off" : "Camera On"}
        >
          {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          className={"control-btn" + (isScreenShareEnabled ? " screen-active" : " active")}
          onClick={toggleScreenShare}
          title={isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
        >
          <Monitor size={20} />
        </button>
        <button className="control-btn chat" title="Chat">
          <MessageSquare size={20} />
        </button>
        <button className="control-btn leave" onClick={leaveRoom} title="Leave">
          <PhoneOff size={20} />
        </button>
      </footer>
    </div>
  );
};

const Interviewee = () => {
  const { roomName: rawRoomName } = useParams();
  const roomName = decodeURIComponent(rawRoomName || "");
  const location = useLocation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [roomStatus, setRoomStatus] = useState<"loading" | "valid" | "invalid">("loading");

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7800";

  // Check room validity
  useEffect(() => {
    if (!roomName) return;
    axios
      .get(`${BACKEND_URL}/rooms/${roomName}`)
      .then(() => setRoomStatus("valid"))
      .catch(() => setRoomStatus("invalid"));
  }, [roomName]);

  // Auto-fill logged in user info & handle state passed from RoomConfig
  useEffect(() => {
    let uName = name;
    let uEmail = email;

    const storedUserStr = localStorage.getItem("user");
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        if (!uName && (storedUser.name || storedUser.email)) {
          uName = storedUser.name || storedUser.email.split("@")[0];
          setName(uName);
        }
        if (!uEmail && storedUser.email) {
          uEmail = storedUser.email;
          setEmail(storedUser.email);
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }

    const statePass = (location.state as { password?: string })?.password;
    if (statePass) {
      setPassword(statePass);
      if (uName && uEmail && roomName && !token && !isJoining) {
        handleJoinDirect(uName, uEmail, statePass);
      }
    }
  }, [location.state, roomName]);

  const hasJoinedRef = useRef(false);

  const handleJoinDirect = async (uName: string, uEmail: string, pass: string) => {
    if (!uName || !uEmail || !roomName || !pass || hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    setIsJoining(true);
    setError("");

    try {
      const jwtToken = localStorage.getItem("token");

      const res = await axios.post(
        `${BACKEND_URL}/api/token`,
        {
          roomName,
          name,
          password,
          creator: false,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      socket.emit("joinMeeting", {
        roomName,
        userName: uName,
        email: uEmail,
        role: "interviewee"
      });

      setToken(res.data.token);
      setLivekitUrl(res.data.livekitUrl);
    } catch (err: any) {
      hasJoinedRef.current = false;
      setError(err.response?.data?.message || "Failed to join room. Please check password.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoin = async () => {
    handleJoinDirect(name, email, password);
  };

  useEffect(() => {
    return () => {
      if (roomName && name) {
        socket.emit("leaveMeeting", { roomName, userName: name });
      }
    };
  }, [roomName, name]);

  if (roomStatus === "loading") {
    return (
      <div className="error-container">
        <p>Checking room status...</p>
      </div>
    );
  }

  if (roomStatus === "invalid") {
    return (
      <div className="error-container">
        <h2>Room Not Found</h2>
        <p>The meeting room you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="prejoin-container">
        <div className="prejoin-card">
          <h2>Candidate Portal: {roomName}</h2>
          <p className="prejoin-subtitle" style={{ color: "#94a3b8", fontSize: "14px", marginTop: "4px" }}>
            Enter your details & room password to enter the interview
          </p>

          <div className="join-form">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
            <input
              type="password"
              placeholder="Meeting Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />

            {error && <p className="error-text">{error}</p>}

            <button
              className="submit-button"
              onClick={handleJoin}
              disabled={isJoining || !name.trim() || !email.trim() || !password}
            >
              {isJoining ? "Entering Room..." : "Enter Room"}
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
      serverUrl={livekitUrl}
      onDisconnected={() => navigate(`/feedback/${encodeURIComponent(roomName || "")}`)}
      data-lk-theme="default"
      className="livekit-container"
    >
      <IntervieweeLayout roomName={roomName || ""} name={name} />
    </LiveKitRoom>
  );
};

export default Interviewee;