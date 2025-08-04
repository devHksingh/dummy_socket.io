import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

const userAccessToken = (payload) => {
  console.log("userAccessToken");
  console.log("payload in utils", payload);
  if (!payload) {
    console.log("No payload provided");
    return null;
  }
  const token = jwt.sign(payload, config.JWT_ACCESS_KEY, {
    algorithm: "HS256",
    expiresIn: "54h",
  });
  console.log("token in utils", token);
  return token;
};

export { userAccessToken };
