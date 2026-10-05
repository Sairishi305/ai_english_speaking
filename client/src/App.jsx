import { useEffect, useState } from "react";
import VoiceMode from "./components/VoiceMode";
import Progress from "./components/Progress";
import "./App.css";

function App() {
  const [page, setPage] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("englishChatMessages");

    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (error) {
        console.error("Chat loading error:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "englishChatMessages",
      JSON.stringify(messages)
    );
  }, [messages]);

  const sendToAI = async (message) => {
    const response = await fetch(
      "http://localhost:5000/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to get AI response"
      );
    }

    return data.reply;
  };

  const addMessage = (role, content) => {
    setMessages((previous) => [
      ...previous,
      {
        role,
        content,
      },
    ]);
  };

  const handleTextMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    addMessage("user", message);

    setInput("");
    setLoading(true);

    try {
      const reply = await sendToAI(message);

      addMessage("assistant", reply);
    } catch (error) {
      console.error("AI error:", error);

      addMessage(
        "assistant",
        "Sorry, I could not connect to the AI."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceMessage = async (message) => {
    if (!message || !message.trim()) return "";

    addMessage("user", message);

    setLoading(true);

    try {
      const reply = await sendToAI(message);

      addMessage("assistant", reply);

      return reply;
    } catch (error) {
      console.error("Voice AI error:", error);

      const errorMessage =
        "Sorry, I could not connect to the AI.";

      addMessage("assistant", errorMessage);

      return errorMessage;
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);

    localStorage.removeItem(
      "englishChatMessages"
    );
  };

  return (
    <div className="app">

      {/* TOP NAVIGATION */}

      <header className="top-nav">

        <div
          className="brand"
          onClick={() => setPage("chat")}
        >
          <span className="brand-icon">
            🗣️
          </span>

          <span>
            English Partner
          </span>
        </div>


        <nav className="nav-buttons">

          <button
            className={
              page === "chat"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setPage("chat")}
          >
            💬 Chat
          </button>


          <button
            className={
              page === "progress"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setPage("progress")}
          >
            📊 Progress
          </button>

        </nav>

      </header>


      {/* PAGE */}

      {page === "progress" ? (

        <main className="progress-page">
          <Progress />
        </main>

      ) : (

        <main className="voice-page">

          {/* HEADER */}

          <div className="voice-page-header">

            <div className="online-dot"></div>

            <div>

              <h1>
                AI English Partner
              </h1>

              <p>
                Talk naturally. Practice English.
              </p>

            </div>

          </div>


          {/* MAIN TALKING AREA */}

          <div className="talking-area">

            <div
              className={
                loading
                  ? "ai-orb thinking"
                  : "ai-orb"
              }
            >

              <div className="orb-glow"></div>

              <div className="orb-inner">

                <div className="orb-face">
                  🤖
                </div>

              </div>

            </div>


            {/* STATUS */}

            <div className="ai-status">

              {loading ? (
                <>
                  <span className="status-dot"></span>
                  AI is thinking...
                </>
              ) : (
                <>
                  <span className="status-dot"></span>
                  Ready to talk
                </>
              )}

            </div>


            <p className="talking-message">

              {loading
                ? "Give me a moment..."
                : "Speak naturally with your AI partner"}

            </p>


            {/* VOICE COMPONENT */}

            <VoiceMode
              onVoiceMessage={handleVoiceMessage}
              disabled={loading}
            />


            {/* LIVE CONVERSATION TEXT */}

            {messages.length > 0 && (

              <div className="recent-conversation">

                <div className="conversation-label">
                  Recent conversation
                </div>


                <div className="conversation-box">

                  {messages
                    .slice(-4)
                    .map((message, index) => (

                      <div
                        key={index}
                        className={
                          message.role === "user"
                            ? "conversation-user"
                            : "conversation-ai"
                        }
                      >

                        <span className="conversation-name">

                          {message.role === "user"
                            ? "You"
                            : "AI"}

                        </span>

                        <p>
                          {message.content}
                        </p>

                      </div>

                    ))}

                </div>

              </div>

            )}

          </div>


          {/* TEXT INPUT */}

          <div className="bottom-chat">

            <div className="text-input-wrapper">

              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Or type something..."
                rows="1"
                onKeyDown={(event) => {

                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {

                    event.preventDefault();

                    handleTextMessage();

                  }

                }}
              />


              <button
                className="send-button"
                onClick={handleTextMessage}
                disabled={
                  loading ||
                  !input.trim()
                }
              >
                ➤
              </button>

            </div>


            <div className="input-hint">

              Press Enter to send •
              Click 🎤 to speak

            </div>


            {messages.length > 0 && (

              <button
                className="clear-chat"
                onClick={clearChat}
              >
                Clear conversation
              </button>

            )}

          </div>

        </main>

      )}

    </div>
  );
}

export default App;