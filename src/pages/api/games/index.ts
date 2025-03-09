import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Game from '../../../models/Game';
import { seedDatabase } from '../../../lib/seedDatabase';
import { getErrorMessage, logError } from '../../../utils/errorHandling';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      // Check if we have games, if not, seed the database
      const count = await Game.countDocuments();
      if (count === 0) {
        await seedDatabase();
      }
      
      // Get featured games
      const games = await Game.find({})
        .sort({ likes: -1 })
        .limit(10)
        .lean();
      
      // Transform MongoDB _id to id for frontend consumption
      const formattedGames = games.map(game => {
        // Safely access properties with type checking
        const gameId = game._id ? (typeof game._id.toString === 'function' ? game._id.toString() : String(game._id)) : '';
        
        return {
          id: gameId,
          title: game.title || '',
          description: game.description || '',
          category: game.category || '',
          image: game.image || '',
          likes: typeof game.likes === 'number' ? game.likes : 0,
          plays: typeof game.plays === 'number' ? game.plays : 0
        };
      });
      
      return res.status(200).json(formattedGames);
    } catch (error: unknown) {
      logError('fetching games', error);
      return res.status(500).json({ 
        message: 'Failed to fetch games', 
        error: getErrorMessage(error)
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 