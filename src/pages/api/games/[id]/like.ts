import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection details
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL
const MONGODB_DB = process.env.MONGODB_DB || process.env.DB_NAME || 'dggames'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow POST for adding likes and DELETE for removing likes
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Check if the user is authenticated
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' })
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

    // Handle POST request (add like)
    if (req.method === 'POST') {
      if (existingLike) {
        return res.status(400).json({ message: 'You have already liked this game' })
      }

      // Record the like
      await db.collection('likes').insertOne({
        gameId: id,
        userId: userId,
        createdAt: new Date()
      })

      // Increment the like count on the game
      const result = await db.collection('games').updateOne(
        { _id: new ObjectId(id) },
        { $inc: { likes: 1 } }
      )

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'Game not found' })
      }

      return res.status(200).json({ message: 'Game liked successfully' })
    }
    
    // Handle DELETE request (remove like)
    if (req.method === 'DELETE') {
      if (!existingLike) {
        return res.status(400).json({ message: 'You have not liked this game' })
      }

      // Remove the like
      await db.collection('likes').deleteOne({
        gameId: id,
        userId: userId
      })

      // Decrement the like count on the game
      const result = await db.collection('games').updateOne(
        { _id: new ObjectId(id) },
        { $inc: { likes: -1 } }
      )

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'Game not found' })
      }

      return res.status(200).json({ message: 'Like removed successfully' })
    }
    
  } catch (error: unknown) {
    console.error('API error:', error)
    return res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close()
    }
  }
} 