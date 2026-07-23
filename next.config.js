/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep development and production artifacts separate so running a build
  // cannot invalidate modules used by an active development server.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'pg', 'sharp', 'google-auth-library', '@heyputer/puter.js'],
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    // Fix for XLSX library
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
