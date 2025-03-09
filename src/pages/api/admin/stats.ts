import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if the user is authenticated and is an admin
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Connect to the database
    await dbConnect();
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const proUsers = await User.countDocuments({ role: 'pro' });
    
    return res.status(200).json({
      totalUsers,
      adminUsers,
      proUsers
    });
  } catch (error: unknown) {
    logError('admin stats', error);
    return res.status(500).json({ 
      message: 'Failed to fetch admin statistics', 
      error: getErrorMessage(error) 
    });
  }
} 