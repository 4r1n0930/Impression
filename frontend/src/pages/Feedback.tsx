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
  questions: QuestionFeedback[];
}

const DUMMY_FEEDBACK_DATA: FeedbackReportData = {
  roomName: "Java-Backend-Senior-Role",
  candidateName: "Candidate",
  interviewDate: new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
  durationMinutes: 28,
  overallScore: 8.8,
  verdict: "Strong Candidate",
  metrics: {
    technicalAccuracy: 9.0,
    completeness: 8.5,
    communicationClarity: 8.8,
    confidence: 8.7,
  },
  summary: "Demonstrated strong core knowledge of Java concurrency, memory management, and data structures. Clear articulation of trade-offs and performance characteristics.",
  questions: [
    {
      id: 1,
      question: "How does HashMap work internally in Java 8+, and how are hash collisions handled?",
      answer: "HashMap uses an array of bucket nodes. It computes hash code of the key and uses bitwise AND operation to locate the index. In case of collisions, elements are stored in a linked list. In Java 8, when a bucket list exceeds 8 items and array capacity is at least 64, it automatically converts from a linked list to a Red-Black Tree for O(log n) lookup performance.",
      score: 9.5,
      technicalAccuracy: 9.8,
      completeness: 9.0,
      communicationClarity: 9.5,
      confidence: 9.2,
      strengths: [
        "Accurately described bucket index calculation and hashing mechanism.",
        "Highlighted the Java 8 Treeification threshold (8 elements) and tree-bin conversion rule.",
        "Correctly stated O(log n) time complexity improvement for collision lookup."
      ],
      weaknesses: [
        "Did not mention default load factor (0.75) triggering array resize."
      ],
      missingConcepts: ["Load Factor & Capacity Resizing (Rehashing)"]
    },
    {
      id: 2,
      question: "What is the key difference between ConcurrentHashMap and SynchronizedMap?",
      answer: "SynchronizedMap locks the entire map instance on every read/write operation using synchronized blocks. ConcurrentHashMap provides fine-grained thread safety without locking the full table — using CAS (Compare-And-Swap) operations for bucket insertion and locking individual bucket head nodes (synchronized on bucket head) in Java 8.",
      score: 9.0,
      technicalAccuracy: 9.2,
      completeness: 8.8,
      communicationClarity: 9.0,
      confidence: 9.0,
      strengths: [
        "Great distinction between coarse-grained object-level locks vs fine-grained bucket locks.",
        "Correctly pointed out Lock-free CAS operations used in ConcurrentHashMap."
      ],
      weaknesses: [
        "Skipped historical segment-locking mechanism prior to Java 8."
      ],
      missingConcepts: ["Segment-Level Locks (Historical Context)"]
    },
    {
      id: 3,
      question: "Can you explain how Garbage Collection works in Java and how G1 Collector differs from ZGC?",
      answer: "Garbage Collection automatically frees unreferenced heap memory. Memory is divided into Young (Eden, Survivor) and Tenured (Old) generations. G1 collector breaks memory into equal-sized regions and targets garbage-first regions. ZGC is an ultra low-latency collector using colored pointers and load barriers to keep pauses under 1 millisecond.",
      score: 8.2,
      technicalAccuracy: 8.5,
      completeness: 7.8,
      communicationClarity: 8.2,
      confidence: 8.1,
      strengths: [
        "Accurately identified region-based memory partitioning in G1 GC.",
        "Correctly identified ZGC pause time guarantees (<1ms) and colored pointer concept."
      ],
      weaknesses: [
        "Briefly skipped explaining the Mark-Sweep-Compact phase lifecycle details."
      ],
      missingConcepts: ["Mark-Sweep-Compact Phase Lifecycle"]
    }
  ]
};

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { roomName: paramRoomName } = useParams();

  const roomName = paramRoomName || searchParams.get("roomName") || DUMMY_FEEDBACK_DATA.roomName;
  const [reportData, setReportData] = useState<FeedbackReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    axios
      .get(`${BACKEND_URL}/interview/feedback/${encodeURIComponent(roomName)}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.success && res.data.questions && res.data.questions.length > 0) {
          setReportData(res.data);
        } else {
          // If no live in-memory questions exist yet for this room name, use sample report data
          setReportData({
            ...DUMMY_FEEDBACK_DATA,
            roomName: roomName || DUMMY_FEEDBACK_DATA.roomName,
          });
        }
      })
      .catch((err) => {
        console.error("Error loading interview feedback report:", err);
        if (!isMounted) return;
        setReportData({
          ...DUMMY_FEEDBACK_DATA,
          roomName: roomName || DUMMY_FEEDBACK_DATA.roomName,
        });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomName]);

  const toggleQuestion = (id: number) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading || !reportData) {
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
            <div className="score-ring">
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
