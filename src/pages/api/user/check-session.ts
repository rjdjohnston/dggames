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
    // Get the current session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        message: 'No active session',
        authenticated: false
      });
    }

    // Get the user ID from the session
    const userId = session.user.id;
    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID not found in session',
        session
      });
    }

    // Connect to the database
    await dbConnect();
    
    // Get the user from the database
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found in database',
        sessionUserId: userId
      });
    }
    
    // Return session and database user information
    return res.status(200).json({
      message: 'Session and user data retrieved successfully',
      session: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role
      },
      databaseUser: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        provider: user.provider
      },
      roleMatch: session.user.role === user.role
    });
  } catch (error: unknown) {
    logError('check session', error);
    return res.status(500).json({ 
      message: 'Failed to check session', 
      error: getErrorMessage(error) 
    });
  }
} 