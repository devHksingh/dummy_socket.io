import express from "express";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import userRouter from "./user/users.Route.js";
import chatRouter from "./chat/chat.Route.js";
import messageRouter from "./message/message.Route.js";

import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import createHttpError from "http-errors";
import { socketAuthMiddleware } from "./socket/socketAuth.js";
import { handleConnection } from "./socket/socketHandlers.js";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Wlecome to chat app" });
});

// socket io
// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:5173",
    credentials: true,
  },
  // Add ping timeout and interval for better connection handling
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.IO middleware and connection handling
io.use(socketAuthMiddleware);
io.on("connection", (socket) => handleConnection(io, socket));

// route

app.use("/api/v1/users", userRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);

app.use(globalErrorHandler);
export default app;
export { httpServer, io };
