import createHttpError from "http-errors";
import { User } from "../user/user.Model.js";
import { Message } from "./message.Model.js";
import { Chat } from "../chat/chat.Model.js";

const createMessage = async (req, res, next) => {
  try {
    const { email, _id } = req.user;
    const { chatId, text } = req.body;

    // verify users
    const user = await User.findById(_id).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    if (!chatId && !text) {
      return next(createHttpError(401, "ChatId and text is required"));
    }
    // verify chatId
    const isValidChatId = await Chat.findById(chatId);
    if (!isValidChatId) {
      return next(createHttpError(404, "ChatId is not found"));
    }
    const newMessage = await Message.create({
      chatId,
      sender: user._id,
      text,
    });
    if (newMessage) {
      return res.status(201).json({
        success: true,
        message: "Message is created successfully",
        message: newMessage,
      });
    }
  } catch (error) {
    console.log("Unable to create Message is created successfully ", error);
    return next(
      createHttpError(
        500,
        "Server error Unable to create Message is created successfully"
      )
    );
  }
};

// fetch all  messages by chatId (ordered by timestamp) for chat history

const gettAllMessagesByChatId = async (req, res, next) => {
  try {
    const { email, _id } = req.user;
    const { chatId } = req.body;
    if (!chatId) {
      return next(createHttpError(401, "ChatId  is required"));
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
    const allMessages = await Message.find({ chatId }).populate("sender", "-password")
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

export { createMessage, gettAllMessagesByChatId };
