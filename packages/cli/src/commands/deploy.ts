import { InlineProgramArgs, LocalWorkspace } from "@pulumi/pulumi/automation/index.js";
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, mkdirSync } from 'fs';
import path, { join } from 'path';
import { buildProject } from '../utils/build.js';
import { createNextJsProgram } from '../programs/nextjs.js';
import { createSvelteKitProgram } from '../programs/sveltekit.js';
import { createReactRouterProgram } from '../programs/react-router.js';
import { loadConfig } from '../config/loader.js';
import type { ProjectConfig } from '../config/types.js';
import { initializePulumiStack, refreshStack, displayPreviewResults, displayDeploymentResults } from '../utils/deployment.js';
import { CONSTANTS } from '../config/constants.js';
import { getFrameworkConfig } from '../config/framework-configs.js';
import { ensureS3BucketExists } from '../utils/s3-backend.js';

export interface DeployOptions {
  stack: string;
  destroy?: boolean;
  preview?: boolean;
  verbose?: boolean;
  debug?: boolean;
  build?: boolean;
  skipBuild?: boolean;
  buildCommand?: string;
  backend?: 'local' | 's3' | 'auto';
}

export async function deploy(options: DeployOptions) {
  const { stack, destroy, preview, verbose, debug } = options;
  
  // Set environment variables for Pulumi debug output
  if (debug) {
    process.env.PULUMI_DEBUG_COMMANDS = '1';
    process.env.PULUMI_VERBOSE = '7';
    process.env.DEBUG = '*';
    console.log(chalk.yellow('Debug mode enabled\n'));
  } else if (verbose) {
    process.env.PULUMI_VERBOSE = '3';
    console.log(chalk.yellow('Verbose mode enabled\n'));
  }
  
  const configSpinner = ora('Loading configuration...').start();
  const config = await loadConfig();
  configSpinner.succeed(`Configuration loaded for ${config.name}`);
  
  console.log(chalk.cyan(`\nDeploying ${config.framework} application to AWS\n`));
  console.log(chalk.gray(`  Project: ${config.name}`));
  console.log(chalk.gray(`  Stack: ${stack}`));
  console.log(chalk.gray(`  Region: ${config.aws.region}`));
  if (config.domains?.length) {
    console.log(chalk.gray(`  Domains: ${config.domains.join(', ')}`));
  }
  console.log();

  if (!destroy) {
    // Check if we should build
    const shouldBuild = await shouldRunBuild(config, options);
    
    if (shouldBuild) {
      const buildSpinner = ora('Building application...').start();
      try {
        // Use internal build process for each framework
        const buildCommand = await getInternalBuildCommand(config);
        
        if (verbose || debug) {
          buildSpinner.text = `Running: ${buildCommand}`;
          console.log(chalk.gray(`\nUsing Nucel internal build process for ${config.framework}`));
        }
        
        await buildProject(buildCommand, { verbose: verbose || debug });
        buildSpinner.succeed('Build completed');
      } catch (error) {
        buildSpinner.fail('Build failed');
        if (debug && error instanceof Error) {
          console.error(chalk.red('\nBuild error details:'));
          console.error(error.stack);
        }
        throw error;
      }
    } else {
      console.log(chalk.gray('Skipping build (output directory already exists)'));
    }
  }

  let pulumiProgram;
  switch (config.framework) {
    case 'nextjs':
      pulumiProgram = createNextJsProgram(config);
      break;
    case 'sveltekit':
      pulumiProgram = createSvelteKitProgram(config);
      break;
    case 'react-router':
      pulumiProgram = createReactRouterProgram(config);
      break;
    default:
      throw new Error(`Unsupported framework: ${config.framework}`);
  }

  const projectName = config.name.replace(/[^a-zA-Z0-9-]/g, '-');
  const args: InlineProgramArgs = {
    stackName: stack,
    projectName: `nucel-${projectName}`,
    program: pulumiProgram,
  };

  const stackSpinner = ora('Initializing stack...').start();
  
  try {
    process.env.PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE || CONSTANTS.PULUMI_CONFIG_PASSPHRASE;
    
    // Determine backend based on options or environment
    const backend = options.backend || 'auto';
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    const awsRegion = config.aws.region || process.env.AWS_REGION || CONSTANTS.DEFAULT_AWS_REGION;
    
    let backendUrl: string;
    
    if (backend === 's3' || (backend === 'auto' && isCI && process.env.AWS_ACCESS_KEY_ID)) {
      // Use S3 backend
      // In CI, we can get the account ID from the AWS credentials
      // Otherwise use project name as suffix for uniqueness
      const bucketSuffix = process.env.AWS_ACCOUNT_ID || projectName.toLowerCase();
      const bucketName = `${CONSTANTS.PULUMI_STATE_BUCKET_PREFIX}-${bucketSuffix}`;
      
      // Ensure the S3 bucket exists before using it
      await ensureS3BucketExists(bucketName, awsRegion);
      
      backendUrl = `s3://${bucketName}?region=${awsRegion}`;
      
      if (verbose || debug) {
        console.log(chalk.gray(`Using S3 backend: ${backendUrl}`));
      }
    } else if (backend === 'local' || backend === 'auto') {
      // Use local backend
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const localStateDir = path.join(homeDir, '.nucel', 'pulumi');
      
      // Ensure local state directory exists
      if (!existsSync(localStateDir)) {
        mkdirSync(localStateDir, { recursive: true });
      }
      
      backendUrl = `file://${localStateDir}?no_tmp_dir=true`;
      
      if (verbose || debug) {
        console.log(chalk.gray(`Using local backend: ${backendUrl}`));
      }
    } else {
      throw new Error(`Unknown backend: ${backend}`);
    }
    
    const pulumiStack = await LocalWorkspace.createOrSelectStack({
      ...args,
      workDir: process.cwd(),
    }, { 
      projectSettings: {
        name: args.projectName,
        runtime: "nodejs",
        backend: { url: backendUrl },
      },
      envVars: {
        PULUMI_CONFIG_PASSPHRASE: process.env.PULUMI_CONFIG_PASSPHRASE,
      },
    });
    stackSpinner.succeed('Stack initialized');

    const region = config.aws.region || process.env.AWS_REGION || CONSTANTS.DEFAULT_AWS_REGION;
    await initializePulumiStack(pulumiStack, region);
    
    // Refresh stack with automatic lock handling
    try {
      await refreshStack(pulumiStack);
    } catch (error: any) {
      if (error.message?.includes('locked')) {
        console.log(chalk.yellow('\n⚠️  Stack appears to be locked from a previous operation'));
        console.log(chalk.gray('   Attempting automatic recovery...\n'));
        
        // Try to cancel and continue
        try {
          await pulumiStack.cancel();
          console.log(chalk.green('✓ Previous operation cancelled'));
          await refreshStack(pulumiStack);
        } catch (cancelError) {
          // If cancel fails, still try to continue
          console.log(chalk.yellow('   Could not cancel previous operation, continuing anyway...'));
        }
      } else {
        throw error;
      }
    }

    if (preview) {
      const previewSpinner = ora('Generating preview...').start();
      const previewRes = await pulumiStack.preview({ 
        onOutput: (msg: string) => {
          if (process.env.DEBUG) console.log(msg);
        }
      });
      previewSpinner.succeed('Preview generated');
      
      displayPreviewResults(previewRes);
      
      console.log(chalk.cyan('\n📋 Preview Results (Dry Run)\n'));
    } else if (destroy) {
      const destroySpinner = ora('Destroying infrastructure...').start();
      await pulumiStack.destroy({ 
        onOutput: (msg: string) => {
          if (process.env.DEBUG) console.log(msg);
        }
      });
      destroySpinner.succeed('Infrastructure destroyed');
      console.log(chalk.green('\n✅ Stack destroyed successfully\n'));
    } else {
      let deploySpinner = verbose || debug ? null : ora('Initializing deployment...').start();
      if (verbose || debug) {
        console.log(chalk.cyan('\nDeploying to AWS...\n'));
      }
      
      let lastResourceType = '';
      let upRes;
      
      try {
        upRes = await pulumiStack.up({ 
          onOutput: (msg: string) => {
            if (verbose || debug) {
              console.log(chalk.gray(msg));
            } else if (deploySpinner) {
              // Parse Pulumi output to show user-friendly progress
              const progressMessage = parseDeploymentProgress(msg);
              if (progressMessage && progressMessage !== lastResourceType) {
                deploySpinner.text = progressMessage;
                lastResourceType = progressMessage;
              }
            }
          },
          onEvent: (event: any) => {
            if (!verbose && !debug && deploySpinner && event.type === 'resource-pre-create') {
              const message = getResourceProgressMessage(event.metadata?.type, event.metadata?.name);
              if (message) {
                deploySpinner.text = message;
              }
            }
          }
        });
      } catch (deployError: any) {
        // Handle locked stack during deployment
        if (deployError.message?.includes('the stack is currently locked')) {
          if (deploySpinner) {
            deploySpinner.text = 'Stack is locked, attempting to recover...';
          } else {
            console.log(chalk.yellow('\n⚠️  Stack is locked, attempting to recover...'));
          }
          
          try {
            await pulumiStack.cancel();
            if (deploySpinner) {
              deploySpinner.text = 'Retrying deployment...';
            } else {
              console.log(chalk.green('✓ Lock cleared, retrying...'));
            }
            
            // Retry the deployment
            upRes = await pulumiStack.up({ 
              onOutput: (msg: string) => {
                if (verbose || debug) {
                  console.log(chalk.gray(msg));
                }
              }
            });
          } catch (retryError) {
            throw new Error('Stack is locked. Please try again in a moment.');
          }
        } else {
          throw deployError;
        }
      }
      
      if (deploySpinner) deploySpinner.succeed('Deployment completed');

      displayDeploymentResults(upRes);

      console.log(chalk.gray('\nResource Summary:'));
      console.log(chalk.gray(`  Created: ${upRes.summary.resourceChanges?.create || 0}`));
      console.log(chalk.gray(`  Updated: ${upRes.summary.resourceChanges?.update || 0}`));
      console.log(chalk.gray(`  Deleted: ${upRes.summary.resourceChanges?.delete || 0}`));
    }
  } catch (error) {
    stackSpinner.fail('Deployment failed');
    throw error;
  }
}

