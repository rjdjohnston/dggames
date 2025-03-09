import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
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
    
    // Check if the user has an image set in the database
    if (user.image && !user.image.includes('dicebear')) {
      return res.status(200).json({ 
        imageUrl: user.image,
        source: 'database'
      });
    }
    
    // If no image in database or it's a Dicebear image, try to find the latest avatar file
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    
    try {
      // Check if the directory exists
      await fsPromises.access(uploadsDir);
      
      // Get all files in the directory
      const files = await fsPromises.readdir(uploadsDir);
      
      // Filter for avatar files for this user
      const userAvatars = files.filter(file => 
        file.startsWith(`avatar_${userId}_`) && 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      
      if (userAvatars.length > 0) {
        // Sort by timestamp (newest first)
        userAvatars.sort((a, b) => {
          const timestampA = parseInt(a.split('_')[2]?.split('.')[0] || '0');
          const timestampB = parseInt(b.split('_')[2]?.split('.')[0] || '0');
          return timestampB - timestampA;
        });
        
        // Get the latest avatar
        const latestAvatar = userAvatars[0];
        const imageUrl = `/uploads/avatars/${latestAvatar}`;
        
        // Update the user in the database
        await User.findByIdAndUpdate(userId, { image: imageUrl });
        
        return res.status(200).json({ 
          imageUrl,
          source: 'filesystem',
          allAvatars: userAvatars
        });
      }
      
      // No avatar files found
      return res.status(404).json({ message: 'No avatar files found for user' });
    } catch (error) {
      // Directory doesn't exist or other error
      return res.status(404).json({ 
        message: 'Avatar directory not found or error reading files',
        error: getErrorMessage(error)
      });
    }
  } catch (error: unknown) {
    logError('get latest avatar', error);
    return res.status(500).json({ 
      message: 'Failed to get latest avatar', 
      error: getErrorMessage(error) 
    });
  }
} 