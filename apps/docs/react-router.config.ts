import type { Config } from '@react-router/dev/config';
import { glob } from 'node:fs/promises';
import { createGetUrl, getSlugs } from 'fumadocs-core/source';
import reactRouterAwsAdapter from '@donswayo/pulumi-react-router-aws/adapter';

const getUrl = createGetUrl('/docs');


const adapter = reactRouterAwsAdapter({
  out: '.react-router-aws',
  polyfill: true,
  precompress: false,
});


export default {
  ssr: true,
  async prerender({ getStaticPaths }) {
    const paths: string[] = [];
    for (const path of getStaticPaths()) {
      // ignore dynamic document search
      if (path === '/api/search') continue;
      paths.push(path);
    }

    for await (const entry of glob('**/*.mdx', { cwd: 'content/docs' })) {
      paths.push(getUrl(getSlugs(entry)));
    }

    return paths;
  },
  async buildEnd({ buildManifest }) {
    console.log('Running Nucel adapter...');
    await adapter.build({
      serverBuildFile: 'build/server/index.js',
      buildDirectory: 'build/client',
      routes: buildManifest?.routes || {},
    });
  },
} satisfies Config;
