import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Game from '../../../models/Game';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const games = await Game.find({ author: session.user.id })
        .sort({ lastUpdated: -1 });
      
      // Ensure we're returning an array, even if empty
      return res.status(200).json(Array.isArray(games) ? games : []);
    } catch (error) {
      console.error('Error fetching games:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 