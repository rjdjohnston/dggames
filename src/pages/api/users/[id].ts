import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'
import { getErrorMessage, logError } from '../../../utils/errorHandling'

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
    } catch (error: unknown) {
      console.log('Error looking up by ObjectId:', getErrorMessage(error))
    }
    
    // Method 2: Try to find by string ID in users collection
    if (!user) {
      try {
        console.log('Trying to find user by string ID')
        user = await db.collection('users').findOne({ id: id })
        if (user) lookupMethods.push('users.id string')
        console.log('Result of string ID lookup:', !!user)
      } catch (error: unknown) {
        console.log('Error looking up by string ID:', getErrorMessage(error))
      }
    }
    
    // Method 3: Try to find in accounts collection
    if (!user) {
      try {
        console.log('Trying to find user in accounts collection')
        const account = await db.collection('accounts').findOne({ userId: id })
        if (account) {
          user = await db.collection('users').findOne({ _id: new ObjectId(account.userId) })
          if (user) lookupMethods.push('accounts.userId -> users._id')
        }
        console.log('Result of accounts lookup:', !!user)
      } catch (error: unknown) {
        console.log('Error looking up in accounts:', getErrorMessage(error))
      }
    }
    
    // Method 4: Try to find in nextauth_users collection (for older NextAuth versions)
    if (!user) {
      try {
        console.log('Trying to find user in nextauth_users collection')
        user = await db.collection('nextauth_users').findOne({ id: id })
        if (user) lookupMethods.push('nextauth_users.id')
        console.log('Result of nextauth_users lookup:', !!user)
      } catch (error: unknown) {
        console.log('Error looking up in nextauth_users:', getErrorMessage(error))
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Format the user data for the response
    const userData = {
      id: user._id.toString(),
      name: user.name || '',
      email: user.email || '',
      image: user.image || '',
      lookupMethods
    }
    
    return res.status(200).json(userData)
  } catch (error: unknown) {
    logError('user lookup', error)
    return res.status(500).json({
      message: 'Failed to retrieve user',
      error: getErrorMessage(error),
    })
  } finally {
    if (client) await client.close()
  }
} 