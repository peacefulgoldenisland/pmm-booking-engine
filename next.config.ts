import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.peacefulgoldenisland.com', // Domain Cloudflare R2 kita
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Kita biarkan sementara buat jaga-jaga kalau ada data lama
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;