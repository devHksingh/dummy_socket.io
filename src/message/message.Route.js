import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createMessage,
  gettAllMessagesByChatId,
} from "./message.Controller.js";

const messageRouter = express.Router();

messageRouter.post("/", authMiddleware, createMessage);
messageRouter.post(
  "/gettAllMessagesByChatId",
  authMiddleware,
  gettAllMessagesByChatId
);

export default messageRouter;
