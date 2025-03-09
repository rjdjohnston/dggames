# DG Games

<div align="center">
  <img src="public/logo.png" alt="DG Games Logo" width="200" height="auto" style="margin-bottom: 20px"/>
  <p><em>A modern platform for hosting, discovering, and playing web games</em></p>
</div>

## 📋 Overview

DG Games is a full-stack web application that allows developers to upload and share their web games while providing players with a platform to discover and enjoy them. Built with Next.js, MongoDB, and NextAuth.js, it offers a seamless experience for both game creators and players.

### ✨ Key Features

- **Game Hosting & Management**: Upload, update, and manage your web games
- **Game Discovery**: Browse, search, and filter games by category, popularity, and more
- **User Authentication**: Secure login via email/password or OAuth providers (Google, GitHub, Twitter)
- **User Profiles**: Personalized profiles showcasing user information and game collections
- **Responsive Design**: Optimized experience across desktop and mobile devices
- **Game Player**: Integrated player for various game types (HTML5, JavaScript, Unity, etc.)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- MongoDB (local installation or remote connection)
- Docker and Docker Compose (optional, for containerized setup)

### Installation

#### Standard Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dggames.git
   cd dggames
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create environment variables**
   Create a `.env.local` file in the root directory:
   ```
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secure-secret-key
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/dggames
   MONGODB_DB=dggames
   
   # OAuth Providers (optional)
   # GOOGLE_CLIENT_ID=your-google-client-id
   # GOOGLE_CLIENT_SECRET=your-google-client-secret
   # GITHUB_CLIENT_ID=your-github-client-id
   # GITHUB_CLIENT_SECRET=your-github-client-secret
   # TWITTER_CLIENT_ID=your-twitter-client-id
   # TWITTER_CLIENT_SECRET=your-twitter-client-secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

#### Docker Setup

For a containerized setup, see our [Docker Setup Guide](README.docker.md).

## 🔐 Authentication

DG Games supports two authentication methods:

### Email/Password Authentication

Users can register and login with their email and password. Passwords are securely hashed using bcrypt.

### OAuth Providers

The application supports authentication via:
- Google
- GitHub
- Twitter (X)

For detailed OAuth setup instructions, see our [OAuth Setup Guide](README.oauth.md).

### Generating a Secure Secret

For production environments, generate a strong random secret for NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

This creates a cryptographically secure random string that's ideal for JWT encryption.

## 🏗️ Project Structure

```
dggames/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── api/          # API endpoints
│   │   ├── auth/         # Authentication pages
│   │   └── ...           # Application pages
│   ├── styles/           # CSS and styling
│   └── utils/            # Helper functions
├── .env                  # Environment variables (create this)
├── docker-compose.yml    # Docker Compose configuration
└── ...                   # Configuration files
```

## 🎮 Game Upload Guidelines

### Supported Game Types

- HTML5 Games
- JavaScript Games
- Unity WebGL Exports
- Phaser Games
- Text Adventures
- Pixel Games
- WebAssembly Games

### Upload Requirements

- Main game file (HTML, JS, or ZIP archive)
- Game thumbnail image
- Game title and description
- Game category

## 🧩 API Endpoints

DG Games provides a comprehensive API for interacting with the platform:

- **Authentication**: `/api/auth/*` - NextAuth.js endpoints
- **Games**: `/api/games/*` - Game CRUD operations
- **Users**: `/api/users/*` - User profile operations

## 🛠️ Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

See the [Environment Variables](#installation) section for required variables.

## 📦 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker-compose up -d
```

### Hosting Providers

DG Games can be deployed to:
- Vercel
- Netlify
- AWS
- DigitalOcean
- Any platform supporting Node.js and MongoDB

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/dggames/issues) on GitHub.

---

<div align="center">
  <p>Built with ❤️ using Next.js, MongoDB, and NextAuth.js</p>
</div> 