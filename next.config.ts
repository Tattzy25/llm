import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Expose API key to client and server
const exposedConfig = {
  ...nextConfig,
  env: {
    GOOGLE_FONTS_API_KEY: process.env.GOOGLE_FONTS_API_KEY,
  },
};

export default exposedConfig;
