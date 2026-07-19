import { useEffect, useState } from "react";
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
import { useRef } from "react";
const socket: Socket = io(BACKEND_URL);

const IntervieweeLayout = ({ roomName, name }: { roomName: string; name: string }) => {
  const navigate = useNavigate();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera]);
  const captureRef = useRef<AudioCapture | null>(null);

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

  const interviewerTracks = tracks.filter((t) => !t.participant.isLocal);
  const localTrack = tracks.find((t) => t.participant.isLocal);
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

      <main className="interviewee-main">
        {interviewerTracks.length === 0 ? (
          <p className="waiting-text">Waiting for interviewers to join...</p>
        ) : (
          <div className="interviewer-grid">
            {interviewerTracks.map((t) => (
              <div key={t.participant.identity} className="interviewee-tile">
                <ParticipantTile trackRef={t} />
                <span className="participant-label">{t.participant.name || t.participant.identity}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pip-tile">
          {localTrack && <ParticipantTile trackRef={localTrack} />}
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

const Interviewee = () => {
  const { roomName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const password = (location.state as { password?: string })?.password;

  const [name, setName] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7800";

  useEffect(() => {
    return () => {
      if (roomName && name) {
        socket.emit("leaveMeeting", { roomName, userName: name });
      }
    };
  }, [roomName, name]);

  const handleJoin = async () => {
    if (!name.trim() || !roomName) return;
    setIsJoining(true);
    setError("");

    try {
      const res = await axios.post(`${BACKEND_URL}/api/token`, {
        roomName,
        name,
        password,
        creator: true,
      });

      socket.emit("joinMeeting", {
        roomName,
        userName: name,
        email: name,
        role: "interviewee"
      });

      setToken(res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  if (!password) {
    return (
      <div className="error-container">
        <h2>Invalid Access</h2>
        <p>Please create a room first.</p>
        <button onClick={() => navigate("/roomConfig")}>Go to Room Config</button>
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
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />

            {error && <p className="error-text">{error}</p>}

            <button
              className="submit-button"
              onClick={handleJoin}
              disabled={isJoining || !name.trim()}
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
      onDisconnected={() => navigate("/")}
      data-lk-theme="default"
      className="livekit-container"
    >
      <IntervieweeLayout roomName={roomName || ""} name={name} />
    </LiveKitRoom>
  );
};

export default Interviewee;