import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createUser,
  loginUser,
  findUserByNameOrEmail,
} from "./user.Controller.js";

const userRouter = express.Router();

userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/:query", authMiddleware, findUserByNameOrEmail);

export default userRouter;
