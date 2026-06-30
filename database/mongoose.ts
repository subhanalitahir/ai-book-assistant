import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env",
  );
}
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cashed =
  global.mongooseCache ||
  (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
  if (cashed.conn) {
    return cashed.conn;
  }
  if (!cashed.promise) {
    cashed.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });

    try {
      cashed.conn = await cashed.promise;
    } catch (err) {
      cashed.promise = null;
      console.log("Error connecting to MongoDB:", err);
      throw err;
    }
    console.log("Connected to MongoDB");
    return cashed.conn;
  }
  return cashed.promise;
};