async function shouldRunBuild(config: ProjectConfig, options: DeployOptions): Promise<boolean> {
  // If user explicitly wants to skip build
  if (options.skipBuild) {
    return false;
  }
  
  // If user explicitly wants to build
  if (options.build) {
    return true;
  }
  
  // Auto-detect: Check if output directory already exists
  const frameworkConfig = getFrameworkConfig(config.framework);
  const outputDir = join(process.cwd(), frameworkConfig.outputDirectory);
  
  // If output directory exists, assume it's already built
  if (existsSync(outputDir)) {
    if (options.verbose || options.debug) {
      console.log(chalk.gray(`Found existing build output at ${outputDir}`));
    }
    return false;
  }
  
  // Default: build is needed
  return true;
}

async function getInternalBuildCommand(config: ProjectConfig): Promise<string> {
  // If user provided a custom build command, use it
  if (config.buildCommand && config.buildCommand !== 'npm run build') {
    return config.buildCommand;
  }
  
  // Use Nucel's internal build process for each framework
  switch (config.framework) {
    case 'nextjs':
      // OpenNext handles the build internally
      return 'npx open-next@latest build';
      
    case 'sveltekit':
      // Use the Nucel SvelteKit adapter build
      return 'npm run build';
      
    case 'react-router':
      // Use the Nucel React Router adapter build
      return 'npm run build';
      
    default:
      // Fallback to standard build
      return config.buildCommand || 'npm run build';
  }
}

