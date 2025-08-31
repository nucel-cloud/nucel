import type { Config } from "@react-router/dev/config";
import reactRouterAwsAdapter from "@donswayo/pulumi-react-router-aws/adapter";

const adapter = reactRouterAwsAdapter({
  out: '.react-router-aws',
  polyfill: true,
  precompress: false,
});

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  
  // Build configuration
  buildDirectory: "build",
  serverBuildFile: "index.js",
  
  // Run the adapter after build completes
  async buildEnd({ buildManifest, serverBuildPath }) {
    console.log('Running AWS adapter...');
    await adapter.build({
      serverBuildFile: 'build/server/index.js',
      buildDirectory: 'build/client',
      routes: buildManifest?.routes || {},
    });
  },
} satisfies Config;
