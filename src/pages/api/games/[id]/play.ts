import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import dbConnect from '../../../../lib/mongodb';
import Game from '../../../../models/Game';
import { getErrorMessage, logError } from '../../../../utils/errorHandling';
import mongoose from 'mongoose';

// Define a type for the game document
interface GameDocument {
  _id: mongoose.Types.ObjectId | string;
  gameType: string;
  content?: string;
  files?: {
    mainFile?: string;
  };
  [key: string]: any; // For other properties
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid game ID' });
  }
  
  if (req.method === 'POST') {
    try {
      await dbConnect();
      
      // Increment play count
      await Game.findByIdAndUpdate(id, { $inc: { plays: 1 } });
      
      return res.status(200).json({ message: 'Play recorded successfully' });
    } catch (error: unknown) {
      logError('recording play', error);
      return res.status(500).json({ 
        message: 'Failed to record play', 
        error: getErrorMessage(error) 
      });
    }
  }
  
  // Handle serving game files
  if (req.method === 'GET') {
    try {
      await dbConnect();
      
      // First get the raw document
      const rawGame = await Game.findById(id).lean();
      
      if (!rawGame) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Then cast it to our interface
      const game = rawGame as unknown as GameDocument;
      
      // Handle text adventure games
      if (game.gameType === 'text') {
        return res.status(200).json({ content: game.content });
      }
      
      // Handle file-based games
      if (!game.files?.mainFile) {
        return res.status(404).json({ message: 'Game file not found' });
      }
      
      const filePath = path.join(process.cwd(), 'public', game.files.mainFile.replace(/^\//, ''));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Game file not found' });
      }
      
      const fileContents = await fsPromises.readFile(filePath);
      
      // Set content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'text/html';
      
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      
      res.setHeader('Content-Type', contentType);
      return res.send(fileContents);
    } catch (error: unknown) {
      logError('serving game files', error);
      return res.status(500).json({ 
        message: 'Failed to serve game files', 
        error: getErrorMessage(error) 
      });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 