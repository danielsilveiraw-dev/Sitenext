import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
  ],

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;