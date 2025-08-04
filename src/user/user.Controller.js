import { User } from "./user.Model.js";
import createHttpError from "http-errors";

const createUser = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const checkUser = await User.findOne({ email });
    if (checkUser) {
      const err = createHttpError(
        401,
        "User is already exist with this email id"
      );
      return next(err);
    }
    const newUser = await User.create({
      name,
      email,
      password,
    });
    if (newUser) {
      res.status(201).json({ success: true, message: "user is register" });
    }
  } catch (error) {
    console.log("error in create user", error);
    const err = createHttpError(
      500,
      "Internal server error while creating user"
    );
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    

    const user = await User.findOne({
      email,
    });
    if (!user) {
      const err = createHttpError(401, "User does not exist");
      return next(err);
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    console.log(isPasswordCorrect);
    if (!isPasswordCorrect) {
      const err = createHttpError(400, "Invalid  password");
      return next(err);
    }
    const accessToken = user.generateAccessToken();
    console.log("access token in login", accessToken);
    res.status(200).json({
      success: true,
      message: "User is logged in successfully",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("error in login ", error);
    const err = createHttpError(500, "Internal server error while login user");
    next(err);
  }
};

// find all users by name or email (case-insensitive)
const findUserByNameOrEmail = async (req, res, next) => {
  try {
    const { query } = req.params;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    }).select("-password"); // remove sensitive data

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Users found",
      users,
    });
  } catch (error) {
    console.error("Error in findUserByNameOrEmail:", error);
    const err = createHttpError(
      500,
      "Internal server error while finding users"
    );
    next(err);
  }
};

export { createUser, loginUser, findUserByNameOrEmail };
