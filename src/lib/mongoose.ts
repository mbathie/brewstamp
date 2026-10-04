import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        dbName: "brewstamp",
        // Fail fast when the cluster is unreachable. The driver default (30s
        // per attempt) let one request hang for nearly two minutes during a
        // brief managed-DB outage on 2026-10-03; 10s surfaces the error
        // while the driver keeps reconnecting in the background.
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
      })
      .then((mongoose) => {
        return mongoose;
      })
      .catch((err) => {
        // Don't cache a failed first connect: every later request would
        // rethrow it until the process restarted.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export { connectDB };
