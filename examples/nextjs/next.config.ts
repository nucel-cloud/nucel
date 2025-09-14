import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {  
  experimental: {
    // This includes files from the monorepo base two directories up
    // Optimize package imports
    optimizePackageImports: ["@repo/ui"],
  },
  
  // Optimize for serverless deployment
  compress: true,
  
  // Configure for monorepo
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;