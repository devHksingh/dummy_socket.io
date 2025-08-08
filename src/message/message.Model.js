import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true, // Add index for better query performance
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000, // Limit message length
    },
    // Add message type for future features (text, image, file, etc.)
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    lastMessage:{
      type: String,
      required: true,
    },
    // Add read receipts
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Add edit functionality
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Add compound index for better query performance
messageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
