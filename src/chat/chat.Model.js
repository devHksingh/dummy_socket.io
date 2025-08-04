import mongoose from "mongoose";

/*
for roomId
i will create like user1EmialId-user2EmailId

*/

const chatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    roomId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);


