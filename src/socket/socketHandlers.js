import { Chat } from "../chat/chat.Model.js";
import { Message } from "../message/message.Model.js";
import createHttpError from "http-errors";

export const handleConnection = (io, socket) => {
  console.log("User connected ", socket.id, "User :", socket.user.email);

  // Store user in online users map
  socket.userId = socket.user._id.toString();
  socket.userEmail = socket.user.email;
  socket.userName = socket.user.name; // Add userName to socket

  // Join user to their personal room for direct messaging
  socket.join(`user_${socket.userId}`);

  // Handle joining chat rooms
  socket.on("join_room", async ({ roomId }) => {
    try {
      console.log(`🏠 Attempting to join room: ${roomId} for user: ${socket.user.email}`);
      
      // First try to find by _id (which is what frontend sends as roomId)
      let chat = await Chat.findById(roomId);
      
      // If not found by _id, try to find by roomId field
      if (!chat) {
        chat = await Chat.findOne({ roomId: roomId });
      }
      
      // If still not found, log the issue
      if (!chat) {
        console.error(`❌ Chat not found for roomId: ${roomId}`);
        return socket.emit("error_message", {
          type: "JOIN_ROOM_ERROR",
          message: "Chat room not found",
        });
      }

      // Check if user is participant in this chat
      const isParticipant = chat.participants.some(
        (participant) => participant.toString() === socket.user._id.toString()
      );

      if (!isParticipant) {
        console.error(`❌ User ${socket.user.email} not authorized for room: ${roomId}`);
        return socket.emit("error_message", {
          type: "JOIN_ROOM_ERROR",
          message: "You are not authorized to join this room",
        });
      }

      // Use the chat's _id as the actual room identifier for socket.io
      const actualRoomId = chat._id.toString();
      socket.join(actualRoomId);
      console.log(`✅ User ${socket.user.email} joined room: ${actualRoomId}`);

      // Notify others in room that user joined
      socket.to(actualRoomId).emit("user_joined", {
        userId: socket.userId,
        userEmail: socket.userEmail,
        userName: socket.userName, // Add userName here too
      });
      
      // Send confirmation to the user
      socket.emit("room_joined", {
        roomId: actualRoomId,
        chatId: chat._id,
        message: "Successfully joined room"
      });
      
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error_message", {
        type: "JOIN_ROOM_ERROR",
        message: "Failed to join room",
        error: error.message,
      });
    }
  });

  // Handle leaving chat rooms
  socket.on("leave_room", ({ roomId }) => {
    socket.leave(roomId);
    console.log(`❌ User ${socket.user.email} left room: ${roomId}`);

    // Notify others in room that user left
    socket.to(roomId).emit("user_left", {
      userId: socket.userId,
      userEmail: socket.userEmail,
      userName: socket.userName, // Add userName here too
    });
  });

  // Handle sending messages
  socket.on("send_message", async ({ roomId, text }) => {
    try {
      // Input validation
      if (!roomId || !text?.trim()) {
        return socket.emit("error_message", {
          type: "VALIDATION_ERROR",
          message: "Room ID and message text are required",
        });
      }

      // Validate message length
      if (text.length > 1000) {
        return socket.emit("error_message", {
          type: "VALIDATION_ERROR",
          message: "Message too long (max 1000 characters)",
        });
      }

      // Find chat by _id (which is what frontend sends as roomId)
      let chat = await Chat.findById(roomId);
      
      // If not found by _id, try to find by roomId field
      if (!chat) {
        chat = await Chat.findOne({ roomId: roomId });
      }

      if (!chat) {
        return socket.emit("error_message", {
          type: "AUTHORIZATION_ERROR",
          message: "Chat room not found",
        });
      }

      // Verify user is participant in this chat
      const isParticipant = chat.participants.some(
        (participant) => participant.toString() === socket.user._id.toString()
      );

      if (!isParticipant) {
        return socket.emit("error_message", {
          type: "AUTHORIZATION_ERROR",
          message: "You are not authorized to send messages in this room",
        });
      }

      // Find the receiver (the other participant)
      const receiverId = chat.participants.find(
        (participant) => participant.toString() !== socket.user._id.toString()
      );

      if (!receiverId) {
        return socket.emit("error_message", {
          type: "VALIDATION_ERROR",
          message: "Cannot find receiver for this chat",
        });
      }

      // Create and save message with all required fields
      const newMessage = await Message.create({
        chatId: chat._id,
        sender: socket.user._id,
        receiver: receiverId,
        text: text.trim(),
        lastMessage: text.trim(), // Add the required lastMessage field
        messageType: "text", // Set default message type
      });

      // Populate sender details for the response
      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "name email")
        .populate("receiver", "name email");

      // Use the chat's _id as the room identifier
      const actualRoomId = chat._id.toString();
      
      // Emit to all users in the room
      io.to(actualRoomId).emit("receive_message", {
        ...populatedMessage.toObject(),
        roomId: actualRoomId, // Send the actual room ID
      });

      console.log(`📨 Message sent in room ${actualRoomId} by ${socket.user.email}`);
    } catch (error) {
      console.error("❌ Error in send_message:", error);
      socket.emit("error_message", {
        type: "SERVER_ERROR",
        message: "Failed to send message",
        error: error.message, // Include error details for debugging
      });
    }
  });

  // Handle typing indicators - FIXED: Now includes userName
  socket.on("typing_start", ({ roomId }) => {
    console.log(`⌨️ ${socket.userName || socket.userEmail} started typing in room: ${roomId}`);
    socket.to(roomId).emit("user_typing", {
      userId: socket.userId,
      userEmail: socket.userEmail,
      userName: socket.userName, // Add userName to typing event
    });
  });

  socket.on("typing_stop", ({ roomId }) => {
    console.log(`⌨️ ${socket.userName || socket.userEmail} stopped typing in room: ${roomId}`);
    socket.to(roomId).emit("user_stopped_typing", {
      userId: socket.userId,
      userEmail: socket.userEmail,
      userName: socket.userName, // Add userName to stop typing event too
    });
  });

  // Handle message read receipts
  socket.on("mark_messages_read", async ({ roomId }) => {
    try {
      // Find the chat by _id first, then by roomId field
      let chat = await Chat.findById(roomId);
      if (!chat) {
        chat = await Chat.findOne({ roomId });
      }
      
      if (!chat) {
        return socket.emit("error_message", {
          type: "VALIDATION_ERROR",
          message: "Chat room not found",
        });
      }

      // Update all unread messages in this chat for this user
      await Message.updateMany(
        {
          chatId: chat._id, // Use chat._id instead of roomId
          sender: { $ne: socket.user._id },
          readBy: { $ne: socket.user._id },
        },
        {
          $addToSet: { readBy: socket.user._id },
        }
      );

      // Use the actual room ID for notification
      const actualRoomId = chat._id.toString();
      
      // Notify other participants
      socket.to(actualRoomId).emit("messages_read", {
        userId: socket.userId,
        roomId: actualRoomId,
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error_message", {
        type: "SERVER_ERROR",
        message: "Failed to mark messages as read",
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log("❌ User disconnected:", socket.id, "Reason:", reason);

    // Notify all rooms this user was in
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id && roomId !== `user_${socket.userId}`) {
        socket.to(roomId).emit("user_disconnected", {
          userId: socket.userId,
          userEmail: socket.userEmail,
          userName: socket.userName, // Add userName to disconnect event
        });
      }
    });
  });
};