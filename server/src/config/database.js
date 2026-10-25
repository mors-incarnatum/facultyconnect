import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  if (!env.mongodbUri) {
    console.log("MongoDB not configured. Set MONGODB_URI in server/.env to connect.");
    return;
  }

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected.");
}
