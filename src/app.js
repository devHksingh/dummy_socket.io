import express from "express";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import userRouter from "./user/users.Route.js";
import chatRouter from "./chat/chat.Route.js";
import messageRouter from "./message/message.Route.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import createHttpError from "http-errors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Wlecome to chat app" });
});

const verifyToken = (token, secret) => {
  try {
    console.log("token", token);
    console.log("secret", secret);

    return jwt.verify(token, secret);
  } catch (err) {
    throw err;
  }
};

// socket io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

io.on("connection", (socket) => {
  console.log("User connected", socket.id);
  socket.on("join_room", ({ roomId }) => socket.join(roomId));
  socket.on("leave_room", ({ roomId }) => socket.leave(roomId));
});
// Server-side middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query.token;
  if (!token) return next(new Error("Auth error"));
  const accessToken = token.split(" ")[1];
  if (!accessToken) {
    return next(createHttpError(401, "Access token not provided"));
  }
  try {
    const decoded = verifyToken(accessToken, config.JWT_ACCESS_KEY);
    console.log("decoded", decoded);
    const userDetails = {
      _id: decoded._id,
      email: decoded.email,
      name: decoded.name,
    };
    req.user = userDetails; // Attach user details to the request object
    console.log("req.user", req.user);
    next();
  } catch (error) {
    console.log("token error", error);

    return next(
      createHttpError(
        401,
        "Invalid or expired refresh token. Please log in again."
      )
    );
  }

  
});

httpServer.listen(PORT, () => console.log("Listening on", PORT));
// route

app.use("/api/v1/users", userRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);

app.use(globalErrorHandler);
export default app;
