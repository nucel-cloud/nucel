export interface ReactRouterNucelAwsAdapterOptions {
  /**
   * The directory to output the built artifacts
   * @default '.nucel-build'
   */
  out?: string;
  
  /**
   * Whether to include polyfills for Node.js globals
   * @default true
   */
  polyfill?: boolean;
  
  /**
   * Whether to precompress static assets
   * @default false
   */
  precompress?: boolean;
  
  /**
   * Environment variables to include in the Lambda function
   */
  envPrefix?: string;
}

export interface ReactRouterBuildConfig {
  serverBuildFile?: string;
  buildDirectory?: string;
  routes?: Record<string, any>;
}

export interface ReactRouterNucelAdapter {
  name: string;
  build(config: ReactRouterBuildConfig): Promise<any>;
}