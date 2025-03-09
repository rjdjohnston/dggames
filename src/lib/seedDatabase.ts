import { hash } from 'bcryptjs';
import dbConnect from './mongodb';
import User from '../models/User';
import Game from '../models/Game';
import mongoose from 'mongoose';

export async function seedDatabase() {
  try {
    await dbConnect();
    
    // Check if we already have games
    const gamesCount = await Game.countDocuments();
    if (gamesCount > 0) {
      console.log('Database already seeded');
      return;
    }
    
    // Create demo user if not exists
    const existingUser = await User.findOne({ email: 'demo@example.com' });
    let userId;
    
    if (!existingUser) {
      const user = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password: await hash('password123', 10),
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        bio: 'This is a demo user account',
        role: 'user' // Explicitly set role to user
      });
      
      await user.save();
      userId = user._id;
      console.log('Demo user created');
    } else {
      userId = existingUser._id;
    }
    
    // Create admin user if not exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    let adminId;
    
    if (!existingAdmin) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: await hash('admin123', 10),
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        bio: 'This is an admin account with full access to the system',
        role: 'admin' // Set role to admin
      });
      
      await admin.save();
      adminId = admin._id;
      console.log('Admin user created');
    } else {
      adminId = existingAdmin._id;
      
      // Ensure the admin user has the admin role
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('Updated existing user to admin role');
      }
    }
    
    // Sample games data
    const gamesData = [
      {
        title: 'Dragon\'s Quest',
        description: 'Embark on an epic journey through magical realms to defeat the legendary dragon.',
        category: 'Fantasy',
        image: 'https://picsum.photos/id/237/400/225',
        author: userId,
        progress: 0,
        likes: 2500,
        plays: 12000,
        gameType: 'html5',
        gameDirName: 'dragons-quest',
        content: 'You are a brave knight on a quest to defeat the dragon that has been terrorizing the kingdom.'
      },
      {
        title: 'Space Explorer',
        description: 'Navigate through the unknown depths of space and discover new worlds.',
        category: 'Sci-Fi',
        image: 'https://picsum.photos/id/1/400/225',
        author: userId,
        progress: 0,
        likes: 1800,
        plays: 8000,
        gameType: 'javascript',
        gameDirName: 'space-explorer',
        content: 'As a space explorer, your mission is to discover new planets and establish contact with alien civilizations.'
      },
      {
        title: 'Murder Mystery',
        description: 'Solve the case of a mysterious murder in a small town filled with secrets.',
        category: 'Mystery',
        image: 'https://picsum.photos/id/20/400/225',
        author: adminId, // Assign this game to the admin user
        progress: 0,
        likes: 3200,
        plays: 15000,
        gameType: 'text',
        gameDirName: 'murder-mystery',
        content: 'A body has been found in the small town of Millfield. As the detective, it\'s your job to solve the case.'
      },
      {
        title: 'Zombie Apocalypse',
        description: 'Survive in a world overrun by zombies, where every decision could be your last.',
        category: 'Horror',
        image: 'https://picsum.photos/id/60/400/225',
        author: adminId, // Assign this game to the admin user
        progress: 0,
        likes: 4100,
        plays: 20000,
        gameType: 'unity',
        gameDirName: 'zombie-apocalypse',
        content: 'The world has been overrun by zombies. Your goal is to survive and find other survivors.'
      }
    ];
    
    await Game.insertMany(gamesData);
    console.log('Sample games created');
    
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
}

// Allow running directly from Node
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeded successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error seeding database:', error);
      process.exit(1);
    });
} 