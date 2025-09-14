import type { Config } from "@react-router/dev/config";
import reactRouterNucelAwsAdapter from "@nucel.cloud/react-router-aws/adapter";

const adapter = reactRouterNucelAwsAdapter({
  out: '.nucel-build',
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
