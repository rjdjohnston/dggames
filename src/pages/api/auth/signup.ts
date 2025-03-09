import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST for registration
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Connect to database
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      provider: 'credentials',
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    });

    await user.save();

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error: unknown) {
    logError('signup handler', error);
    return res.status(500).json({ 
      message: 'Error creating user', 
      error: getErrorMessage(error) 
    });
  }
} 