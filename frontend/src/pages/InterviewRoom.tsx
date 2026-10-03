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
import AudioCapture from "../audio/AudioCapture";
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff, Users, Copy, Sparkles, RefreshCw, Check, X } from "lucide-react";

const socket: Socket = io(BACKEND_URL, {
  auth: { token: localStorage.getItem("token") },
});

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
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);

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
    // The backend signals it is about to prompt the next-question agent, so the
    // panel clears itself instead of swapping content abruptly.
    const handlePending = () => {
      setSuggestedQuestions([]);
      setIsLoadingSuggestions(true);
    };

    socket.on("ai-suggestions-pending", handlePending);

    socket.on("ai-suggested-questions", (data) => {
      const parsed = parseSuggestedQuestions(data);
      // Always replace, even with an empty list: keeping stale suggestions after
      // a failed regeneration makes them look current.
      setSuggestedQuestions(parsed);
      setIsLoadingSuggestions(false);
    });

    return () => {
      socket.off("ai-suggestions-pending", handlePending);
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
    navigate("/gratification");
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

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="room-wrapper">
      <header className="room-header">
        <div className="header-left">
          <button
            className={`invite-link-btn ${copiedLink ? "copied" : ""}`}
            onClick={handleCopyLink}
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? "Copied!" : "Invite link"}</span>
          </button>
        </div>
        
        <div className="header-center">
          <h2 className="room-name">{roomName}</h2>
        </div>

        <div className="header-right">
          <button
            className={`ai-trigger-btn ${showAiDrawer ? "active" : ""}`}
            onClick={() => setShowAiDrawer(!showAiDrawer)}
            title="Toggle Optional AI Suggested Questions"
          >
            <Sparkles size={15} />
            <span>AI Questions</span>
            {suggestedQuestions.length > 0 && (
              <span className="ai-count-badge">{suggestedQuestions.length}</span>
            )}
          </button>

          <button className="circular-participants-btn" title={`Participants (${participants.length})`}>
            <Users size={18} />
            <span className="participants-badge">{participants.length}</span>
          </button>
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

          {/* Optional Floating Drawer AI Panel */}
          {showAiDrawer && (
            <div className="ai-drawer-overlay">
              <div className="ai-panel drawer-mode">
                <div className="ai-panel-header">
                  <div className="header-title-group">
                    <Sparkles size={16} />
                    <h3>AI Suggested Questions</h3>
                    <span className="optional-badge">OPTIONAL</span>
                  </div>
                  <button
                    className="ai-close-btn"
                    onClick={() => setShowAiDrawer(false)}
                    aria-label="Close AI panel"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="questions-container">
                  {isLoadingSuggestions ? (
                    <div className="suggestions-loading-state">
                      <div className="loading-header">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Generating question suggestions...</span>
                      </div>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="question-card skeleton-card">
                          <div className="skeleton-line skeleton-badge" />
                          <div className="skeleton-line skeleton-text" />
                          <div className="skeleton-line skeleton-text short" />
                        </div>
                      ))}
                    </div>
                  ) : suggestedQuestions.length === 0 ? (
                    <div className="empty-questions-state">
                      No suggestions available yet. Wait for interviewee responses or click refresh below.
                    </div>
                  ) : (
                    suggestedQuestions.map((item, index) => (
                      <div
                        key={index}
                        className="question-card"
                        onClick={() => handleCopyQuestion(item.question, index)}
                        title="Click to copy question to clipboard"
                      >
                        <div className="question-card-header">
                          <span className="q-badge-num">QUESTION {index + 1}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {item.type && (
                              <span className={`q-type-badge ${item.type.includes("FOLLOW") ? "type-followup" : "type-next"}`}>
                                {item.type.replace("_", " ")}
                              </span>
                            )}
                            {copiedIndex === index ? (
                              <span className="copied-tag">
                                <Check size={12} /> Copied
                              </span>
                            ) : (
                              <Copy size={12} className="copy-icon" />
                            )}
                          </div>
                        </div>
                        <p className="question-text">{item.question}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  className="refresh-btn"
                  disabled={isLoadingSuggestions}
                  onClick={() => {
                    setIsLoadingSuggestions(true);
                    socket.emit("refresh-suggestions", { roomName });
                  }}
                >
                  <RefreshCw size={15} className={isLoadingSuggestions ? "animate-spin" : ""} />
                  {isLoadingSuggestions ? "Generating..." : "Refresh Suggestions"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="room-footer">
        <div className="floating-dock">
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
          <button
            className={`control-btn ai-toggle ${showAiDrawer ? "ai-active" : ""}`}
            onClick={() => setShowAiDrawer(!showAiDrawer)}
            title="Optional AI Suggested Questions"
          >
            <Sparkles size={20} />
          </button>
          <button className="control-btn chat" title="Chat">
            <MessageSquare size={20} />
          </button>
          <button className="control-btn leave" onClick={leaveRoom} title="Leave">
            <PhoneOff size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const InterviewRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [roomStatus, setRoomStatus] = useState<"loading" | "valid" | "invalid">("loading");

  useEffect(() => {
    if (!roomName) return;
    axios
      .get(`${BACKEND_URL}/rooms/${roomName}`)
      .then(() => setRoomStatus("valid"))
      .catch(() => setRoomStatus("invalid"));
  }, [roomName]);

  useEffect(() => {
    const storedUserStr = localStorage.getItem("user");
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser.name || storedUser.email) {
          setUserName(storedUser.name || storedUser.email.split("@")[0]);
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
  }, []);

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
      const headers: Record<string, string> = {};
      if (jwtToken && jwtToken !== "null" && jwtToken !== "undefined") {
        headers.Authorization = `Bearer ${jwtToken}`;
      }

      const res = await axios.post(
        `${BACKEND_URL}/api/token`,
        {
          roomName,
          name: userName,
          password,
          role: "INTERVIEWER",
          creator: false,
        },
        { headers }
      );

      socket.emit("joinMeeting", {
        roomName,
        userName: userName,
        role: "interviewer",
      });

      setToken(res.data.token);
      setLivekitUrl(res.data.livekitUrl);

    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Failed to join room. You might not be authorized.";

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
      serverUrl={livekitUrl}
      onDisconnected={() => {
        navigate("/gratification");
      }}
      data-lk-theme="default"
      className="livekit-container"
    >
      <InterviewerLayout roomName={roomName || ""} name={userName} />
    </LiveKitRoom>
  );
};

export default InterviewRoom;
