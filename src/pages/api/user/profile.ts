import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
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

    // Get the updated profile data from the request body
    const { name, bio } = req.body;

    // Validate the data
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Connect to the database
    await dbConnect();

    // Update the user profile
    await User.findByIdAndUpdate(userId, {
      name,
      bio: bio || '',
    });

    // Return success response
    return res.status(200).json({ 
      message: 'Profile updated successfully',
      user: {
        name,
        bio: bio || '',
      }
    });
  } catch (error: unknown) {
    logError('profile update', error);
    return res.status(500).json({ 
      message: 'Failed to update profile', 
      error: getErrorMessage(error) 
    });
  }
} 