/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization for artwork loaded from the backend API
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
    ],
  },
};

export default nextConfig;
