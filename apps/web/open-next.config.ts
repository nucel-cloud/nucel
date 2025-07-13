import type { OpenNextConfig } from "@opennextjs/aws/types/open-next.js";

const config = {
  default: {
    override: {
      // Use lightweight versions for better cold start performance
      tagCache: "dynamodb-lite",
      incrementalCache: "s3-lite",
      queue: "sqs-lite",
      // Enable streaming for better TTFB
      wrapper: "aws-lambda-streaming",
    },
    // Minify for smaller bundle size
    minify: true,
  },
  // Configure image optimization with proper caching
  imageOptimization: {
    loader: "s3-lite",
    install: {
      packages: ["sharp@0.34.2"],
      arch: "arm64", // Match server architecture
      nodeVersion: "22",
      libc: "glibc",
    },
  },
  // Enable cache interception for maximum performance
  dangerous: {
    enableCacheInterception: true,
  },
} satisfies OpenNextConfig;

export default config;
