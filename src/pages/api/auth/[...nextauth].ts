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
import { getErrorMessage, logError } from '../../../utils/errorHandling'

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
      role?: string;
    }
  }
  
  interface User {
    id?: string;
    role?: string;
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
    picture?: string;
    role?: string;
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
    async jwt({ token, user, account, trigger, session }: { token: JWT; user?: any; account?: any; trigger?: string; session?: any }) {
      console.log('JWT callback called with trigger:', trigger);
      
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = user.role || 'user';
        if (account) {
          token.provider = account.provider;
        }
      }
      
      // Handle session update
      if (trigger === 'update' && session) {
        console.log('Session update triggered with:', session);
        
        // Update the token with the new session data
        if (session.role) {
          console.log('Updating token role to:', session.role);
          token.role = session.role;
        }
        
        if (session.user?.role) {
          console.log('Updating token role from user to:', session.user.role);
          token.role = session.user.role;
        }
        
        if (session.user?.image) {
          console.log('Updating token picture to:', session.user.image);
          token.picture = session.user.image;
        }
      }
      
      return token;
    },
    
    async session({ session, token }: { session: any; token: JWT }) {
      console.log('Session callback called with token:', token);
      
      if (token) {
        session.user.id = token.id;
        session.user.provider = token.provider;
        session.user.image = token.picture;
        session.user.role = token.role || 'user';
        
        // Always fetch latest user data to ensure we have the most up-to-date role
        try {
          await dbConnect();
          const user = await User.findById(token.id);
          if (user) {
            // Update session with latest user data
            session.user.image = user.image || session.user.image;
            session.user.role = user.role || 'user';
            
            // Also update the token for future session refreshes
            token.role = user.role;
            token.picture = user.image || token.picture;
            
            console.log('Updated session with database data:', {
              role: user.role,
              image: user.image
            });
          }
        } catch (error) {
          console.error('Error fetching user data for session:', error);
        }
      }
      
      console.log('Returning session with role:', session.user.role);
      return session;
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
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              // For OAuth users, we don't need a password, but our schema requires one
              // Set a secure random password they'll never use
              password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
            })
            
            await newUser.save()
          }
        } catch (error: unknown) {
          logError('OAuth sign in', error)
          console.error('Error during OAuth sign in:', getErrorMessage(error))
          return false
        }
      }
      
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback called with:', { url, baseUrl });
      
      // If the URL is relative, prepend the base URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If the URL is already absolute but on the same host, allow it
      else if (url.startsWith(baseUrl)) {
        return url;
      }
      // Otherwise, redirect to the base URL
      return baseUrl;
    },
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

// Validate that NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
  console.warn(
    'Warning: NEXTAUTH_SECRET is not set or is too short. This is insecure! Set the NEXTAUTH_SECRET environment variable to at least 32 characters in production.'
  );
}

// Export the NextAuth handler with the configuration
export default NextAuth(authOptions) 