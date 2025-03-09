/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['picsum.photos','grokgames.dev'],
    // Allow unoptimized images for avatar uploads
    unoptimized: true,
  },
  webpack: (config) => {
    // For handling hot reloading in Docker
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
  async headers() {
    return [
      {
        // Apply these headers to avatar images
        source: '/uploads/avatars/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 