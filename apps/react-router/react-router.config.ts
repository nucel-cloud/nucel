import type { Config } from "@react-router/dev/config";
import reactRouterAwsAdapter from "@donswayo/pulumi-react-router-aws/adapter";

const adapter = reactRouterAwsAdapter({
  out: '.react-router-aws',
  polyfill: true,
  precompress: false,
});

export default {
  ssr: true,
  // Build configuration
  buildDirectory: "build",
  serverBuildFile: "index.js",
  
  async buildEnd({ buildManifest }) {
    console.log('Running Nucel adapter...');
    await adapter.build({
      serverBuildFile: 'build/server/index.js',
      buildDirectory: 'build/client',
      routes: buildManifest?.routes || {},
    });
  },
} satisfies Config;
