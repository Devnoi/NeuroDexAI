import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rit_db';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('MongoDB connected successfully to:', uri);
    global.useMemoryDB = false;
  } catch (error) {
    console.warn('\n==================================================');
    console.warn('WARNING: MongoDB connection failed.');
    console.warn('Falling back to in-memory local storage mode.');
    console.warn('==================================================\n');
    global.useMemoryDB = true;
  }
};

export default connectDB;
