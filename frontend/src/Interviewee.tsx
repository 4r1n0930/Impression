import React, { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000");

interface Evaluation {
  score: number;
  technicalAccuracy: number;
  completeness: number;
  communication: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
}

interface IntervieweeProps {
  roomName: string;
  candidateName: string;
}

const Interviewee: React.FC<IntervieweeProps> = ({
  roomName,
  candidateName,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
    }
  }, [browserSupportsSpeechRecognition]);

  // -----------------------------
  // Socket Events
  // -----------------------------

  useEffect(() => {
    socket.on("question:detected", (data) => {
      setCurrentQuestion(data.question);
      setEvaluation(null);
      resetTranscript();
    });

    socket.on("answer:evaluated", (result) => {
      setEvaluation(result);
    });

    return () => {
      socket.off("question:detected");
      socket.off("answer:evaluated");
    };
  }, [resetTranscript]);

  // -----------------------------
  // Recording
  // -----------------------------

  const startRecording = async () => {
    resetTranscript();

    await SpeechRecognition.startListening({
      continuous: true,
      language: "en-IN",
    });

    setIsRecording(true);
  };

  const stopRecording = async () => {
    await SpeechRecognition.stopListening();

    setIsRecording(false);

    if (!transcript.trim()) return;

    socket.emit("interviewee:transcript", {
      roomName,
      transcript,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-8 flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              Interviewee Dashboard
            </h1>

            <p className="text-gray-500 mt-1">
              Answer the interview questions using your microphone.
            </p>

          </div>

          <div className="rounded-xl bg-white shadow px-6 py-4">

            <p className="text-sm text-gray-500">
              Room
            </p>

            <h2 className="font-semibold">
              {roomName}
            </h2>

          </div>

        </div>

        {/* Info Cards */}

        <div className="grid md:grid-cols-3 gap-5 mb-6">

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-gray-500 text-sm">
              Candidate
            </p>

            <h2 className="text-xl font-semibold mt-1">
              {candidateName}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-gray-500 text-sm">
              Microphone
            </p>

            <h2
              className={`font-semibold mt-1 ${
                listening
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {listening ? "Listening..." : "Stopped"}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-gray-500 text-sm">
              Evaluation
            </p>

            <h2 className="font-semibold mt-1">
              {evaluation
                ? `${evaluation.score}/10`
                : "--"}
            </h2>

          </div>

        </div>
                {/* Current Question */}

        <div className="bg-white rounded-xl shadow p-6 mb-6">

          <h2 className="text-lg font-semibold mb-3">
            Current Question
          </h2>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 min-h-[90px]">
            {currentQuestion ? (
              <p className="text-gray-800 leading-7">
                {currentQuestion}
              </p>
            ) : (
              <p className="text-gray-400">
                Waiting for interviewer...
              </p>
            )}
          </div>

        </div>

        {/* Live Transcript */}

        <div className="bg-white rounded-xl shadow p-6 mb-6">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-lg font-semibold">
              Live Transcript
            </h2>

            <span
              className={`text-sm font-medium ${
                listening
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {listening ? "Recording..." : "Idle"}
            </span>

          </div>

          <div className="min-h-[220px] rounded-lg border bg-slate-50 p-4">

            {transcript ? (
              <p className="leading-7 whitespace-pre-wrap">
                {transcript}
              </p>
            ) : (
              <p className="text-gray-400">
                Your answer will appear here...
              </p>
            )}

          </div>

        </div>

        {/* Controls */}

        <div className="flex gap-4 mb-6">

          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              isRecording
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Mic size={20} />
            Start Recording
          </button>

          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              !isRecording
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            <MicOff size={20} />
            Stop Recording
          </button>

        </div>

        {/* Evaluation */}

        {evaluation && (
          <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-xl font-semibold mb-5">
              Evaluation Result
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              <div className="rounded-lg border p-4">
                <p className="text-gray-500 text-sm">
                  Overall Score
                </p>
                <h2 className="text-3xl font-bold mt-2">
                  {evaluation.score}/10
                </h2>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-gray-500 text-sm">
                  Technical Accuracy
                </p>
                <h2 className="text-2xl font-semibold mt-2">
                  {evaluation.technicalAccuracy}/10
                </h2>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-gray-500 text-sm">
                  Completeness
                </p>
                <h2 className="text-2xl font-semibold mt-2">
                  {evaluation.completeness}/10
                </h2>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-gray-500 text-sm">
                  Communication
                </p>
                <h2 className="text-2xl font-semibold mt-2">
                  {evaluation.communication}/10
                </h2>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-gray-500 text-sm">
                  Confidence
                </p>
                <h2 className="text-2xl font-semibold mt-2">
                  {evaluation.confidence}/10
                </h2>
              </div>

            </div>

            {evaluation.strengths.length > 0 && (
              <div className="mt-6">

                <h3 className="font-semibold text-green-700 mb-2">
                  Strengths
                </h3>

                <ul className="list-disc pl-5 space-y-1">

                  {evaluation.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}

                </ul>

              </div>
            )}

            {evaluation.weaknesses.length > 0 && (
              <div className="mt-6">

                <h3 className="font-semibold text-red-700 mb-2">
                  Weaknesses
                </h3>

                <ul className="list-disc pl-5 space-y-1">

                  {evaluation.weaknesses.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}

                </ul>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default Interviewee;