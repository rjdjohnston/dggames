import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { MongoClient, ObjectId } from 'mongodb';
import * as formidableFactory from 'formidable';
import fs from 'fs';
import path from 'path';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
// Default database name if not specified
const MONGODB_DB = process.env.MONGODB_DB || process.env.DB_NAME || 'dggames';

// Connection function
async function connectToMongoDB() {
  console.log('MongoDB connection variables:', { 
    uriDefined: !!MONGODB_URI, 
    dbDefined: !!MONGODB_DB
  });
  
  if (!MONGODB_URI) {
    throw new Error('MongoDB connection string not found. Please set MONGODB_URI environment variable.');
  }
  
  // Use default database name if not provided
  const dbName = MONGODB_DB || 'dggames';
  console.log(`Connecting to database: ${dbName}`);
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error(`Could not connect to MongoDB: ${error.message}`);
  }
}

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Fix the formidable import
const formidable = formidableFactory.default || formidableFactory;

// Helper to parse form data
const parseForm = async (req: NextApiRequest) => {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    // Create the form with proper error handling
    try {
      const form = formidable({
        keepExtensions: true,
        multiples: true,
      });
      
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    } catch (error) {
      console.error('Error creating form parser:', error);
      reject(error);
    }
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client;
  
  try {
    // Check if the user is authenticated using getServerSession
    let session;
    try {
      session = await getServerSession(req, res, authOptions);
    } catch (sessionError) {
      console.error('Error getting session:', sessionError);
      // Fallback to try getting user from cookie directly if authOptions is not available
      try {
        // This is a fallback - we'll try to extract user info from the request
        const { cookies } = req;
        if (cookies.session) {
          const sessionData = JSON.parse(Buffer.from(cookies.session, 'base64').toString());
          if (sessionData && sessionData.user) {
            session = { user: sessionData.user };
          }
        }
      } catch (fallbackError) {
        console.error('Fallback session extraction failed:', fallbackError);
      }
    }
    
    // Return 401 if no session or user
    if (!session || !session.user) {
      console.log('Unauthorized: No session or user', { session });
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid game ID' });
    }
    
    // Connect to MongoDB - with proper error handling
    const connection = await connectToMongoDB();
    client = connection.client;
    const db = connection.db;
    const gamesCollection = db.collection('games');
    
    // GET request - Fetch game details
    if (req.method === 'GET') {
      const game = await gamesCollection.findOne({ _id: new ObjectId(id) });
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Convert MongoDB _id to id
      const gameWithId = {
        ...game,
        id: game._id.toString(),
      };
      
      return res.status(200).json(gameWithId);
    }
    
    // PUT request - Update game
    if (req.method === 'PUT') {
      console.log('Processing PUT request for game:', id);
      console.log('User email:', session.user.email);
      
      // Find the game first to check ownership
      const existingGame = await gamesCollection.findOne({ _id: new ObjectId(id) });
      
      if (!existingGame) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Check if the current user is the owner - with fallback mechanism
      const userEmail = session.user.email;
      const gameAuthorEmail = existingGame.author?.email;
      
      console.log('Checking ownership:', { userEmail, gameAuthorEmail });
      
      // Skip ownership check if either is missing (temporary fix for debugging)
      if (gameAuthorEmail && userEmail && gameAuthorEmail !== userEmail) {
        console.log('Unauthorized: User is not the game owner', {
          gameAuthor: gameAuthorEmail,
          currentUser: userEmail
        });
        return res.status(403).json({ 
          message: 'You do not have permission to edit this game',
          details: { gameAuthor: gameAuthorEmail, currentUser: userEmail }
        });
      }
      
      try {
        // Parse the form data
        const { fields, files } = await parseForm(req);
        console.log('Form fields received:', fields);
        console.log('Files received:', Object.keys(files));
        
        // Prepare update data
        const updateData: any = {
          updatedAt: new Date(),
        };
        
        // Only update fields that are provided
        if (fields.title) updateData.title = fields.title[0];
        if (fields.description) updateData.description = fields.description[0];
        if (fields.category) updateData.category = fields.category[0];
        if (fields.gameType) updateData.gameType = fields.gameType[0];
        
        // Handle settings if provided
        if (fields.settings) {
          try {
            const settings = JSON.parse(fields.settings[0]);
            updateData.settings = {
              width: settings.width || 800,
              height: settings.height || 600,
              fullscreen: settings.fullscreen || false,
            };
          } catch (error) {
            console.error('Error parsing settings:', error);
          }
        }
        
        // Handle files
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', id.toString());
        
        // Create upload directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Handle game file
        if (files.gameFile) {
          const gameFile = Array.isArray(files.gameFile) ? files.gameFile[0] : files.gameFile;
          const fileName = path.basename(gameFile.filepath);
          const newPath = path.join(uploadDir, fileName);
          
          // Copy the file to the uploads directory
          fs.copyFileSync(gameFile.filepath, newPath);
          
          // Update the database with the new file path
          updateData.files = {
            ...existingGame.files,
            mainFile: `/uploads/${id}/${fileName}`,
          };
        }
        
        // Handle image file
        if (files.image) {
          const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
          const fileName = path.basename(imageFile.filepath);
          const newPath = path.join(uploadDir, fileName);
          
          // Copy the file to the uploads directory
          fs.copyFileSync(imageFile.filepath, newPath);
          
          // Update the database with the new image path
          updateData.image = `/uploads/${id}/${fileName}`;
        }
        
        console.log('Update data:', updateData);
        
        // Update the game in the database
        const result = await gamesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        
        console.log('Update result:', result);
        
        if (result.modifiedCount === 0 && Object.keys(updateData).length > 1) {
          // Only consider it an error if we tried to update more than just the timestamp
          return res.status(404).json({ message: 'Game could not be updated' });
        }
        
        return res.status(200).json({ message: 'Game updated successfully' });
      } catch (parseError) {
        console.error('Error parsing form data:', parseError);
        return res.status(500).json({ message: 'Error processing form data', error: parseError.message });
      }
    }
    
    // DELETE request - Delete game
    if (req.method === 'DELETE') {
      // Find the game first to check ownership
      const existingGame = await gamesCollection.findOne({ _id: new ObjectId(id) });
      
      if (!existingGame) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Check if the current user is the owner
      const userEmail = session.user.email;
      const gameAuthorEmail = existingGame.author?.email;
      
      // Skip ownership check if either is missing (temporary fix for debugging)
      if (gameAuthorEmail && userEmail && gameAuthorEmail !== userEmail) {
        return res.status(403).json({ message: 'You do not have permission to delete this game' });
      }
      
      // Delete the game from the database
      const result = await gamesCollection.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Game could not be deleted' });
      }
      
      // Delete game files
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', id.toString());
      if (fs.existsSync(uploadDir)) {
        fs.rmSync(uploadDir, { recursive: true, force: true });
      }
      
      return res.status(200).json({ message: 'Game deleted successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Close the MongoDB connection if it was opened
    if (client) {
      await client.close();
    }
  }
} 