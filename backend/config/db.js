import mongoose from 'mongoose';

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 100,        // allow 100 concurrent DB connections (default is 5)
    minPoolSize: 10,         // keep 10 connections warm
    socketTimeoutMS: 45000,  // close sockets after 45s of inactivity
    serverSelectionTimeoutMS: 10000, // fail fast if mongo unreachable
    connectTimeoutMS: 10000,
    family: 4,               // use IPv4, avoids Docker DNS issues
  });
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;