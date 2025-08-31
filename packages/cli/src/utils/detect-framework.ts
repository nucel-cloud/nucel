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

  for (const [framework, config] of Object.entries(FRAMEWORK_CONFIGS)) {
    if (framework === 'unknown') continue;
    
    const frameworkKey = framework as Framework;
    
    const hasDependency = config.dependencies.some(dep => deps[dep]);
    if (!hasDependency) continue;
    
    const hasConfigFile = config.configFiles.some(configFile => 
      fs.existsSync(path.join(projectRoot, configFile))
    );
    
    if (hasConfigFile) {
      return frameworkKey;
    }
  }

  return 'unknown';
}