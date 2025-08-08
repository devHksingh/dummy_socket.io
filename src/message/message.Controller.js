import createHttpError from "http-errors";
import { User } from "../user/user.Model.js";
import { Message } from "./message.Model.js";
import { Chat } from "../chat/chat.Model.js";

const createMessage = async (req, res, next) => {
  try {
    const { email, _id } = req.user;
    const { chatId, text } = req.body;

    console.log("📨 HTTP Message creation - User:", email, "ChatId:", chatId, "Text:", text);

    // verify users
    const user = await User.findById(_id).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    if (!chatId || !text) {
      return next(createHttpError(400, "ChatId and text is required"));
    }
    
    // verify chatId
    const isValidChatId = await Chat.findById(chatId);
    if (!isValidChatId) {
      return next(createHttpError(404, "ChatId is not found"));
    }

    // Find the receiver (the other participant)
    const receiverId = isValidChatId.participants.find(
      (participant) => participant.toString() !== user._id.toString()
    );

    if (!receiverId) {
      return next(createHttpError(400, "Cannot find receiver for this chat"));
    }

    const newMessage = await Message.create({
      chatId,
      sender: user._id,
      receiver: receiverId, // Fix: Use single receiver ID, not array
      lastMessage: text,
      text,
      messageType: "text", // Add default message type
    });

    if (newMessage) {
      // Populate the message for response
      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "name email")
        .populate("receiver", "name email");

      return res.status(201).json({
        success: true,
        message: "Message is created successfully",
        data: populatedMessage, // Use 'data' instead of 'message' to avoid conflict
      });
    }
  } catch (error) {
    console.log("Unable to create Message: ", error);
    return next(
      createHttpError(
        500,
        "Server error Unable to create Message"
      )
    );
  }
};

// fetch all  messages by chatId (ordered by timestamp) for chat history
const gettAllMessagesByChatId = async (req, res, next) => {
  try {
    const { email, _id } = req.user;
    const { chatId } = req.body;
    
    console.log("📨 Fetching messages for chatId:", chatId, "by user:", email);
    
    if (!chatId) {
      return next(createHttpError(400, "ChatId is required"));
    }
    
    // verify users
    const user = await User.findById(_id).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // verify chatId
    const isValidChatId = await Chat.findById(chatId);
    if (!isValidChatId) {
      return next(createHttpError(404, "ChatId is not found"));
    }
    
    // Verify user is participant in this chat
    const isParticipant = isValidChatId.participants.some(
      (participant) => participant.toString() === user._id.toString()
    );
    
    if (!isParticipant) {
      return next(createHttpError(403, "You are not authorized to view messages from this chat"));
    }

    const allMessages = await Message.find({ chatId })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ timestamp: 1 }); // Sort by timestamp in ascending order
      
    return res.status(200).json({
      success: true,
      message: "fetch all message by chat id",
      messages: allMessages,
    });
  } catch (error) {
    console.log("Unable to get all Message by chatId ", error);
    return next(
      createHttpError(500, "Server error Unable to get all Message by chatId")
    );
  }
};

// get all messages by chatId (ordered by timestamp) for chat history if chatId is an array
const getAllMessagesByChatIds = async (req, res, next) => {
  try {
    const { chatIds } = req.body;
    const { _id } = req.user;
    
    console.log("📨 Fetching messages for chatIds:", chatIds);
    
    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return next(createHttpError(400, "chatIds must be a non-empty array"));
    }

    // Verify user is participant in all these chats
    const chats = await Chat.find({ 
      _id: { $in: chatIds },
      participants: _id 
    });
    
    if (chats.length !== chatIds.length) {
      return next(createHttpError(403, "You are not authorized to view messages from one or more chats"));
    }

    const allMessages = await Message.find({ chatId: { $in: chatIds } })
      .populate("sender", "name email")
      .populate("chatId", "roomId participants")
      .populate("receiver", "name email")
      .sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      message: "Fetched all messages by chat IDs",
      messages: allMessages,
    });
  } catch (error) {
    console.log("Error fetching messages by chat IDs:", error);
    return next(createHttpError(500, "Server error while fetching messages"));
  }
};

export { createMessage, gettAllMessagesByChatId, getAllMessagesByChatIds };