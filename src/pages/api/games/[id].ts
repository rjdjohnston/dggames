import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import dbConnect from '../../../lib/mongodb';
import Game from '../../../models/Game';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid game ID' });
  }
  
  await dbConnect();

  try {
    // Validate that the ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid game ID format' });
    }
    
    // Find game by ID and populate author information
    const game = await Game.findById(id).lean();
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Get author information
    const author = await User.findById(game.author).select('name image').lean();
    
    // Format the response
    const gameData = {
      id: game._id.toString(),
      title: game.title,
      description: game.description,
      content: game.content,
      category: game.category,
      image: game.image,
      likes: game.likes,
      plays: game.plays,
      progress: game.progress,
      createdAt: game.createdAt,
      lastUpdated: game.lastUpdated,
      author: author ? {
        id: author._id.toString(),
        name: author.name,
        image: author.image
      } : null
    };
    
    return res.status(200).json(gameData);
  } catch (error) {
    console.error('Error fetching game:', error);
    return res.status(500).json({ message: 'Error fetching game details' });
  }
} 