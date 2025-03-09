# OAuth Provider Setup for DG Games

This guide explains how to set up OAuth authentication with Google, GitHub, and Twitter (X) for your DG Games application.

## Prerequisites

- A DG Games application running with NextAuth.js
- Developer accounts for each provider you want to use

## Environment Variables

Create or update your `.env` file with the following variables:

```
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Twitter OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

### Generating a Secure Secret

For production use, it's important to use a strong, random secret for NEXTAUTH_SECRET. You can generate one using OpenSSL:

```bash
openssl rand -base64 32
```

This will output a random 32-byte string encoded in base64, which is ideal for use as your NEXTAUTH_SECRET.

## Provider Setup Instructions

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name for your OAuth client
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production URL (if applicable)
8. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-production-domain.com/api/auth/callback/google` (for production)
9. Click "Create" and note your Client ID and Client Secret

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: "DG Games" (or your preferred name)
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Note your Client ID
6. Generate a new client secret and note it down

### Twitter (X) OAuth Setup

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Navigate to the app settings
4. Enable OAuth 2.0
5. Set the redirect URL to:
   - `http://localhost:3000/api/auth/callback/twitter` (for development)
   - `https://your-production-domain.com/api/auth/callback/twitter` (for production)
6. Set the website URL to your application's URL
7. Save the settings
8. Note your Client ID and Client Secret

## Testing Your OAuth Setup

1. Start your application
2. Navigate to the sign-in page
3. Click on the OAuth provider button you want to test
4. You should be redirected to the provider's authentication page
5. After authenticating, you should be redirected back to your application

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URIs in your provider settings exactly match the ones used by NextAuth.js.
2. **Invalid Credentials**: Double-check your client IDs and secrets in your `.env` file.
3. **CORS Issues**: Make sure your authorized JavaScript origins are correctly set.
4. **Missing Scopes**: Some providers require specific scopes to access user information.

### Provider-Specific Issues

#### Google
- Ensure you've enabled the "Google+ API" or "People API" in your Google Cloud Console.

#### GitHub
- Check that your OAuth app has the necessary permissions.

#### Twitter
- Make sure you're using OAuth 2.0 in your Twitter app settings.
- Verify that your app has the required permissions.

## Security Considerations

- Never commit your `.env` file to version control
- Use environment variables for all sensitive credentials
- Regularly rotate your client secrets
- Consider implementing additional security measures like CSRF protection 

try {
  // Your code here
} catch (error: unknown) {
  console.error('Error:', error);
  return res.status(500).json({ 
    message: 'Server error', 
    error: getErrorMessage(error)
  });
} 

// utils/errorHandling.ts
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unknown error occurred';
} 