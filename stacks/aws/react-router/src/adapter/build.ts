import {
  writeFileSync,
  mkdirSync,
  existsSync,
  cpSync,
  readFileSync,
  statSync,
  copyFileSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import type {
  ReactRouterNucelAwsAdapterOptions,
  ReactRouterBuildConfig,
} from "./types.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Core build function that prepares React Router app for AWS Lambda
 */
export async function buildReactRouterForAws(
  config: ReactRouterBuildConfig,
  options: ReactRouterNucelAwsAdapterOptions = {},
): Promise<{ serverDir: string; clientDir: string; outDir: string }> {
  const {
    out = ".nucel-build",
    polyfill = true,
    precompress = false,
    envPrefix = "",
  } = options;

  const serverBuildPath = config.serverBuildFile || "build/server";
  const clientBuildPath = config.buildDirectory || "build/client";

  console.log("🚀 Building React Router app for AWS Lambda deployment...");

  // Create output directories
  const outDir = resolve(out);
  const serverDir = join(outDir, "server");
  const clientDir = join(outDir, "client");

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
  console.log("📦 Copying client assets...");
  cpSync(clientBuildPath, clientDir, { recursive: true });

  // Copy server build
  console.log("🔧 Preparing server bundle...");

  // Check if serverBuildPath is a file or directory
  if (existsSync(serverBuildPath)) {
    const stats = statSync(serverBuildPath);
    if (stats.isFile()) {
      // Copy single file as index.js
      cpSync(serverBuildPath, join(serverDir, "index.js"));

      // Also copy assets from the same directory if they exist
      const serverBuildDir = dirname(serverBuildPath);
      const assetsPath = join(serverBuildDir, "assets");
      if (existsSync(assetsPath)) {
        console.log("📦 Copying server assets...");
        cpSync(assetsPath, join(serverDir, "assets"), { recursive: true });
      }
    } else {
      // Copy entire directory contents
      cpSync(serverBuildPath, serverDir, { recursive: true });
    }
  }

  // Create handler
  await createLambdaHandler(serverDir);

  // Bundle the Lambda function with all dependencies
  await bundleLambdaFunction(serverDir);

  // Create deployment metadata
  const metadata = {
    adapter: "@nucel.cloud/react-router-aws",
    timestamp: new Date().toISOString(),
    polyfill,
    precompress,
    envPrefix,
    routes: config.routes ? Object.keys(config.routes).length : 0,
  };

  writeFileSync(
    join(outDir, "metadata.json"),
    JSON.stringify(metadata, null, 2),
  );

  console.log("✅ Build complete!");
  console.log(`📁 Output directory: ${outDir}`);
  console.log("   └── /server - Lambda function code");
  console.log("   └── /client - Static assets for S3/CloudFront");

  return {
    serverDir,
    clientDir,
    outDir,
  };
}

/**
 * Create the Lambda handler file
 */
async function createLambdaHandler(serverDir: string): Promise<void> {
  // Copy the handler template from the templates directory
  const templatePath = join(__dirname, "..", "..", "templates", "handler.js");
  const handlerPath = join(serverDir, "handler.js");

  // Check if template exists, otherwise use inline version
  if (existsSync(templatePath)) {
    copyFileSync(templatePath, handlerPath);
  } else {
    // Fallback to inline handler for compatibility
    const handlerContent = `
import { createRequestHandler } from '@react-router/architect';
import * as build from './index.js';

const reactRouterHandler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV || 'production',
});

export const handler = async (event, context) => {
  try {
    const response = await reactRouterHandler(event, context);
    return response;
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
`;
    writeFileSync(handlerPath, handlerContent.trim());
  }
}

/**
 * Bundle Lambda function with all dependencies using esbuild
 */
async function bundleLambdaFunction(serverDir: string): Promise<void> {
  console.log("📦 Bundling Lambda function with esbuild...");

  const entryPoint = join(serverDir, "handler.js");
  const outputFile = join(serverDir, "lambda.js");

  try {
    // Bundle the server code with all dependencies
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: "node",
      target: "node20",
      format: "esm",
      outfile: outputFile,
      minify: true,
      sourcemap: "external",
      metafile: true,
      // Externalize AWS SDK (provided by Lambda runtime)
      external: ["@aws-sdk/*", "aws-sdk"],
      banner: {
        js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
      },
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });

    // Write metafile for debugging
    writeFileSync(
      join(serverDir, "lambda.meta.json"),
      JSON.stringify(result.metafile, null, 2),
    );

    // Create a minimal package.json for Lambda
    const lambdaPackageJson = {
      type: "module",
      main: "lambda.js",
    };

    writeFileSync(
      join(serverDir, "package.json"),
      JSON.stringify(lambdaPackageJson, null, 2),
    );

    console.log("✅ Lambda function bundled successfully");

    // Log bundle size
    const stats = statSync(outputFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📦 Bundle size: ${sizeMB} MB`);
  } catch (error) {
    console.error("❌ Failed to bundle Lambda function:", error);
    throw new Error("Failed to bundle Lambda function with esbuild");
  }
}
