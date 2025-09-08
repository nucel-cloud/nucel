import { writeFileSync, mkdirSync, existsSync, cpSync, rmSync, readFileSync, statSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build as viteBuild, type InlineConfig } from 'vite';
import type { HonoBuildConfig, HonoNucelAwsAdapterOptions } from '../types.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Core build function that prepares Hono app for AWS Lambda
 */
export async function buildHonoForAws(
  config: HonoBuildConfig,
  options: HonoNucelAwsAdapterOptions = {}
): Promise<{ serverDir: string; staticDir: string; outDir: string }> {
  const {
    out = '.nucel-build',
    precompress = false,
    envPrefix = '',
    bundle = true,
    minify = true,
    sourcemap = false,
    external = [],
    staticDir: userStaticDir,
    streaming = true,
  } = options;
  
  console.log('🚀 Building Hono app for AWS Lambda deployment...');
  
  // Create output directories
  const outDir = resolve(out);
  const serverDir = join(outDir, 'server');
  const staticDir = join(outDir, 'static');
  
  // Clean and create directories
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }
  
  mkdirSync(outDir, { recursive: true });
  mkdirSync(serverDir, { recursive: true });
  mkdirSync(staticDir, { recursive: true });
  
  // Copy static assets if provided
  if (userStaticDir && existsSync(userStaticDir)) {
    console.log('📦 Copying static assets...');
    cpSync(userStaticDir, staticDir, { recursive: true });
  }
  
  // Bundle the Hono application with Vite
  console.log('📦 Building Hono application with Vite...');
  
  // First, build the Hono app with Vite
  const viteConfig: InlineConfig = {
    configFile: false,
    mode: 'production',
    root: dirname(config.entryPoint),
    build: {
      ssr: true,
      outDir: serverDir,
      emptyOutDir: false,
      minify,
      sourcemap,
      rollupOptions: {
        input: config.entryPoint,
        output: {
          entryFileNames: 'index.js',
          format: 'es',
        },
        external: [
          'hono',
          ...external,
          /^node:/,
        ],
      },
      target: 'node22',
    },
    ssr: {
      noExternal: true,
      external: ['hono', ...external],
    },
    logLevel: 'info',
  };
  
  try {
    await viteBuild(viteConfig);
    console.log('✅ Vite build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  }
  
  // Create handler
  await createLambdaHandler(serverDir, streaming);
  
  // Setup dependencies
  await setupLambdaDependencies(serverDir, config.entryPoint);
  
  // Create deployment metadata
  const metadata = {
    adapter: '@nucel.cloud/hono-aws',
    timestamp: new Date().toISOString(),
    bundle,
    minify,
    sourcemap,
    streaming,
    envPrefix,
    entryPoint: config.entryPoint,
    staticAssets: userStaticDir ? true : false,
  };
  
  writeFileSync(
    join(outDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('✅ Build complete!');
  console.log(`📁 Output directory: ${outDir}`);
  console.log('   └── /server - Lambda function code');
  console.log('   └── /static - Static assets for S3/CloudFront');
  
  return {
    serverDir,
    staticDir,
    outDir,
  };
}

/**
 * Create the Lambda handler file
 */
async function createLambdaHandler(serverDir: string, streaming: boolean): Promise<void> {
  // Copy the handler templates from the templates directory
  const handlerTemplatePath = join(__dirname, '..', '..', 'templates', 'handler.js');
  const lambdaHandlerTemplatePath = join(__dirname, '..', '..', 'templates', 'lambda-handler.js');
  
  const handlerPath = join(serverDir, 'handler.js');
  const lambdaHandlerPath = join(serverDir, 'lambda-handler.js');
  
  // Copy lambda-handler.js (our custom Lambda adapter)
  if (existsSync(lambdaHandlerTemplatePath)) {
    copyFileSync(lambdaHandlerTemplatePath, lambdaHandlerPath);
  } else {
    throw new Error('Lambda handler template not found');
  }
  
  // Copy main handler.js
  if (existsSync(handlerTemplatePath)) {
    let handlerContent = readFileSync(handlerTemplatePath, 'utf-8');
    
    // Set streaming environment variable if needed
    if (streaming) {
      handlerContent = `process.env.HONO_STREAMING = 'true';\n${handlerContent}`;
    }
    
    writeFileSync(handlerPath, handlerContent);
  } else {
    throw new Error('Handler template not found');
  }
}

/**
 * Setup Lambda runtime dependencies
 */
async function setupLambdaDependencies(serverDir: string, entryPoint: string): Promise<void> {
  // Read the app's package.json to get the actual dependencies
  const appPackageJsonPath = resolve('package.json');
  let appDependencies: Record<string, string> = {};
  
  if (existsSync(appPackageJsonPath)) {
    const appPackageJson = JSON.parse(readFileSync(appPackageJsonPath, 'utf-8'));
    // Copy only necessary runtime dependencies
    const runtimeDeps = ['hono'];
    appDependencies = Object.fromEntries(
      Object.entries(appPackageJson.dependencies || {})
        .filter(([key]) => runtimeDeps.includes(key) || key.startsWith('@aws-sdk/'))
        .map(([key, value]) => [key, String(value)])
    );
  }
  
  // Create package.json for Lambda with minimal runtime dependencies
  const lambdaPackageJson = {
    type: 'module',
    dependencies: {
      'hono': '^4.7.0',
      ...appDependencies,
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
}

/**
 * Utility to get all files in a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);
  
  files.forEach((file) => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}