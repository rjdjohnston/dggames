import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { seedDatabase } from '../../lib/seedDatabase';
import { getErrorMessage, logError } from '../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In production, require admin authentication
    if (!isDevelopment) {
      // Check if the user is authenticated and is an admin
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user || session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
    }

    // Run the seed function
    const result = await seedDatabase() || { success: false, error: 'Unknown error' };
    
    if (result.success) {
      return res.status(200).json({ 
        message: 'Database seeded successfully',
        details: 'Created demo user, admin user, and sample games'
      });
    } else {
      return res.status(500).json({ 
        message: 'Failed to seed database', 
        error: result.error 
      });
    }
  } catch (error: unknown) {
    logError('seed database', error);
    return res.status(500).json({ 
      message: 'Failed to seed database', 
      error: getErrorMessage(error) 
    });
  }
} 