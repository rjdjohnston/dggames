import mongoose from 'mongoose';
import { logError } from '../utils/errorHandling';

// Define the type for our cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type
declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storygame';

// Initialize the cached connection
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// If the cache doesn't exist yet, create it
if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
    };

    console.log(`Connecting to MongoDB at ${MONGODB_URI}`);
    
    // Add retry logic
    let retries = 5;
    let lastError: Error | null = null;
    
    while (retries > 0) {
      try {
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
          console.log('MongoDB connected successfully');
          return mongoose;
        });
        break; // Connection successful, exit retry loop
      } catch (error) {
        lastError = error as Error;
        console.error(`MongoDB connection attempt failed (${retries} retries left):`, error);
        retries--;
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, 5 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If all retries failed, throw the last error
    if (retries === 0 && lastError) {
      logError('MongoDB connection', lastError);
      throw new Error(`Failed to connect to MongoDB after multiple attempts: ${lastError.message}`);
    }
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    logError('MongoDB connection', error);
    throw error;
  }
}

export default dbConnect; 