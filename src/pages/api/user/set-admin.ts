import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('set-admin API called');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Only allow in development mode - TEMPORARILY DISABLED FOR TESTING
  // if (process.env.NODE_ENV !== 'development') {
  //   console.log('Not in development mode');
  //   return res.status(403).json({ 
  //     message: 'This endpoint is only available in development mode' 
  //   });
  // }

  try {
    // Check if the user is authenticated
    const session = await getServerSession(req, res, authOptions);
    console.log('Session:', session ? 'exists' : 'null');
    
    if (!session || !session.user) {
      console.log('Unauthorized: No session or user');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get the user ID from the session
    const userId = session.user.id;
    console.log('User ID from session:', userId);
    
    if (!userId) {
      console.log('User ID not found in session');
      return res.status(400).json({ message: 'User ID not found in session' });
    }

    // Connect to the database
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Connected to database');
    
    // Get the user from the database
    console.log('Finding user with ID:', userId);
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.name, 'Current role:', user.role);
    
    // Set the user's role to admin
    user.role = 'admin';
    console.log('Setting role to admin');
    await user.save();
    console.log('User saved with new role');
    
    return res.status(200).json({ 
      message: 'User role updated to admin',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: unknown) {
    console.error('Error in set-admin API:', error);
    logError('set admin role', error);
    return res.status(500).json({ 
      message: 'Failed to set admin role', 
      error: getErrorMessage(error) 
    });
  }
} 