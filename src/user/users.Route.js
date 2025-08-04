import express from "express";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/:query", authMiddleware, findUserByNameOrEmail);

export default userRouter;
