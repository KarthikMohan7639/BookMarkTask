import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev tools (HMR) to connect when the app is opened via
  // 127.0.0.1 or the network address used by the dev container.
  // Add any additional origins you open the app from in development.
  // Next expects hostnames/origins without protocol/port for allowedDevOrigins
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '10.0.1.123',
  ],
};

export default nextConfig;
