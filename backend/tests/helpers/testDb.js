import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export const connect = async () => {
  // 1. Force close any rogue connections started by server.js
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // 2. Safely start the memory server
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const closeDatabase = async () => {
  if (mongod) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  }
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};