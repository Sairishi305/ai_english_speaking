const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

const connectDB = require("./db");
const Conversation = require("./models/Conversation");


// =====================================
// LOAD ENVIRONMENT VARIABLES
// =====================================

dotenv.config();


// =====================================
// CREATE EXPRESS APP
// =====================================

const app = express();


// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());


// =====================================
// CONNECT TO MONGODB
// =====================================

connectDB();


// =====================================
// GEMINI AI
// =====================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// =====================================
// TEST ROUTE
// =====================================

app.get("/", (req, res) => {
  res.send(
    "AI English Speaking Partner Backend is running!"
  );
});


// ==========================================
// GET ALL CONVERSATIONS
// ==========================================

app.get("/api/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .select("_id messages mode createdAt updatedAt");

    const chatHistory = conversations.map((conversation) => {
      const firstUserMessage = conversation.messages.find(
        (message) => message.role === "user"
      );

      return {
        id: conversation._id.toString(),

        title: firstUserMessage
          ? firstUserMessage.content.slice(0, 40)
          : "New Conversation",

        mode: conversation.mode,

        createdAt: conversation.createdAt,

        updatedAt: conversation.updatedAt,
      };
    });

    res.json(chatHistory);

  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:");
    console.error(error);

    res.status(500).json({
      error: "Failed to load conversations",
    });
  }
});


// ==========================================
// GET ONE CONVERSATION
// ==========================================

app.get("/api/conversations/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findById(
      req.params.id
    );

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    res.json(conversation);

  } catch (error) {
    console.error("GET CONVERSATION ERROR:");
    console.error(error);

    res.status(500).json({
      error: "Failed to load conversation",
    });
  }
});


// =====================================
// CHAT API
// =====================================
app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      history = [],
      mode = "normal",
      conversationId,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const conversationHistory = history
      .map((item) => {
        const role =
          item.role === "user" ? "User" : "AI";

        return `${role}: ${item.content}`;
      })
      .join("\n");

    let prompt = `
You are an AI English Speaking Partner.

Your main goal is to help the user practice natural spoken English.

Talk like a friendly and helpful speaking partner.

Remember the conversation history.

Do not restart the conversation.

Do not repeatedly ask generic questions.

Do not repeatedly say:
"What would you like to talk about?"
"How is your day?"

Continue naturally based on previous messages.

-------------------------------------
ENGLISH CORRECTION RULES
-------------------------------------

Correct ONLY genuine:

- Grammar mistakes
- Verb tense mistakes
- Subject-verb agreement
- Articles
- Prepositions
- Incorrect vocabulary
- Incorrect word usage
- Sentence structure problems

DO NOT correct:

- Capitalization
- Punctuation
- Spaces
- Symbols
- Casual typing

If the sentence is correct, do not create
an unnecessary correction.

Keep corrections short and natural.

-------------------------------------
CONVERSATION HISTORY
-------------------------------------

${conversationHistory}

-------------------------------------
LATEST USER MESSAGE
-------------------------------------

${message}

-------------------------------------

Respond naturally and continue the conversation.
`;

    if (mode === "interview") {
      prompt = `
You are a professional job interviewer and English speaking coach.

MODE: INTERVIEW

The user is the candidate.
You are the interviewer.

Stay in interview mode.

Ask ONE question at a time.

If the user says "Let's start", say:

"Great. Let's begin. Tell me about yourself."

After each answer:

1. Give short feedback.
2. Correct genuine grammar/vocabulary mistakes.
3. Give a better version when useful.
4. Ask ONE next interview question.

Do not switch to casual conversation.

Do not repeat questions unnecessarily.

CONVERSATION HISTORY:

${conversationHistory}

LATEST CANDIDATE MESSAGE:

${message}

Continue the interview.
`;
    }

    if (mode === "roleplay") {
      prompt = `
You are an AI English Speaking Partner.

MODE: ROLE PLAY

Stay completely inside the role-play.

Remember the previous conversation.

Act naturally as the role-play character.

Ask natural follow-up questions.

Correct only genuine grammar or vocabulary mistakes.

Do not correct capitalization or punctuation.

CONVERSATION HISTORY:

${conversationHistory}

LATEST USER MESSAGE:

${message}

Continue the role-play naturally.
`;
    }

    const interaction =
      await ai.interactions.create({
        model: "gemini-3.1-flash-lite",
        input: prompt,
      });

    const reply = interaction.output_text;

    let conversation;

    // Existing conversation
    if (conversationId) {
      conversation =
        await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found",
        });
      }

      conversation.messages.push({
        role: "user",
        content: message,
      });

      conversation.messages.push({
        role: "assistant",
        content: reply,
      });

      conversation.mode = mode;

      await conversation.save();

    } else {
      // New conversation
      conversation =
        new Conversation({
          messages: [
            {
              role: "user",
              content: message,
            },
            {
              role: "assistant",
              content: reply,
            },
          ],
          mode: mode,
        });

      await conversation.save();
    }

    console.log(
      "Conversation saved:",
      conversation._id.toString()
    );

    res.json({
      reply: reply,
      conversationId:
        conversation._id.toString(),
    });

  } catch (error) {
    console.error("CHAT ERROR:");
    console.error(error);

    res.status(500).json({
      error:
        error.message ||
        "Gemini request failed",
    });
  }
});


// =====================================
// START SERVER
// =====================================

const PORT = 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );

});