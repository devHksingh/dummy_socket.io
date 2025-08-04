import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { userAccessToken } from "../utils/genrateJwtToken.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      maxlength: [24, "Name cannot exceed 24 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.isPasswordCorrect = async function (password) {
    const result = await bcrypt.compare(password, this.password)
    return result
}


userSchema.methods.generateAccessToken = function () {
    const token = userAccessToken({
        _id: this._id,
        email: this.email,
        name: this.name,
        
    })
    return `Bearer ${token}`
}

export const User = mongoose.model('User', userSchema)