import { useEffect, useState, useRef } from "react";
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
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff, Users, Copy, Sparkles, RefreshCw, Check } from "lucide-react";

const socket: Socket = io(BACKEND_URL);

interface SuggestedQuestionItem {
  type?: string;
  question: string;
}

const parseSuggestedQuestions = (data: any): SuggestedQuestionItem[] => {
  if (!data) return [];
  if (data.questions && Array.isArray(data.questions)) {
    return data.questions.map((q: any) => {
      if (typeof q === "string") return { question: q };
      return {
        type: q.type || q.action || "NEXT",
        question: q.question || q.suggestedQuestion || String(q)
      };
    });
  }
  if (Array.isArray(data)) {
    return data.map((q: any) => {
      if (typeof q === "string") return { question: q };
      return {
        type: q.type || q.action || "NEXT",
        question: q.question || q.suggestedQuestion || String(q)
      };
    });
  }
  if (typeof data === "object") {
    if (data.question) return [{ type: data.type || "NEXT", question: data.question }];
    if (data.suggestedQuestion) return [{ type: data.action || "NEXT", question: data.suggestedQuestion }];
  }
  return [];
};

const InterviewerLayout = ({ roomName, name }: { roomName: string; name: string }) => {
  const navigate = useNavigate();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const captureRef = useRef<AudioCapture | null>(null);
  const room = useRoomContext();

  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const screenShareTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);

  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
        });
      } catch (err) {
        console.error(err);
      }
    };

    startPCM();

    return () => {
      captureRef.current?.stop();
    };
  }, [localParticipant, isMicrophoneEnabled, roomName, name]);

  useEffect(() => {
    socket.on("ai-suggested-questions", (data) => {
      const parsed = parseSuggestedQuestions(data);
      if (parsed.length > 0) {
        setSuggestedQuestions(parsed);
      }
      setIsLoadingSuggestions(false);
    });

    return () => {
      socket.off("ai-suggested-questions");
    };
  }, []);

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isInterviewee = (participant: any) => {
    if (!participant) return false;
    try {
      const meta = JSON.parse(participant.metadata || "{}");
      if (meta.role === "INTERVIEWEE" || meta.role === "interviewee") return true;
    } catch (e) {
      // ignore
    }
    return false;
  };

  // Identify remote candidate (interviewee)
  const candidateTrackRef = cameraTracks.find((t: any) => !t.participant.isLocal && isInterviewee(t.participant))
    || cameraTracks.find((t: any) => !t.participant.isLocal);

  const candidateIdentity = candidateTrackRef?.participant?.identity;

  // Top row: All interviewers (local + remote co-interviewers)
  const interviewerTracks = cameraTracks.filter(
    (t: any) => t.participant.identity !== candidateIdentity
  );

  // Candidate camera track
  const candidateCamTrack = candidateIdentity
    ? cameraTracks.find((t: any) => t.participant.identity === candidateIdentity)
    : null;

  // Candidate screen share track (if active)
  const candidateScreenTrack = candidateIdentity
    ? screenShareTracks.find((t: any) => t.participant.identity === candidateIdentity)
    : null;

  const meetingLink = `${window.location.origin}/room/${roomName}`;

  const leaveRoom = () => {
    socket.emit("leaveMeeting", { roomName, userName: name });
    room.disconnect();
    navigate(`/feedback/${encodeURIComponent(roomName)}`);
  };

  const toggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (e) {
      console.error("Error toggling mic:", e);
    }
  };

  const toggleCam = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (e) {
      console.error("Error toggling camera:", e);
    }
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (e) {
      console.error("Error toggling screen share:", e);
    }
  };

  return (
    <div className="room-wrapper">
      <header className="room-header">
        <div className="header-left">
          <span className="link-label">Link:</span>
          <code className="link-code">{meetingLink}</code>
          <button className="copy-btn" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }} onClick={() => navigator.clipboard.writeText(meetingLink)}>
            <Copy size={13} /> Copy
          </button>
        </div>
        <h2 className="room-name">{roomName}</h2>
        <div className="participant-count" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={16} /> {participants.length}
        </div>
      </header>

      <main className="interview-room-main">
        <div className="interview-content">
          <div className="video-section">
            {/* Top Row: All Interviewers */}
            <div className="interviewer-row">
              {interviewerTracks.length === 0 ? (
                <p className="waiting-text">No interviewers</p>
              ) : (
                interviewerTracks.map((t: any) => (
                  <div key={t.participant.identity + "_" + (t.source || "cam")} className="interviewer-tile">
                    <ParticipantTile trackRef={t} />
                    <span className="participant-label">
                      {t.participant.name || t.participant.identity} {t.participant.isLocal ? "(You)" : ""}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Center Area: Participant & Screen Share (if shared) */}
            <div className="interviewee-section">
              {!candidateIdentity ? (
                <div className="waiting-container" style={{ textAlign: "center" }}>
                  <p className="waiting-text">Waiting for interviewee to join...</p>
                </div>
              ) : (
                <div className={`interviewee-stage-container ${candidateScreenTrack ? "has-screen-share" : ""}`}>
                  {/* Candidate Screen Share if active */}
                  {candidateScreenTrack && (
                    <div className="interviewee-tile-large screen-tile">
                      <ParticipantTile trackRef={candidateScreenTrack} />
                      <span className="participant-label">
                        {candidateScreenTrack.participant.name || "Interviewee"}'s Screen
                      </span>
                    </div>
                  )}

                  {/* Candidate Camera */}
                  {candidateCamTrack && (
                    <div className="interviewee-tile-large">
                      <ParticipantTile trackRef={candidateCamTrack} />
                      <span className="participant-label">
                        {candidateCamTrack.participant.name || "Interviewee"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ai-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "16px" }}>
                <Sparkles size={18} color="#60a5fa" /> AI Suggested Questions
              </h3>
              {isLoadingSuggestions && (
                <RefreshCw size={14} className="animate-spin" style={{ color: "#60a5fa" }} />
              )}
            </div>

            <div className="questions-container" style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto" }}>
              {suggestedQuestions.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "24px 12px", fontSize: "13px", lineHeight: "1.5" }}>
                  {isLoadingSuggestions ? "Generating intelligent question suggestions..." : "No suggestions available yet. Click refresh below or wait for interviewee responses."}
                </div>
              ) : (
                suggestedQuestions.map((item, index) => (
                  <div
                    key={index}
                    className="question-card"
                    onClick={() => handleCopyQuestion(item.question, index)}
                    title="Click to copy question to clipboard"
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#60a5fa", letterSpacing: "0.5px" }}>
                        QUESTION {index + 1}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {item.type && (
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              backgroundColor: item.type.includes("FOLLOW") ? "rgba(234, 179, 8, 0.2)" : "rgba(59, 130, 246, 0.2)",
                              color: item.type.includes("FOLLOW") ? "#fde047" : "#93c5fd",
                              border: item.type.includes("FOLLOW") ? "1px solid rgba(234, 179, 8, 0.4)" : "1px solid rgba(59, 130, 246, 0.4)"
                            }}
                          >
                            {item.type.replace("_", " ")}
                          </span>
                        )}
                        {copiedIndex === index ? (
                          <span style={{ fontSize: "11px", color: "#4ade80", display: "flex", alignItems: "center", gap: "2px" }}>
                            <Check size={12} /> Copied
                          </span>
                        ) : (
                          <Copy size={12} style={{ color: "#9ca3af", opacity: 0.6 }} />
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.45", color: "#f3f4f6", fontWeight: 400 }}>
                      {item.question}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              className="refresh-btn"
              disabled={isLoadingSuggestions}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isLoadingSuggestions ? 0.7 : 1 }}
              onClick={() => {
                setIsLoadingSuggestions(true);
                socket.emit("refresh-suggestions", { roomName });
              }}
            >
              <RefreshCw size={16} className={isLoadingSuggestions ? "animate-spin" : ""} />
              {isLoadingSuggestions ? "Generating..." : "Refresh Suggestions"}
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

const InterviewRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
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
    if (!userName.trim() || !roomName) return;
    setIsJoining(true);
    setError(null);

    try {
      const jwtToken = localStorage.getItem("token");

      const res = await axios.post(
        `${BACKEND_URL}/api/token`,
        {
          roomName,
          name: userName,
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
        userName: userName,
        role: "interviewer"
      });

      setToken(res.data.token);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to join room. You might not be authorized.";
      setError(msg);
      if (msg.toLowerCase().includes("full")) {
        alert(msg);
        navigate("/");
      }
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
        <button onClick={() => navigate("/")}>Back to Landing</button>
      </div>
    );
  }

  if (error) {
    const isRoomFull = error.toLowerCase().includes("full");
    return (
      <div className="error-container">
        <h2>{isRoomFull ? "Room Full" : "Access Denied"}</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back to Landing</button>
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
              disabled={isJoining || !userName || !password}
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
        navigate(`/feedback/${encodeURIComponent(roomName || "")}`);
      }}
      data-lk-theme="default"
      className="livekit-container"
    >
      <InterviewerLayout roomName={roomName || ""} name={userName} />
    </LiveKitRoom>
  );
};

export default InterviewRoom;
