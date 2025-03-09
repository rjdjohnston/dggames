import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if the user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get the user ID from the session
    const userId = session.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in session' });
    }

    // Connect to the database
    await dbConnect();
    
    // Get the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the user has a role
    let updated = false;
    if (!user.role) {
      // Set default role to 'user'
      user.role = 'user';
      await user.save();
      updated = true;
      console.log(`Updated user ${userId} with default role 'user'`);
    }
    
    return res.status(200).json({ 
      message: updated ? 'User role updated' : 'User role already set',
      role: user.role,
      updated
    });
  } catch (error: unknown) {
    logError('check user role', error);
    return res.status(500).json({ 
      message: 'Failed to check user role', 
      error: getErrorMessage(error) 
    });
  }
} 