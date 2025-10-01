/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Removed output: 'export' to allow API routes to work
  // output: 'export'
};

export default nextConfig;
