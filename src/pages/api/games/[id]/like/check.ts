import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { MongoClient } from 'mongodb'

// MongoDB connection details
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL
const MONGODB_DB = process.env.MONGODB_DB || process.env.DB_NAME || 'dggames'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Check if the user is authenticated
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) {
    return res.status(200).json({ hasLiked: false })
  }

  // Get the game ID from the request
  const { id } = req.query
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid game ID' })
  }

  let client

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI as string)
    await client.connect()
    const db = client.db(MONGODB_DB)
    
    // Get user ID from session
    // @ts-ignore - TypeScript doesn't know about id on session.user
    const userId = session.user.id || session.user.email

    // Check if the user has already liked this game
    const existingLike = await db.collection('likes').findOne({
      gameId: id,
      userId: userId
    })

    return res.status(200).json({ hasLiked: !!existingLike })
    
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    })
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close()
    }
  }
} 