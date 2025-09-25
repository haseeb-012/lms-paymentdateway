import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";


const userSchema = new mongoose.Schema({});


export const User = mongoose.model("User", userSchema);