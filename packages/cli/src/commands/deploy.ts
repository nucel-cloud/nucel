import { InlineProgramArgs, LocalWorkspace } from "@pulumi/pulumi/automation/index.js";
import chalk from 'chalk';
import ora from 'ora';
import { buildProject } from '../utils/build.js';
import { createNextJsProgram } from '../programs/nextjs.js';
import { createSvelteKitProgram } from '../programs/sveltekit.js';
import { createReactRouterProgram } from '../programs/react-router.js';
import { loadConfig } from '../config/loader.js';
import { initializePulumiStack, refreshStack, displayPreviewResults, displayDeploymentResults } from '../utils/deployment.js';
import { CONSTANTS } from '../config/constants.js';

export interface DeployOptions {
  stack: string;
  destroy?: boolean;
  preview?: boolean;
  verbose?: boolean;
  debug?: boolean;
  build?: boolean;
  skipBuild?: boolean;
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
    
    const pulumiStack = await LocalWorkspace.createOrSelectStack(args);
    stackSpinner.succeed('Stack initialized');

    const region = config.aws.region || process.env.AWS_REGION || CONSTANTS.DEFAULT_AWS_REGION;
    await initializePulumiStack(pulumiStack, region);
    await refreshStack(pulumiStack);

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
      const deploySpinner = verbose || debug ? null : ora('Deploying to AWS...').start();
      if (verbose || debug) {
        console.log(chalk.cyan('\nDeploying to AWS...\n'));
      }
      const upRes = await pulumiStack.up({ 
        onOutput: (msg: string) => {
          if (verbose || debug) {
            console.log(chalk.gray(msg));
          }
        }
      });
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