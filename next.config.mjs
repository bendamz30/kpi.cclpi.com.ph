/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // required for export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kpiapi.cclpi.com.ph',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // 👇 IMPORTANT for cPanel (static hosting)
  output: 'export',
};

export default nextConfig;
