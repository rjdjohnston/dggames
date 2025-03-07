import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import dbConnect from '../../../../lib/mongodb';
import Game from '../../../../models/Game';

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
    } catch (error) {
      console.error('Error recording play:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Handle serving game files
  if (req.method === 'GET') {
    try {
      await dbConnect();
      
      const game = await Game.findById(id).lean();
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
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
    } catch (error) {
      console.error('Game API error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 