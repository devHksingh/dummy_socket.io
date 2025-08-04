import express from "express";
import authMiddleware from "../middleware/auth.js";
import { createChatRoom, allChatRooms } from "./chat.Controller.js";

const chatRouter = express.Router();

chatRouter.post("/", authMiddleware, createChatRoom);
chatRouter.get("/", authMiddleware, allChatRooms);

export default chatRouter