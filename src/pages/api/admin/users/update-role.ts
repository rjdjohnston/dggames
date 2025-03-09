import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getErrorMessage, logError } from '../../../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if the user is authenticated and is an admin
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Get request body
    const { userId, role } = req.body;

    // Validate request body
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!role || !['user', 'admin', 'pro'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (user, admin, or pro)' });
    }

    // Prevent admins from changing their own role
    if (userId === session.user.id) {
      return res.status(403).json({ message: 'You cannot change your own role' });
    }

    // Connect to the database
    await dbConnect();
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the user's role
    user.role = role;
    await user.save();
    
    return res.status(200).json({ 
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: unknown) {
    logError('update user role', error);
    return res.status(500).json({ 
      message: 'Failed to update user role', 
      error: getErrorMessage(error) 
    });
  }
} 