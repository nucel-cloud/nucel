export const CONSTANTS = {
  PULUMI_CONFIG_PASSPHRASE: 'nucel-local-passphrase',
  AWS_PULUMI_PLUGIN_VERSION: 'v7.0.0',
  
  DEFAULT_AWS_REGION: 'us-east-1',
  
  FRAMEWORK_OUTPUT_DIRECTORIES: {
    nextjs: '.open-next',
    sveltekit: '.svelte-kit',
    'react-router': 'react-router',
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
    'NODE', 'NODE_ENV', 'npm_', 'PNPM_', 'YARN_'
  ] as const,
  
  PROJECT_TAG_PREFIX: 'nucel:',
  
  CONFIG_FILES: {
    typescript: 'nucel.config.ts',
    javascript: 'nucel.config.js',
  } as const,
} as const;
