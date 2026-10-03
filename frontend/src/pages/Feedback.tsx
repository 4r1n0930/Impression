import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  Target, 
  TrendingUp,
  Brain,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from "lucide-react";
import "../style/Feedback.css";

interface QuestionFeedback {
  id: number;
  question: string;
  answer: string;
  answers?: string[];
  answerCount?: number;
  category?: string;
  score: number;
  technicalAccuracy: number;
  completeness: number;
  communicationClarity: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
}

interface OverallMetrics {
  technicalAccuracy: number;
  completeness: number;
  communicationClarity: number;
  confidence: number;
}

interface FeedbackReportData {
  roomName: string;
  candidateName?: string;
  interviewDate: string;
  durationMinutes: number;
  overallScore: number;
  verdict: string;
  metrics: OverallMetrics;
  summary: string;
  hasLiveData?: boolean;
  questions: QuestionFeedback[];
}

type ReportErrorKind = "auth" | "forbidden" | "missing" | "server";

interface ReportError {
  kind: ReportErrorKind;
  message: string;
}

/** Converts an overall score out of 10 into a 0-100 percentage for the score ring. */
function scoreRingPct(score: unknown): number {
  const value = Number(score);
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value * 10));
}

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { roomName: paramRoomName } = useParams();

  const roomName = paramRoomName || searchParams.get("roomName") || "";
  const [reportData, setReportData] = useState<FeedbackReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ReportError | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1);

  useEffect(() => {
    let isMounted = true;

    setReportData(null);
    setError(null);
    setLoading(true);

    if (!roomName) {
      setError({
        kind: "missing",
        message: "No interview room was specified for this report.",
      });
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    axios
      .get(`${BACKEND_URL}/interview/feedback/${encodeURIComponent(roomName)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        if (!isMounted) return;

        const data = res.data;

        if (data && data.success && Array.isArray(data.questions)) {
          setReportData(data);
        } else {
          setError({
            kind: "server",
            message:
              data?.message || "The server returned an unexpected report payload.",
          });
        }
      })
      .catch((err) => {
        console.error("Error loading interview feedback report:", err);
        if (!isMounted) return;

        const status = err?.response?.status;
        const serverMessage = err?.response?.data?.message;

        if (status === 401) {
          setError({
            kind: "auth",
            message: "Your session has expired. Please sign in again.",
          });
        } else if (status === 403) {
          setError({
            kind: "forbidden",
            message:
              serverMessage || "You do not have access to this interview report.",
          });
        } else if (status === 404) {
          setError({
            kind: "missing",
            message:
              serverMessage ||
              "This interview has no recorded session. Reports are only available while the server is running and before the room is cleared.",
          });
        } else {
          setError({
            kind: "server",
            message:
              serverMessage ||
              "Could not load the report. Please check your connection and try again.",
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomName, reloadNonce]);

  const toggleQuestion = (id: number) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="feedback-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#ffffff" }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: "#60a5fa", margin: "0 auto 16px" }} />
          <h2>Generating Interview Performance Report...</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Analyzing live question evaluations and overall candidate metrics</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthIssue = error.kind === "auth";

    return (
      <div className="feedback-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#ffffff", maxWidth: "480px" }}>
          <AlertCircle size={40} style={{ color: "#f87171", margin: "0 auto 16px" }} />
          <h2 style={{ marginBottom: "8px" }}>
            {isAuthIssue ? "Not Signed In" : "Report Unavailable"}
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
            {error.message}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            {isAuthIssue ? (
              <button className="btn-primary" onClick={() => navigate("/")}>
                <ArrowLeft size={16} />
                <span>Go to Sign In</span>
              </button>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => setReloadNonce((n) => n + 1)}
                >
                  <RotateCcw size={16} />
                  <span>Try Again</span>
                </button>
                <button className="btn-primary" onClick={() => navigate("/dashboard")}>
                  <ArrowLeft size={16} />
                  <span>Dashboard</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  if (!reportData.questions || reportData.questions.length === 0) {
    return (
      <div className="feedback-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#ffffff", maxWidth: "480px" }}>
          <MessageSquare size={40} style={{ color: "#60a5fa", margin: "0 auto 16px" }} />
          <h2 style={{ marginBottom: "8px" }}>No Answers Recorded</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
            This interview session is active, but no answers have been graded yet.
            Reports become available once you have answered at least one question.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              className="btn-secondary"
              onClick={() => setReloadNonce((n) => n + 1)}
            >
              <RotateCcw size={16} />
              <span>Refresh</span>
            </button>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      {/* Header */}
      <header className="feedback-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>
          <div className="title-section">
            <h1>Interview Performance Report</h1>
            <span className="room-badge">{reportData.roomName}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleDownload}>
            <Download size={16} />
            <span>Export Report</span>
          </button>
          <button className="btn-primary" onClick={() => navigate("/roomConfig")}>
            <RotateCcw size={16} />
            <span>New Session</span>
          </button>
        </div>
      </header>

      <main className="feedback-main">
        {/* Hero Score Card */}
        <div className="hero-score-card">
          <div className="score-badge-group">
            <div
              className="score-ring"
              style={{ "--score-pct": `${scoreRingPct(reportData.overallScore)}%` } as React.CSSProperties}
            >
              <span className="score-number">{reportData.overallScore}</span>
              <span className="score-max">/10</span>
            </div>
            <div className="verdict-container">
              <div className="verdict-tag">
                <ShieldCheck size={18} />
                <span>{reportData.verdict}</span>
              </div>
              <h2>Overall AI Assessment</h2>
              <p className="summary-text">{reportData.summary}</p>
            </div>
          </div>

          <div className="meta-stats-grid">
            <div className="stat-box">
              <Clock size={18} className="stat-icon" />
              <div>
                <span className="stat-label">Duration</span>
                <span className="stat-value">{reportData.durationMinutes} mins</span>
              </div>
            </div>
            <div className="stat-box">
              <MessageSquare size={18} className="stat-icon" />
              <div>
                <span className="stat-label">Questions</span>
                <span className="stat-value">{reportData.questions.length} Answered</span>
              </div>
            </div>
            <div className="stat-box">
              <Award size={18} className="stat-icon" />
              <div>
                <span className="stat-label">Date</span>
                <span className="stat-value">{reportData.interviewDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Cards */}
        <section className="metrics-section">
          <h3>
            <TrendingUp size={20} color="#60a5fa" /> Overall Skill Metrics
          </h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span>Technical Accuracy</span>
                <span className="metric-score">{reportData.metrics.technicalAccuracy}/10</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill green" 
                  style={{ width: `${Math.min(100, reportData.metrics.technicalAccuracy * 10)}%` }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Completeness</span>
                <span className="metric-score">{reportData.metrics.completeness}/10</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill purple" 
                  style={{ width: `${Math.min(100, reportData.metrics.completeness * 10)}%` }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Communication Clarity</span>
                <span className="metric-score">{reportData.metrics.communicationClarity}/10</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill blue" 
                  style={{ width: `${Math.min(100, reportData.metrics.communicationClarity * 10)}%` }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Confidence</span>
                <span className="metric-score">{reportData.metrics.confidence}/10</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill emerald" 
                  style={{ width: `${Math.min(100, reportData.metrics.confidence * 10)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Questions & AI Feedback Accordion */}
        <section className="qa-section">
          <h3>
            <Sparkles size={20} color="#a855f7" /> Question-Wise AI Analysis
          </h3>

          <div className="qa-list">
            {reportData.questions.map((q) => {
              const isExpanded = expandedQuestion === q.id;
              return (
                <div key={q.id} className={`qa-card ${isExpanded ? "expanded" : ""}`}>
                  <div className="qa-card-header" onClick={() => toggleQuestion(q.id)}>
                    <div className="qa-title-left">
                      <span className="q-number">Q{q.id}</span>
                      <h4 className="q-text">{q.question}</h4>
                    </div>
                    <div className="qa-title-right">
                      {(q.answerCount ?? 1) > 1 && (
                        <span className="followup-badge" title="Follow-up answers grouped under this question">
                          +{(q.answerCount ?? 1) - 1} follow-up
                        </span>
                      )}
                      <span className="q-score-badge">{q.score} / 10</span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="qa-card-body">
                      {/* Candidate Answer */}
                      <div className="answer-box">
                        <h5>Candidate Answer (Transcribed)</h5>
                        <p>{q.answer}</p>
                      </div>

                      {/* Question-wise Scores: Technical Accuracy, Completeness, Communication Clarity, Confidence */}
                      <div className="sub-scores-row">
                        <div className="sub-score-item">
                          <span className="sub-score-lbl">Technical Accuracy</span>
                          <span className="sub-score-val">{q.technicalAccuracy} / 10</span>
                        </div>
                        <div className="sub-score-item">
                          <span className="sub-score-lbl">Completeness</span>
                          <span className="sub-score-val">{q.completeness} / 10</span>
                        </div>
                        <div className="sub-score-item">
                          <span className="sub-score-lbl">Communication Clarity</span>
                          <span className="sub-score-val">{q.communicationClarity} / 10</span>
                        </div>
                        <div className="sub-score-item">
                          <span className="sub-score-lbl">Confidence</span>
                          <span className="sub-score-val">{q.confidence} / 10</span>
                        </div>
                      </div>

                      {/* Key Strengths & Key Weaknesses */}
                      <div className="feedback-details-grid">
                        <div className="feedback-column strengths">
                          <h5>
                            <CheckCircle2 size={16} className="icon-green" /> Key Strengths
                          </h5>
                          <ul>
                            {q.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="feedback-column weaknesses">
                          <h5>
                            <AlertCircle size={16} className="icon-amber" /> Key Weaknesses
                          </h5>
                          <ul>
                            {q.weaknesses.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Missing Concepts */}
                      {q.missingConcepts.length > 0 ? (
                        <div className="missing-concepts-box">
                          <Brain size={16} color="#a855f7" />
                          <span><strong>Missing Concepts:</strong> {q.missingConcepts.join(", ")}</span>
                        </div>
                      ) : (
                        <div className="missing-concepts-box none">
                          <Brain size={16} color="#10b981" />
                          <span><strong>Missing Concepts:</strong> None identified</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Callout */}
        <section className="recommendations-callout">
          <div className="callout-left">
            <Target size={24} color="#3b82f6" />
            <div>
              <h4>Ready for another round?</h4>
              <p>Practice regularly to build confidence and polish your response timing.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Feedback;
