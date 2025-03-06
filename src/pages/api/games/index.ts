import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Game from '../../../models/Game';
import { seedDatabase } from '../../../lib/seedDatabase';

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
      const formattedGames = games.map(game => ({
        id: game._id.toString(),
        title: game.title,
        description: game.description,
        category: game.category,
        image: game.image,
        likes: game.likes,
        plays: game.plays
      }));
      
      return res.status(200).json(formattedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 