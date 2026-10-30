import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.FINAPP_E2E_DIST_DIR ? { distDir: process.env.FINAPP_E2E_DIST_DIR } : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
