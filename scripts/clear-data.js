#!/usr/bin/env node

const mongoose = require("mongoose");

const COLLECTIONS = ["books", "booksegments", "voicesessions"];

async function collectionExists(name) {
  const collections = await mongoose.connection.db
    .listCollections({ name })
    .toArray();

  return collections.length > 0;
}

async function clearCollection(name) {
  const exists = await collectionExists(name);

  if (!exists) {
    console.log(`[skip] ${name}: collection not found.`);
    return;
  }

  const result = await mongoose.connection.collection(name).deleteMany({});
  console.log(`[ok] ${name}: deleted ${result.deletedCount} documents.`);
}

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required to run this script.");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected. Clearing development data...");

  for (const collectionName of COLLECTIONS) {
    try {
      await clearCollection(collectionName);
    } catch (error) {
      console.error(`[error] ${collectionName}:`, error);
    }
  }

  console.log("Data clearance complete.");
}

main()
  .catch((error) => {
    console.error("Fatal error while clearing data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });