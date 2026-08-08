import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, Compass } from "lucide-react";
import "../style/Gratification.css";

const Gratification: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="gratification-container">
      <div className="gratification-card">
        <div className="icon-wrapper">
          <Heart size={44} className="gratitude-icon" />
          <Sparkles size={20} className="sparkle-icon" />
        </div>

        <h1 className="gratification-title">Thank You!</h1>

        <div className="quote-box">
          <p className="gratification-message">
            "Thank you for your time and effort, this simulation of interview room is designed to help the candidates to perform better in their interviews and your help is skyrocketing the growth of someone in need. May this initiative help in building better leaders."
          </p>
        </div>

        <div className="action-group">
          <button
            className="explore-btn"
            onClick={() => navigate("/")}
          >
            <Compass size={18} />
            <span>Explore Impression</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gratification;
