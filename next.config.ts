import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development-only HMR origins (removed in production)
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: [
      '127.0.0.1',
      'localhost',
      '10.0.1.123',
    ],
  }),
};

export default nextConfig;
