import createHttpError from "http-errors";
import { User } from "../user/user.Model.js";
import { Chat } from "./chat.Model.js";

const createChatRoom = async (req, res, next) => {
  try {
    const { email } = req.user;
    const { anotherUserEmail } = req.body;
    if (!email && !anotherUserEmail) {
      return next(createHttpError(400, "Both user email is required"));
    }
    //  find and verify both user
    const userOne = await User.findOne({ email }).select("-password");
    if (!userOne) {
      return next(createHttpError(404, "User one is not found"));
    }
    const userTwo = await User.findOne({ email: anotherUserEmail }).select(
      "-password"
    );
    if (!userTwo) {
      return next(createHttpError(404, "User two is not found"));
    }
    if (userOne.email === userTwo.email){
        return next(createHttpError(401, "Two user is required for create chat room .you send both same user details"));
    }
    const roomId = `${email}-${anotherUserEmail}`;
    // find is chat is avabale for this room id
    const isChatAvalaible = await Chat.findOne({ roomId });
    if (isChatAvalaible) {
      return next(createHttpError(400, "Chat room is already created"));
    }
    const newChat = await Chat.create({
      participants: [userOne._id, userTwo._id],
      roomId,
    });
    return res.status(201).json({
      message: "Chat room created successfully",
      chat: newChat,
    });
  } catch (error) {
    console.log("error while creating chat room ", error);
    return next(createHttpError(500, "Server error while creating chat room"));
  }
};

// fetch all chatRoom for login user
const allChatRooms = async (req, res, next) => {
  try {
    const { email, _id } = req.user;
    // verify users
    const user = await User.findById(_id).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    // fetch all room chat for user
    const allChatRoom = await Chat.find({
      participants: {
        $in: [user._id],
      },
    }).populate("participants", "-password");
    return res.status(200).json({
      message: "Fetched all chat rooms successfully ",
      chatRooms: allChatRoom,
    });
  } catch (error) {
    console.log("fetch all chatRoom for login user ", error);
    return next(
      createHttpError(500, "Server error fetch all chatRoom for login user")
    );
  }
};

export { createChatRoom,allChatRooms };