function parseDeploymentProgress(output: string): string | null {
  // Parse Pulumi output to show user-friendly messages
  if (output.includes('aws:s3:Bucket')) {
    return '📦 Creating storage bucket...';
  }
  if (output.includes('aws:s3:BucketObject')) {
    return '⬆️  Uploading static assets...';
  }
  if (output.includes('aws:lambda:Function')) {
    return '⚡ Creating Lambda function...';
  }
  if (output.includes('aws:lambda:FunctionUrl')) {
    return '🔗 Configuring function URL...';
  }
  if (output.includes('aws:cloudfront:Distribution')) {
    return '🌐 Setting up CloudFront CDN...';
  }
  if (output.includes('aws:cloudfront:OriginAccessIdentity')) {
    return '🔐 Configuring CDN access...';
  }
  if (output.includes('aws:iam:Role')) {
    return '👤 Setting up IAM permissions...';
  }
  if (output.includes('aws:dynamodb:Table')) {
    return '💾 Creating DynamoDB table...';
  }
  if (output.includes('aws:sqs:Queue')) {
    return '📨 Setting up message queue...';
  }
  if (output.includes('updating') || output.includes('creating')) {
    return '🔄 Updating resources...';
  }
  return null;
}

function getResourceProgressMessage(type: string, name: string): string | null {
  if (!type) return null;
  
  const typeMap: Record<string, string> = {
    'aws:s3:Bucket': '📦 Creating storage bucket',
    'aws:s3:BucketObject': '⬆️  Uploading assets',
    'aws:lambda:Function': '⚡ Deploying Lambda function',
    'aws:lambda:FunctionUrl': '🔗 Configuring function URL',
    'aws:cloudfront:Distribution': '🌐 Setting up CloudFront CDN',
    'aws:cloudfront:OriginAccessIdentity': '🔐 Setting up CDN access',
    'aws:iam:Role': '👤 Configuring IAM permissions',
    'aws:iam:RolePolicyAttachment': '📝 Attaching policies',
    'aws:dynamodb:Table': '💾 Creating database table',
    'aws:sqs:Queue': '📨 Creating message queue',
    'aws:s3:BucketPolicy': '🔒 Setting bucket permissions',
    'aws:lambda:Permission': '✅ Granting Lambda permissions',
  };
  
  return typeMap[type] || null;
}