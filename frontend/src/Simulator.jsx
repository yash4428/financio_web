import { useEffect, useRef, useState } from "react";

function Simulator() {
  const [step, setStep] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [listening, setListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [voices, setVoices] = useState([]);

  const recognitionRef = useRef(null);
  const answeredRef = useRef(false);
  const [showQuestion, setShowQuestion] = useState(false);
  

  /* ---------------- LOAD VOICES (CRITICAL) ---------------- */
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  /* ---------------- LOAD FIRST SCENARIO ---------------- */
  useEffect(() => {
    fetch("http://localhost:5001/scenario/1")
      .then((res) => res.json())
      .then((data) => setStep(data));
  }, []);

  useEffect(() => {
  if (step) {
     window.speechSynthesis.cancel(); // 🔥 stop old narration
    setShowQuestion(false); // show video first for every step
  }
}, [step]);

  /* ---------------- AUTO NARRATE AFTER UNLOCK ---------------- */
  useEffect(() => {
    if (step && audioUnlocked && showQuestion) {
      speak(step.narration);
    }
  }, [step, audioUnlocked, showQuestion]);

  /* ---------------- TEXT TO SPEECH ---------------- */
const speak = (text) => {
    if (!text) {
      console.log("No text to speak");
      return;
    }

    console.log("Speaking:", text);

    // Force stop everything
    window.speechSynthesis.cancel();
    
    // Wait longer for complete cleanup
    setTimeout(() => {
      const availableVoices = window.speechSynthesis.getVoices();
      console.log("Voices available:", availableVoices.length);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try without specifying language first
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Use default voice (don't set a specific one)
      const defaultVoice = availableVoices[0];
      if (defaultVoice) {
        console.log("Using voice:", defaultVoice.name);
      }

      let keepAliveInterval = null;

      utterance.onstart = () => {
        console.log("✓ Speech actually started");
        // Start keep-alive only after speech begins
        keepAliveInterval = setInterval(() => {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }, 10000);
      };

      utterance.onend = () => {
        console.log("✓ Speech ended");
        if (keepAliveInterval) clearInterval(keepAliveInterval);
      };

      utterance.onerror = (e) => {
        console.error("✗ Speech error:", e);
        if (keepAliveInterval) clearInterval(keepAliveInterval);
      };

      // Resume before speaking (Chrome fix)
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      
      console.log("Speech queued");
    }, 200);
  };
  /* ---------------- START LISTENING ---------------- */
  const startListening = () => {
    if (listening) return;

    // Stop TTS before mic
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported");
      return;
    }

    answeredRef.current = false;
    setFeedback(null);
    setSpokenText("");

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = async (event) => {
      if (answeredRef.current) return;
      answeredRef.current = true;

      const userText = event.results[0][0].transcript;
      setSpokenText(userText);

      recognition.stop();

      const res = await fetch("http://localhost:5001/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText,
          stepId: step.stepId
        })
      });

const data = await res.json();
setFeedback(data);

// ❌ If wrong, DO NOT move ahead
if (!data.isCorrect) {
  return;
}

// ✅ Only move to next step if correct
setTimeout(() => {
  fetch(`http://localhost:5001/scenario/${data.nextStepId}`)
    .then(async (res) => {
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    })
    .then((nextStep) => {
      if (!nextStep || nextStep.done) {
        setStep({
          question: "Scenario Complete",
          narration: "You have completed this scenario. Well done.",
          video: null
        });
        setShowQuestion(true);
        return;
      }

      setStep(nextStep);
      setFeedback(null);
      setSpokenText("");
    });
}, 2000);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
  };

  if (!step) return <p>Loading scenario...</p>;

return (
  <div
    style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "16px",
      padding: "24px",
      maxWidth: "900px",
      width: "100%",
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
    }}
  >
    {/* 🎬 VIDEO OR QUESTION */}
    {!showQuestion && step.video ? (
      <div style={{ marginBottom: "16px" }}>
{console.log("STEP DATA:", step)}
       <video
  key={step.stepId}
  src={step.video}
  controls              // user presses play
  playsInline
  preload="metadata"    // lighter than auto
  style={{
    width: "100%",
    borderRadius: "12px",
    backgroundColor: "black"
  }}
  onEnded={() => setShowQuestion(true)}
  onError={(e) => {
    console.error("❌ Video error:", e);
    console.error("Video src:", step.video);
  }}
/>

        <button
          onClick={() => setShowQuestion(true)}
          style={{
            marginTop: "10px",
            width: "100%",
            backgroundColor: "#6FA36F",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "10px",
            fontSize: "15px",
            cursor: "pointer"
          }}
        >
          Skip Video
        </button>
      </div>
    ) : (
      <>
        {/* Scenario header */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ color: "#2F6B3F", marginBottom: "8px" }}>
            📍 Village Situation
          </h3>
          <p style={{ color: "#1F2933", fontSize: "16px", fontWeight: 600 }}>
            {step.question}
          </p>
        </div>

        {/* Narration box */}
        <div
          style={{
            backgroundColor: "#F6EEDB",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "20px",
            lineHeight: 1.6
          }}
        >
          <p style={{ margin: 0, color: "#1F2933" }}>
            {step.narration}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <button
            onClick={() => {
              setAudioUnlocked(true);
              speak(step.question);
            }}
            style={{
              flex: 1,
              backgroundColor: "#6FA36F",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            🔊 Listen
          </button>

          <button
            onClick={startListening}
            disabled={listening}
            style={{
              flex: 1,
              backgroundColor: listening ? "#9CA3AF" : "#2F6B3F",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "16px",
              cursor: listening ? "not-allowed" : "pointer"
            }}
          >
            🎤 {listening ? "Speak now..." : "Answer"}
          </button>
        </div>

        {spokenText && (
          <div
            style={{
              backgroundColor: "#F1F5F9",
              padding: "10px 14px",
              borderRadius: "10px",
              marginBottom: "12px",
              fontSize: "14px"
            }}
          >
            <b>You said:</b> {spokenText}
          </div>
        )}

        {feedback && (
          <div
            style={{
              marginTop: "10px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: feedback.isCorrect ? "#E6F4EA" : "#FDECEA",
              color: feedback.isCorrect ? "#166534" : "#991B1B"
            }}
          >
            <h4 style={{ marginTop: 0 }}>
              {feedback.isCorrect ? "✔ Correct Decision" : "✖ Risky Decision"}
            </h4>
            <p style={{ marginBottom: 0 }}>{feedback.explanation}</p>
          </div>
        )}
      </>
    )}
  </div>
);
}

export default Simulator;