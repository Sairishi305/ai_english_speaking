import { useEffect, useState } from "react";

function Chatbot() {
  // =========================
  // STATE
  // =========================

  const [messages, setMessages] = useState([]);

  const [conversationId, setConversationId] =
    useState(null);

  const [chatHistory, setChatHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(false);


  // =========================
  // LOAD CHAT HISTORY
  // =========================

  useEffect(() => {
    loadChatHistory();
  }, []);


  const loadChatHistory = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/conversations"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load chat history"
        );
      }

      const data = await response.json();

      setChatHistory(data);

    } catch (error) {
      console.error(
        "Chat history error:",
        error
      );
    }
  };


  // =========================
  // LOAD ONE CONVERSATION
  // =========================

  const loadConversation = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/conversations/${id}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load conversation"
        );
      }

      const conversation =
        await response.json();

      setMessages(conversation.messages);

      setConversationId(
        conversation._id
      );

    } catch (error) {
      console.error(
        "Load conversation error:",
        error
      );
    }
  };


  // =========================
  // SEND MESSAGE
  // =========================

  const sendMessage = async (text) => {
    const message = text.trim();

    if (!message || loading) return;

    const userMessage = {
      role: "user",
      content: message,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: message,

            history: messages.slice(-12),

            mode: mode,

            conversationId:
              conversationId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Request failed"
        );
      }

      // Save MongoDB conversation ID
      if (data.conversationId) {
        setConversationId(
          data.conversationId
        );
      }

      const aiMessage = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);

      // Refresh history
      await loadChatHistory();

    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the AI.",
        },
      ]);

    } finally {
      setLoading(false);
    }
  };


  // =========================
  // CLEAR / NEW CHAT
  // =========================

  const startNewChat = () => {
    setMessages([]);

    setConversationId(null);
  };


  // =========================
  // UI
  // =========================

  return (
    <div>

      {/* Your existing Chatbot UI goes here */}

    </div>
  );
}

export default Chatbot;