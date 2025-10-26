import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next which folder is the project root so it loads THIS folder's .env
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
