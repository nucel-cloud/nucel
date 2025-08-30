import type { Config } from "@react-router/dev/config";
import reactRouterAwsAdapter from "@donswayo/pulumi-react-router-aws/adapter";

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  
  // Build configuration
  buildDirectory: "build",
  serverBuildFile: "index.js",
  
  // Use our AWS adapter for deployment
  adapter: reactRouterAwsAdapter({
    out: '.react-router-aws',
    polyfill: true,
    precompress: false,
  }),
} satisfies Config;
