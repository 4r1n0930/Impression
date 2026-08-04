import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInteractionState,
  onInteractionChange,
  setInteractionState,
  type InteractionState,
} from "../../utils/interactionState";
import {
  getMonkeyScreenPosition,
  isEyePositionReady,
} from "../../utils/eyePosition";
import Login from "../../pages/Login";
import "../../style/AuthOverlay.css";

export default function AuthOverlay() {
  const navigate = useNavigate();
  const [iState, setIState] = useState<InteractionState>(getInteractionState());
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const pollRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return onInteractionChange(() => {
      setIState(getInteractionState());
    });
  }, []);

  useEffect(() => {
    const poll = () => {
      if (isEyePositionReady()) {
        const pos = getMonkeyScreenPosition();
        setEyePos({ x: pos.x, y: pos.y });
      }
      pollRef.current = requestAnimationFrame(poll);
    };
    pollRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(pollRef.current!);
  }, []);

  const isInteractive = iState !== "LOCKED";

  return (
    <div className={`auth-overlay ${isInteractive ? "interactive" : ""}`}>
      {/* Suzanne Speech Bubble asking "Who are you?" when screen is fully scrolled */}
      {iState === "READY_FOR_SCAN" && (
        <div
          className="suzanne-speech-bubble"
          style={{ left: `${eyePos.x}px`, top: `${eyePos.y - 70}px`, cursor: "pointer" }}
          onClick={() => setInteractionState("LOGIN_MODAL_OPEN")}
        >
          <div className="suzanne-speech-header">
            <span>●</span> SUZANNE
          </div>
          <h4 className="suzanne-speech-text">"Who are you?"</h4>
        </div>
      )}

      {/* Unified Auth Component Modal when gate or speech bubble is clicked */}
      {(iState === "LOGIN_MODAL_OPEN" || iState === "AUTH_TERMINAL_OPEN") && (
        <Login
          isModal={true}
          onClose={() => setInteractionState("READY_FOR_SCAN")}
          onSuccess={() => {
            setInteractionState("READY_FOR_SCAN");
            navigate("/dashboard");
          }}
        />
      )}
    </div>
  );
}
