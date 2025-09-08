import * as fs from 'fs';
import * as path from 'path';
import { Framework, FRAMEWORK_CONFIGS } from '../config/framework-configs.js';

export async function detectFramework(): Promise<Framework> {
  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('No package.json found in current directory');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Check each framework
  for (const [framework, config] of Object.entries(FRAMEWORK_CONFIGS)) {
    if (framework === 'unknown') continue;
    
    const frameworkKey = framework as Framework;
    
    const hasDependency = config.dependencies.some(dep => deps[dep]);
    if (!hasDependency) continue;
    
    // For frameworks with config files, check if they exist
    if (config.configFiles && config.configFiles.length > 0) {
      const hasConfigFile = config.configFiles.some(configFile => 
        fs.existsSync(path.join(projectRoot, configFile))
      );
      
      if (hasConfigFile) {
        return frameworkKey;
      }
    } else {
      // For frameworks without config files (like Hono), just having the dependency is enough
      return frameworkKey;
    }
  }

  return 'unknown';
}