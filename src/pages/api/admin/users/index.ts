import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getErrorMessage, logError } from '../../../../utils/errorHandling';

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
    
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await User.countDocuments();
    
    // Get users with pagination
    const users = await User.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .select('_id name email image role provider createdAt');
    
    return res.status(200).json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: unknown) {
    logError('fetch users', error);
    return res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: getErrorMessage(error) 
    });
  }
} 