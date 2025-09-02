import { writeFileSync, mkdirSync, existsSync, cpSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

interface ReactRouterNucelAdapter {
  name: string;
  build(config: any): Promise<any>;
}

export default function reactRouterNucelAwsAdapter(options: ReactRouterNucelAwsAdapterOptions = {}): ReactRouterNucelAdapter {
  const {
    out = '.nucel-build',
    polyfill = true,
    precompress = false,
    envPrefix = '',
  } = options;

  return {
    name: '@donswayo/nucel-react-router-aws',
    
    async build(config: any) {
      const serverBuildPath = config.serverBuildFile || 'build/server';
      const clientBuildPath = config.buildDirectory || 'build/client';
      
      console.log('🚀 Building React Router app for AWS Lambda deployment...');
      
      // Create output directories
      const outDir = resolve(out);
      const serverDir = join(outDir, 'server');
      const clientDir = join(outDir, 'client');
      
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      if (!existsSync(serverDir)) {
        mkdirSync(serverDir, { recursive: true });
      }
      if (!existsSync(clientDir)) {
        mkdirSync(clientDir, { recursive: true });
      }
      
      // Copy client build
      console.log('📦 Copying client assets...');
      cpSync(clientBuildPath, clientDir, { recursive: true });
      
      // Copy server build
      console.log('🔧 Preparing server bundle...');
      
      // Check if serverBuildPath is a file or directory
      if (existsSync(serverBuildPath)) {
        const stats = statSync(serverBuildPath);
        if (stats.isFile()) {
          // Copy single file as index.js
          cpSync(serverBuildPath, join(serverDir, 'index.js'));
          
          // Also copy assets from the same directory if they exist
          const serverBuildDir = dirname(serverBuildPath);
          const assetsPath = join(serverBuildDir, 'assets');
          if (existsSync(assetsPath)) {
            console.log('📦 Copying server assets...');
            cpSync(assetsPath, join(serverDir, 'assets'), { recursive: true });
          }
        } else {
          // Copy entire directory contents
          cpSync(serverBuildPath, serverDir, { recursive: true });
        }
      }
      
      // Copy handler template
      const handlerTemplatePath = join(__dirname, '../../templates/handler.js');
      const handlerPath = join(serverDir, 'handler.js');
      
      let handlerContent = readFileSync(handlerTemplatePath, 'utf-8');
      
      // Update handler to use the correct build import
      handlerContent = handlerContent.replace(
        "import * as build from './index.js';",
        "import * as build from './index.js';"
      );
      
      writeFileSync(handlerPath, handlerContent);
      
      // Read the app's package.json to get the actual dependencies
      const appPackageJsonPath = resolve('package.json');
      let appDependencies: Record<string, string> = {};
      
      if (existsSync(appPackageJsonPath)) {
        const appPackageJson = JSON.parse(readFileSync(appPackageJsonPath, 'utf-8'));
        // Copy all production dependencies from the app
        appDependencies = appPackageJson.dependencies || {};
      }
      
      // Create package.json for Lambda with the app's runtime dependencies
      const lambdaPackageJson = {
        type: 'module',
        dependencies: {
          ...appDependencies,
          // Ensure React Router architect is included for the handler
          '@react-router/architect': appDependencies['@react-router/architect'] || '^7.0.0',
        }
      };
      
      writeFileSync(
        join(serverDir, 'package.json'),
        JSON.stringify(lambdaPackageJson, null, 2)
      );
      
      // Install production dependencies for Lambda runtime
      console.log('📦 Installing Lambda runtime dependencies...');
      try {
        execSync('npm install --production --no-fund --no-audit', {
          cwd: serverDir,
          stdio: 'inherit'
        });
        console.log('✅ Lambda dependencies installed successfully');
      } catch (error) {
        console.error('❌ Failed to install dependencies:', error instanceof Error ? error.message : String(error));
        throw new Error('Dependency installation failed - this is required for Lambda runtime');
      }
      
      // Create deployment metadata
      const metadata = {
        adapter: '@donswayo/pulumi-react-router-aws',
        timestamp: new Date().toISOString(),
        polyfill,
        precompress,
        envPrefix,
        routes: config.routes ? Object.keys(config.routes).length : 0,
      };
      
      writeFileSync(
        join(outDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log('✅ Build complete!');
      console.log(`📁 Output directory: ${outDir}`);
      console.log('   └── /server - Lambda function code');
      console.log('   └── /client - Static assets for S3/CloudFront');
      
      return {
        serverDir,
        clientDir,
        outDir,
      };
    }
  };
}