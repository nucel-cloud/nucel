import { buildReactRouterForAws } from './build.js';
import type { 
  ReactRouterNucelAwsAdapterOptions, 
  ReactRouterBuildConfig,
  ReactRouterNucelAdapter 
} from './types.js';

// Re-export types and build function for direct usage
export { buildReactRouterForAws } from './build.js';
export type { 
  ReactRouterNucelAwsAdapterOptions, 
  ReactRouterBuildConfig,
  ReactRouterNucelAdapter 
} from './types.js';

/**
 * React Router adapter for use in react-router.config.ts
 */
export default function reactRouterNucelAwsAdapter(options: ReactRouterNucelAwsAdapterOptions = {}): ReactRouterNucelAdapter {
  return {
    name: '@nucel.cloud/react-router-aws',
    
    async build(config: ReactRouterBuildConfig) {
      return buildReactRouterForAws(config, options);
    }
  };
}