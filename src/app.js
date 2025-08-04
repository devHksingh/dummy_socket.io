import express from "express";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import userRouter from "./user/users.Route.js";
// import chatRouter from "./chat/chat.Route.js";
// import messageRouter from "./message/message.Route.js";


const app = express();

app.use(cors(
  {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }
));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Wlecome to chat app" });
});

// route


app.use("/api/v1/users", userRouter);
// app.use("/api/v1/chats", chatRouter);
// app.use("/api/v1/messages", messageRouter);

app.use(globalErrorHandler);
export default app;
