// a middleware function to authenticate users based on JWT tokens
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import createHttpError from "http-errors";

const verifyToken = (token, secret) => {
  try {
    console.log("token", token);
    console.log("secret", secret);

    return jwt.verify(token, secret);
  } catch (err) {
    throw err;
  }
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return next(createHttpError(401, "Auth token is required"));
  }
  console.log("authHeader", authHeader);

  const accessToken = authHeader.split(" ")[1];
  if (!accessToken) {
    return next(createHttpError(401, "Access token not provided"));
  }
  try {
    const decoded = verifyToken(accessToken, config.JWT_ACCESS_KEY);
    console.log("decoded", decoded);
    const userDetails ={
        _id:decoded._id,
        email:decoded.email,
        name:decoded.name
    }
    req.user = userDetails; // Attach user details to the request object
    console.log("req.user", req.user);
    console.log("✅ User authenticated ---------:", req.user.email);
    // Proceed to the next middleware or route handler
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
};

export default authMiddleware;
