import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Game from '../../../models/Game';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      console.log('Session user ID:', session.user.id);
      
      const games = await Game.find({ author: session.user.id })
        .sort({ lastUpdated: -1 });
      
      console.log('Found games count:', games.length);
      
      return res.status(200).json(Array.isArray(games) ? games : []);
    } catch (error) {
      console.error('Error fetching games:', error);
      return res.status(500).json({ message: 'Internal server error', error: String(error) });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 