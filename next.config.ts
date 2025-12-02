import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
    unoptimized: true
  },
  output: 'standalone',
  poweredByHeader: false,
  transpilePackages: [],
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
