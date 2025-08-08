import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import createHttpError from "http-errors";

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new Error(`Invalid token: ${err.message}`);
  }
};

export const socketAuthMiddleware = (socket, next) => {
  try {
    // Get token from auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Handle Bearer token format
    const accessToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    if (!accessToken) {
      return next(new Error("Invalid token format"));
    }

    const decoded = verifyToken(accessToken, config.JWT_ACCESS_KEY);
    
    // Attach user details to socket
    socket.user = {
      _id: decoded._id,
      email: decoded.email,
      name: decoded.name,
    };

    console.log("✅ Socket authenticated:", socket.user.email);
    next();

  } catch (error) {
    console.error("❌ Socket authentication failed:", error.message);
    next(new Error("Authentication failed"));
  }
};