import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection details
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL
const MONGODB_DB = process.env.MONGODB_DB || process.env.DB_NAME || 'dggames'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Get the user ID from the request
  const { id } = req.query
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  console.log(`Looking up user with ID: ${id}`)
  
  let client

  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${MONGODB_URI?.substring(0, 20)}...`)
    console.log(`Database name: ${MONGODB_DB}`)
    
    client = new MongoClient(MONGODB_URI as string)
    await client.connect()
    console.log('MongoDB connection established')
    
    const db = client.db(MONGODB_DB)
    
    // List collections to debug
    const collections = await db.listCollections().toArray()
    console.log('Available collections:', collections.map(c => c.name))
    
    // Try to find the user by ID
    let user = null
    let lookupMethods = []
    
    // Method 1: Try to find by MongoDB ObjectId in users collection
    try {
      console.log('Trying to find user by ObjectId')
      user = await db.collection('users').findOne({ _id: new ObjectId(id) })
      if (user) lookupMethods.push('users._id ObjectId')
      console.log('Result of ObjectId lookup:', !!user)
    } catch (error) {
      console.log('Error looking up by ObjectId:', error.message)
    }
    
    // Method 2: Try to find by string ID in users collection
    if (!user) {
      console.log('Trying to find user by string id')
      user = await db.collection('users').findOne({ id: id })
      if (user) lookupMethods.push('users.id string')
      console.log('Result of string id lookup:', !!user)
    }

    // Method 3: Try to find by providerId in accounts collection
    if (!user) {
      console.log('Trying to find user by providerId in accounts')
      const account = await db.collection('accounts').findOne({ providerId: id })
      if (account) {
        console.log('Found account with providerId:', account)
        user = await db.collection('users').findOne({ _id: new ObjectId(account.userId) })
        if (user) lookupMethods.push('accounts.providerId')
        console.log('Result of providerId lookup:', !!user)
      }
    }
    
    // Method 4: Try to find by userId in accounts collection
    if (!user) {
      console.log('Trying to find user by userId in accounts')
      const account = await db.collection('accounts').findOne({ userId: id })
      if (account) {
        console.log('Found account with userId:', account)
        user = await db.collection('users').findOne({ _id: new ObjectId(account.userId) })
        if (user) lookupMethods.push('accounts.userId')
        console.log('Result of userId lookup:', !!user)
      }
    }
    
    // Method 5: Try to find in games collection
    if (!user) {
      console.log('Trying to find user info in games collection')
      const game = await db.collection('games').findOne({ 'author.id': id })
      if (game && game.author) {
        console.log('Found author info in game:', game.author)
        // Return the author info from the game as our user
        user = {
          _id: id,
          ...game.author
        }
        lookupMethods.push('games.author')
        console.log('Result of games.author lookup:', !!user)
      }
    }
    
    // Method 6: Last resort - check if this ID is the user's email
    if (!user) {
      console.log('Trying to find user by email')
      user = await db.collection('users').findOne({ email: id })
      if (user) lookupMethods.push('users.email')
      console.log('Result of email lookup:', !!user)
    }
    
    // If user not found, return 404 with debugging info
    if (!user) {
      console.log('User not found with any method')
      return res.status(404).json({ 
        message: 'User not found',
        id: id,
        checkedMethods: [
          'users._id (ObjectId)',
          'users.id (string)',
          'accounts.providerId',
          'accounts.userId',
          'games.author.id',
          'users.email'
        ]
      })
    }
    
    console.log('User found with method(s):', lookupMethods)
    console.log('Raw user data:', JSON.stringify(user, null, 2))
    
    // Sanitize the user object before returning
    const sanitizedUser = {
      id: user._id?.toString() || id,
      name: user.name || user.displayName || 'User',
      email: user.email,
      image: user.image || user.avatar || user.profileImage,
      username: user.username,
      displayName: user.displayName || user.name || 'User',
      createdAt: user.createdAt
    }
    
    console.log('Returning sanitized user:', sanitizedUser)
    return res.status(200).json(sanitizedUser)
    
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close()
      console.log('MongoDB connection closed')
    }
  }
} 