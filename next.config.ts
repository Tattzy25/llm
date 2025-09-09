import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove NODE_ENV from env as it's not allowed
  // Force production mode settings
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization = {
        ...config.optimization,
        minimize: true,
      }
    }
    return config
  },
  turbopack: {
    // Disable test mode detection in Turbopack
    resolveAlias: {
      // Ensure we're not in test environment
    }
  }
};

export default nextConfig;
