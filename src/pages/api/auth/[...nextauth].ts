import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import TwitterProvider from 'next-auth/providers/twitter'
import { compare } from 'bcryptjs'
import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'
import { User as NextAuthUser } from 'next-auth'
import { Account, Profile } from 'next-auth'

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
    }
  }
  
  interface User {
    id?: string;
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
  }
}

// Export the NextAuth configuration as authOptions
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      version: "2.0", // Use OAuth 2.0
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        await dbConnect()
        
        // Find user in the database
        const user = await User.findOne({ email: credentials.email })
        
        if (!user) {
          return null
        }
        
        // Verify password
        const isPasswordValid = await compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          return null
        }
        
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        session.user.id = token.id
        session.user.provider = token.provider
      }
      return session
    },
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // Only proceed if using an OAuth provider
      if (account && account.provider !== 'credentials') {
        try {
          await dbConnect()
          
          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email })
          
          if (!existingUser) {
            // Create a new user if they don't exist
            const newUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              // For OAuth users, we don't need a password, but our schema requires one
              // Set a secure random password they'll never use
              password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
            })
            
            await newUser.save()
          }
        } catch (error) {
          console.error('Error during OAuth sign in:', error)
          return false
        }
      }
      
      return true
    }
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
}

// Export the NextAuth handler with the configuration
export default NextAuth(authOptions) 