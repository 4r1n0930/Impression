import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./InterviewRoom.css";
import { socket } from "./socket";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const InterviewRoom = () => {
  const { roomName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(location.state?.userName || "");
  const [email, setEmail] = useState<string>(location.state?.email || "");
  const [isJoining, setIsJoining] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [question, setQuestion] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState("");

  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  if (!browserSupportsSpeechRecognition) {
    return <h2>Browser does not support Speech Recognition</h2>;
  }

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7800";

  const startQuestion = () => {
    resetTranscript();

    SpeechRecognition.startListening({
      continuous: true,
      language: "en-IN",
    });
  };

  const stopQuestion = async () => {
    SpeechRecognition.stopListening();

    const spokenQuestion = transcript.trim();

    if (!spokenQuestion) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/interview/save-question",
        {
          roomName,
          question: spokenQuestion,
        }
      );

      setCurrentQuestionId(res.data.questionId);
      setQuestion(spokenQuestion);

      console.log("Saved:", spokenQuestion);

      resetTranscript();
    } catch (err) {
      console.error(err);
    }
  };
  const saveQuestion = async (spokenQuestion: string) => {
  try {
    const res = await axios.post(
      "http://localhost:5000/interview/save-question",
      {
        roomName,
        question: spokenQuestion,
      }
    );

    setCurrentQuestionId(res.data.questionId);

    console.log("Question ID:", res.data.questionId);

  } catch (err) {
    console.error(err);
  }
};
    useEffect(() => {
      if (token) {
        SpeechRecognition.startListening({
          continuous: true,
          language: "en-IN",
        });
      }
    }, [token]);
    useEffect(() => {
      console.log("Transcript:", transcript);
    }, [transcript]);

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
  useEffect(() => {
    const handleNewQuestions = (questions: string[]) => {
      setSuggestedQuestions(questions);
    };

    const handleUserJoined = (data: any) => {
      console.log(" User Joined:", data);
      setFeedback(`${data.userName} joined! (${data.totalUsers} users in room)`);
    };

    const handleUserLeft = (data: any) => {
      console.log(" User Left:", data);
      setFeedback(`${data.userName} left! (${data.totalUsers} users in room)`);
    };


    socket.on("newQuestions", handleNewQuestions);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);

    return () => {

      socket.off("newQuestions", handleNewQuestions);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (isListening) {
        saveAnswer(currentQuestion);
      }

      if (roomName && userName) {
        socket.emit("leaveMeeting", {
          roomName,
          userName,
        });
      }
    };
  }, [roomName, userName, isListening]);

  const handleRequestQuestion = async () => {
    try {
      await axios.post("http://localhost:5000/interview/question", {
        roomName,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const saveAnswer = async (question: string) => {
    try {
      SpeechRecognition.stopListening();

      setIsListening(false);

      await axios.post("http://localhost:5000/interview/save-answer", {
        roomName,
        question,
        answer: transcript,
        userName,
  });

      resetTranscript();

    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (name: string) => {
    setIsJoining(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:5000/livekit/token", {
        roomName,
        userName: name,
        email: email || name,
      });

      // Emit join event to Socket.IO
      socket.emit("joinMeeting", {
        roomName,
        userName: name,
        email: email || name,
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
        onDisconnected={async () => {

          if (isListening) {
            await saveAnswer(currentQuestion);
          }

          navigate("/");
        }}
        data-lk-theme="default"
        style={{ height: "calc(100vh - 60px)" }}
      >
        <div className="main-layout">

          {/* LEFT / TOP SIDE - AI SECTION */}
          <div className="ai-panel">
            <h2>Questions</h2>

            <button
              className="request-btn"
              onClick={handleRequestQuestion}
            >
              Generate Questions
            </button>

            {suggestedQuestions.length > 0 && (
              <div className="suggested-questions-container">
                {suggestedQuestions.map((q, index) => (
                  <div
                    key={index}
                    className="suggested-question"
                    onClick={async () => {

                      // Agar pehle se recording chal rahi hai
                      if (isListening) {
                        await saveAnswer(currentQuestion);
                      }

                      // Naya question current question banao
                      setCurrentQuestion(q);

                      resetTranscript();

                      SpeechRecognition.startListening({
                        continuous: true,
                        language: "en-US",
                      });

                      setIsListening(true);

                      await fetch("http://localhost:5000/interview/select-question", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ question: q }),
                      });
                    }}
                  >
                    <span className="suggested-question-number">{index + 1}.</span>
                    <span className="suggested-question-text">{q}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="score-section">
              <h3>
                Score: <span className="score-value">{score}</span>
              </h3>

              {feedback && <p>{feedback}</p>}
            </div>
          </div>

          {/* LIVE VIDEO SECTION */}
          <VideoConference />

        </div>
      </LiveKitRoom>
    </div>
  );
};

export default InterviewRoom;
