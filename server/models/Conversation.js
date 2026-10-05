const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const conversationSchema = new mongoose.Schema(
  {
    messages: {
      type: [messageSchema],
      default: [],
    },

    mode: {
      type: String,
      enum: ["normal", "interview", "roleplay"],
      default: "normal",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);