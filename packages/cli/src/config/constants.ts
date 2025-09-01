export const CONSTANTS = {
  PULUMI_CONFIG_PASSPHRASE: 'nucel-local-passphrase',
  AWS_PULUMI_PLUGIN_VERSION: 'v7.0.0',
  
  DEFAULT_AWS_REGION: 'us-east-1',
  
  FRAMEWORK_OUTPUT_DIRECTORIES: {
    nextjs: '.open-next',
    sveltekit: '.svelte-kit-aws', 
    'react-router': '.nucel-build', // Nucel adapter output directory
  } as const,
  
  DEFAULT_BUILD_COMMAND: 'npm run build',
  
  ENV_FILES: [
    '.env.local',
    '.env.test', 
    '.env.production',
    '.env',
  ] as const,

  SYSTEM_ENV_PREFIXES: [
    'PATH', 'HOME', 'USER', 'SHELL', 'TERM', 'PWD', 'OLDPWD',
    'NODE', 'NODE_ENV', 'npm_', 'PNPM_', 'YARN_',
    'AWS_', 'LAMBDA_', '_HANDLER', '_X_AMZN_', 'PULUMI_'
  ] as const,
  
  PROJECT_TAG_PREFIX: 'nucel:',
  
  CONFIG_FILES: {
    typescript: 'nucel.config.ts',
    javascript: 'nucel.config.js',
  } as const,
} as const;
