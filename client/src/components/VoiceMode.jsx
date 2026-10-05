import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./VoiceMode.css";

function VoiceMode({
  onVoiceMessage,
  disabled = false,
}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef(null);

  const processingRef = useRef(false);
  const speakingStartRef = useRef(null);
  const mountedRef = useRef(false);

  /*
   * =========================================
   * PROGRESS
   * =========================================
   */

  const updateProgress = (
    secondsToAdd,
    wordsToAdd = 0,
    conversationCompleted = false
  ) => {
    if (
      secondsToAdd <= 0 &&
      wordsToAdd <= 0 &&
      !conversationCompleted
    ) {
      return;
    }

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const saved =
      localStorage.getItem("englishProgress");

    let progress = {
      streak: 0,
      weeklySeconds: 0,
      monthlySeconds: 0,
      wordsSpoken: 0,
      conversationsCompleted: 0,
      lastPracticeDate: null,
    };

    if (saved) {
      try {
        progress = {
          ...progress,
          ...JSON.parse(saved),
        };
      } catch (error) {
        console.error(
          "Progress loading error:",
          error
        );
      }
    }

    progress.weeklySeconds += secondsToAdd;
    progress.monthlySeconds += secondsToAdd;
    progress.wordsSpoken += wordsToAdd;

    if (conversationCompleted) {
      progress.conversationsCompleted += 1;
    }

    /*
     * Streak
     */

    if (progress.lastPracticeDate !== today) {
      if (progress.lastPracticeDate) {
        const lastDate = new Date(
          progress.lastPracticeDate
        );

        const currentDate = new Date(today);

        const difference = Math.floor(
          (currentDate - lastDate) /
            (1000 * 60 * 60 * 24)
        );

        if (difference === 1) {
          progress.streak += 1;
        } else {
          progress.streak = 1;
        }
      } else {
        progress.streak = 1;
      }

      progress.lastPracticeDate = today;
    }

    localStorage.setItem(
      "englishProgress",
      JSON.stringify(progress)
    );

    window.dispatchEvent(
      new Event("englishProgressUpdated")
    );

    console.log(
      "English progress updated:",
      progress
    );
  };

  /*
   * =========================================
   * TIMER
   * =========================================
   */

  const startProgressTimer = () => {
    if (!speakingStartRef.current) {
      speakingStartRef.current = Date.now();
    }
  };

  const stopProgressTimer = () => {
    if (!speakingStartRef.current) {
      return 0;
    }

    const seconds = Math.floor(
      (Date.now() -
        speakingStartRef.current) /
        1000
    );

    speakingStartRef.current = null;

    return seconds;
  };

  /*
   * =========================================
   * SPEECH RECOGNITION
   * =========================================
   */

  useEffect(() => {
    mountedRef.current = true;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error(
        "Speech Recognition is not supported in this browser."
      );

      return () => {
        mountedRef.current = false;
      };
    }

    const recognition =
      new SpeechRecognition();

    /*
     * IMPORTANT
     *
     * Use one speech session at a time.
     */

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.lang = "en-US";

    recognition.maxAlternatives = 1;

    /*
     * =========================================
     * START
     * =========================================
     */

    recognition.onstart = () => {
      console.log(
        "🎤 Speech recognition started"
      );

      if (!mountedRef.current) {
        return;
      }

      setListening(true);

      startProgressTimer();
    };

    /*
     * =========================================
     * RESULT
     * =========================================
     */

    recognition.onresult = (event) => {
      if (!mountedRef.current) {
        return;
      }

      let finalText = "";
      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];

        const text =
          result[0].transcript;

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      const combinedText =
        `${finalText} ${interimText}`
          .replace(/\s+/g, " ")
          .trim();

      if (combinedText) {
        setTranscript(combinedText);
      }

      /*
       * When Chrome gives final speech,
       * send it.
       */

      if (finalText.trim()) {
        const text = finalText
          .replace(/\s+/g, " ")
          .trim();

        console.log(
          "🎤 FINAL SPEECH:",
          text
        );

        setTranscript(text);

        /*
         * Small delay so UI can show
         * the detected sentence.
         */

        setTimeout(() => {
          sendVoiceMessage(text);
        }, 300);
      }
    };

    /*
     * =========================================
     * ERROR
     * =========================================
     */

    recognition.onerror = (event) => {
      console.error(
        "🎤 Speech recognition error:",
        event.error
      );

      if (!mountedRef.current) {
        return;
      }

      if (event.error === "no-speech") {
        console.log(
          "⚠️ No speech detected."
        );

        setListening(false);

        stopProgressTimer();

        return;
      }

      if (event.error === "not-allowed") {
        setListening(false);

        stopProgressTimer();

        alert(
          "Microphone permission is blocked. Please allow microphone access for this website."
        );

        return;
      }

      if (event.error === "audio-capture") {
        setListening(false);

        stopProgressTimer();

        alert(
          "Microphone could not be accessed. Please check your microphone."
        );

        return;
      }

      if (event.error === "network") {
        setListening(false);

        stopProgressTimer();

        console.error(
          "Speech recognition network error."
        );

        return;
      }

      if (event.error === "aborted") {
        console.log(
          "Speech recognition aborted."
        );

        return;
      }
    };

    /*
     * =========================================
     * END
     * =========================================
     */

    recognition.onend = () => {
      console.log(
        "🎤 Speech recognition ended"
      );

      if (!mountedRef.current) {
        return;
      }

      setListening(false);

      /*
       * DO NOT restart here.
       *
       * User clicks microphone again
       * after a no-speech event.
       */

      if (!processingRef.current) {
        stopProgressTimer();
      }
    };

    recognitionRef.current = recognition;

    /*
     * =========================================
     * CLEANUP
     * =========================================
     */

    return () => {
      mountedRef.current = false;

      try {
        recognition.stop();
      } catch (error) {
        console.log(
          "Recognition already stopped."
        );
      }

      stopProgressTimer();

      recognitionRef.current = null;
    };
  }, []);

  /*
   * =========================================
   * START LISTENING
   * =========================================
   */

  const startListening = () => {
    if (!recognitionRef.current) {
      console.error(
        "Speech recognition unavailable."
      );

      return;
    }

    if (disabled) {
      return;
    }

    if (speaking) {
      return;
    }

    if (processingRef.current) {
      return;
    }

    if (listening) {
      console.log(
        "Already listening."
      );

      return;
    }

    /*
     * Clear old transcript.
     */

    setTranscript("");

    /*
     * Start fresh recognition.
     */

    try {
      recognitionRef.current.start();

      console.log(
        "🎤 Starting microphone..."
      );
    } catch (error) {
      console.error(
        "Could not start recognition:",
        error
      );

      setListening(false);
    }
  };

  /*
   * =========================================
   * SEND VOICE MESSAGE
   * =========================================
   */

  const sendVoiceMessage = async (
    detectedText = ""
  ) => {
    if (processingRef.current) {
      return;
    }

    const text = detectedText.trim();

    if (!text) {
      console.log(
        "No voice message to send."
      );

      return;
    }

    processingRef.current = true;

    /*
     * Stop recognition.
     */

    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.log(
        "Recognition already stopped."
      );
    }

    setListening(false);

    /*
     * Calculate speaking time.
     */

    const elapsedSeconds =
      stopProgressTimer();

    const wordCount = text
      .split(/\s+/)
      .filter(Boolean)
      .length;

    console.log(
      "🎤 Voice message:",
      text
    );

    console.log(
      "📝 Words:",
      wordCount
    );

    console.log(
      "⏱️ Speaking seconds:",
      elapsedSeconds
    );

    try {
      /*
       * Send to Chatbot/App.
       */

      const reply =
        await onVoiceMessage(text);

      console.log(
        "🤖 AI reply:",
        reply
      );

      /*
       * Save progress.
       */

      updateProgress(
        elapsedSeconds,
        wordCount,
        true
      );

      /*
       * AI speaks.
       */

      if (reply) {
        await speak(reply);
      }
    } catch (error) {
      console.error(
        "Voice message error:",
        error
      );

      updateProgress(
        elapsedSeconds,
        wordCount,
        false
      );
    }

    processingRef.current = false;

    /*
     * Don't automatically restart.
     *
     * User clicks 🎤 for the next turn.
     */

    if (mountedRef.current) {
      setTranscript("");
    }
  };

  /*
   * =========================================
   * AI TEXT TO SPEECH
   * =========================================
   */

  const speak = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          text
        );

      utterance.lang = "en-US";

      utterance.rate = 1;

      utterance.pitch = 1;

      utterance.onstart = () => {
        console.log(
          "🔊 AI started speaking"
        );

        setSpeaking(true);
      };

      utterance.onend = () => {
        console.log(
          "🔊 AI finished speaking"
        );

        setSpeaking(false);

        resolve();
      };

      utterance.onerror = (error) => {
        console.error(
          "Speech synthesis error:",
          error
        );

        setSpeaking(false);

        resolve();
      };

      window.speechSynthesis.speak(
        utterance
      );
    });
  };

  /*
   * =========================================
   * STOP AI SPEECH
   * =========================================
   */

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  };

  /*
   * =========================================
   * UI
   * =========================================
   */

  return (
    <div className="voice-mode">

      {/* Header */}

      <div className="voice-header">
        <span className="voice-icon">
          {listening
            ? "🎤"
            : speaking
            ? "🔊"
            : "🎙️"}
        </span>

        <span className="voice-status">
          {listening
            ? "Listening..."
            : speaking
            ? "AI is speaking..."
            : "Voice Mode"}
        </span>
      </div>

      {/* Transcript */}

      {transcript && (
        <div className="voice-transcript">

          <div className="transcript-label">
            You are saying:
          </div>

          <div className="transcript-text">
            {transcript}

            {listening && (
              <span className="cursor">
                ▌
              </span>
            )}
          </div>

        </div>
      )}

      {/* Controls */}

      <div className="voice-controls">

        {/* Microphone */}

        {!listening &&
          !speaking && (
            <button
              className="voice-button"
              onClick={startListening}
              disabled={disabled}
              title="Start speaking"
            >
              🎤
            </button>
          )}

        {/* Listening */}

        {listening && (
          <button
            className="voice-button listening"
            onClick={() => {
              const text =
                transcript.trim();

              if (text) {
                sendVoiceMessage(text);
              } else {
                try {
                  recognitionRef.current?.stop();
                } catch (error) {
                  console.log(
                    "Recognition already stopped."
                  );
                }

                setListening(false);
              }
            }}
            disabled={disabled}
            title="Send now"
          >
            ⏹️
          </button>
        )}

        {/* AI Speaking */}

        {speaking && (
          <button
            className="voice-stop-button"
            onClick={stopSpeaking}
            title="Stop AI speech"
          >
            🔇
          </button>
        )}

      </div>

    </div>
  );
}

export default VoiceMode;