import "./feedback.css";

type ScoreItem = {
  label: string;
  score: number;
};

const Feedback = () => {
  // 👉 replace this later with API data
  const data = {
    name: "Aditi",
    role: "Software Engineer Candidate",
    interviewDate: "21 June 2026",
  };

  const scores: ScoreItem[] = [
    { label: "Problem Solving", score: 85 },
    { label: "Data Structures & Algorithms", score: 78 },
    { label: "System Design", score: 72 },
    { label: "Communication", score: 90 },
  ];

  const strengths = [
    "Strong communication skills",
    "Good logical thinking",
    "Clear explanation of solutions",
  ];

  const improvements = [
    "System design depth can improve",
    "Edge case handling in DSA",
  ];

  const average =
    scores.reduce((sum, item) => sum + item.score, 0) / scores.length;

  const getStatus = (score: number) => {
    if (score >= 85) return "Excellent 🚀";
    if (score >= 70) return "Good 👍";
    if (score >= 50) return "Average ⚡";
    return "Needs Improvement 📉";
  };

  return (
    <div className="feedback-container">

      {/* LEFT SIDE - PROFILE */}
      <div className="profile-card">
        <h2>Candidate Profile</h2>

        <div className="profile-box">
          <p><span>Name:</span> {data.name}</p>
          <p><span>Role:</span> {data.role}</p>
          <p><span>Date:</span> {data.interviewDate}</p>
        </div>

        <div className="overall-score">
          <h3>Overall Score</h3>
          <div className="big-score">{average.toFixed(1)}%</div>
          <div className="badge">{getStatus(average)}</div>
        </div>
      </div>

      {/* RIGHT SIDE - REPORT */}
      <div className="report-card">

        {/* SCORES */}
        <h2>Performance Breakdown</h2>

        <div className="score-section">
          {scores.map((item, index) => (
            <div className="score-row" key={index}>
              <div className="label">{item.label}</div>

              <div className="bar">
                <div
                  className="fill"
                  style={{ width: `${item.score}%` }}
                />
              </div>

              <div className="value">{item.score}%</div>
            </div>
          ))}
        </div>

        {/* STRENGTHS */}
        <div className="section">
          <h3>💪 Strengths</h3>
          <ul>
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        {/* IMPROVEMENTS */}
        <div className="section">
          <h3>⚡ Areas of Improvement</h3>
          <ul>
            {improvements.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>

        {/* FINAL RECOMMENDATION */}
        <div className="recommendation">
          <h3>📌 Final Recommendation</h3>
          <p>
            {average >= 75
              ? "Candidate is recommended for the next round."
              : "Candidate needs improvement before next round."}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Feedback;