import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createMessage,
  gettAllMessagesByChatId,
  getAllMessagesByChatIds
} from "./message.Controller.js";

const messageRouter = express.Router();

messageRouter.post("/", authMiddleware, createMessage);
messageRouter.post(
  "/gettAllMessagesByChatId",
  authMiddleware,
  gettAllMessagesByChatId
);

messageRouter.post(
  "/getAllMessagesByChatIds",
  authMiddleware,
  getAllMessagesByChatIds
);

export default messageRouter;
