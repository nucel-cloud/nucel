import chalk from 'chalk';
import cliProgress from 'cli-progress';
import Table from 'cli-table3';
import ora from 'ora';

export class DeploymentProgressTracker {
  private multibar: cliProgress.MultiBar | null = null;
  private mainBar: cliProgress.SingleBar | null = null;
  private resourceBar: cliProgress.SingleBar | null = null;
  private fileBar: cliProgress.SingleBar | null = null;
  private simpleSpinner: any = null;
  
  private verbose: boolean;
  private startTime: number;
  private useSimpleMode = false;
  
  // Tracking counters
  private totalOperations = 0;
  private completedOperations = 0;
  private resourceCount = 0;
  private fileCount = 0;
  private totalFiles = 0;
  
  // Resource tracking for summary
  private createdResources: string[] = [];
  private updatedResources: string[] = [];
  private deletedResources: string[] = [];

  constructor(verbose = false) {
    this.verbose = verbose;
    this.startTime = Date.now();
    
    if (!verbose) {
      // Start with a simple spinner - we'll switch to progress bars if needed
      this.simpleSpinner = ora('Checking resources...').start();
      this.useSimpleMode = true;
    }
  }
  
  private switchToProgressBars(): void {
    if (this.useSimpleMode && !this.verbose) {
      // Stop spinner and switch to progress bars
      if (this.simpleSpinner) {
        this.simpleSpinner.stop();
        this.simpleSpinner = null;
      }
      
      // Create multi-bar container for parallel progress tracking
      this.multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: ' {task} [{bar}] {percentage}% | {value}/{total} | {status}'
      }, cliProgress.Presets.rect);
      
      // Create individual progress bars with initial state
      this.mainBar = this.multibar.create(1, 0, { task: 'Overall Progress', status: 'Initializing' });
      this.resourceBar = this.multibar.create(1, 0, { task: 'Resources      ', status: 'Waiting' });
      this.fileBar = this.multibar.create(1, 0, { task: 'File Uploads   ', status: 'Waiting' });
      
      this.useSimpleMode = false;
    }
  }

  // Called when Pulumi outputs text (suppress unless verbose)
  onPulumiOutput(message: string): void {
    if (this.verbose) {
      // In verbose mode, show everything
      console.log(chalk.gray(message));
    }
    // Otherwise suppress all output
  }

  // Called for each Pulumi event
  onPulumiEvent(event: any): void {
    if (!event) return;
    
    const eventType = event.type || '';
    const metadata = event.metadata || {};
    
    // Debug: Log event types to understand what Pulumi sends
    if (this.verbose && eventType) {
      console.log(chalk.gray(`Event: ${eventType}`));
    }
    
    // Handle different event types
    if (eventType === 'prelude') {
      // Deployment starting
      const steps = event.config?.steps || 10;
      if (this.mainBar) {
        this.mainBar.setTotal(steps);
        this.mainBar.update(0, { status: 'Analyzing resources' });
      }
    } else if (eventType === 'summary') {
      // Deployment complete
      this.finalizeBars();
    } else if (eventType.startsWith('resource-')) {
      this.handleResourceEvent(eventType, metadata);
    } else if (eventType === 'diagnostic') {
      // Progress update
      if (event.message && this.mainBar) {
        const message = event.message.trim();
        if (message.includes('Performing')) {
          this.mainBar.increment(1, { status: 'Processing resources' });
        }
      }
    }
  }
  
  private handleResourceEvent(eventType: string, metadata: any): void {
    const resourceType = this.extractResourceType(metadata.type);
    const resourceName = metadata.name || 'unknown';
    
    // If we detect actual changes, switch from spinner to progress bars
    if (this.useSimpleMode && (eventType.includes('create') || eventType.includes('update') || eventType.includes('delete'))) {
      this.switchToProgressBars();
    }
    
    // Update spinner if in simple mode
    if (this.useSimpleMode && this.simpleSpinner) {
      if (eventType === 'resource-pre-create') {
        this.simpleSpinner.text = `Creating ${resourceType}...`;
      } else if (eventType === 'resource-pre-update') {
        this.simpleSpinner.text = `Updating ${resourceType}...`;
      } else if (eventType === 'resource-pre-delete') {
        this.simpleSpinner.text = `Deleting ${resourceType}...`;
      }
      return;
    }
    
    // Track based on detailed event type (for progress bars)
    if (eventType === 'resource-pre-create') {
      this.handleResourceCreate(resourceType, resourceName);
      this.createdResources.push(resourceType);
    } else if (eventType === 'resource-pre-update') {
      this.handleResourceUpdate(resourceType, resourceName);
      this.updatedResources.push(resourceType);
    } else if (eventType === 'resource-pre-delete') {
      this.handleResourceDelete(resourceType, resourceName);
      this.deletedResources.push(resourceType);
    } else if (eventType === 'resource-outputs') {
      // Resource completed
      this.completedOperations++;
      this.updateMainProgress();
    }
  }
  
  private finalizeBars(): void {
    // Set all bars to complete
    if (this.mainBar) {
      const total = this.mainBar.getTotal();
      this.mainBar.update(total, { status: 'Complete' });
    }
    if (this.resourceBar) {
      const total = this.resourceBar.getTotal();
      if (this.resourceCount > 0) {
        this.resourceBar.update(total, { status: 'Complete' });
      }
    }
    if (this.fileBar) {
      const total = this.fileBar.getTotal();
      if (this.fileCount > 0) {
        this.fileBar.update(total, { status: 'Complete' });
      }
    }
  }

  private handleResourceCreate(type: string, name: string): void {
    if (this.isFileUpload(type)) {
      this.fileCount++;
      if (this.fileBar) {
        if (this.totalFiles === 0) {
          // Estimate total files based on first few uploads
          this.totalFiles = Math.max(this.fileCount * 2, 10);
          this.fileBar.setTotal(this.totalFiles);
        }
        this.fileBar.update(this.fileCount, { status: `Uploading ${this.getSimpleName(name)}` });
      }
    } else {
      this.resourceCount++;
      if (this.resourceBar) {
        const totalResources = Math.max(this.resourceCount * 1.5, 10);
        this.resourceBar.setTotal(totalResources);
        this.resourceBar.update(this.resourceCount, { status: this.getResourceStatus(type) });
      }
    }
    
    if (this.verbose) {
      console.log(chalk.green('+'), `Creating ${type}:`, chalk.cyan(name));
    }
  }

  private handleResourceUpdate(type: string, name: string): void {
    if (this.verbose) {
      console.log(chalk.yellow('~'), `Updating ${type}:`, chalk.cyan(name));
    }
  }

  private handleResourceDelete(type: string, name: string): void {
    if (this.verbose) {
      console.log(chalk.red('-'), `Deleting ${type}:`, chalk.cyan(name));
    }
  }

  private updateMainProgress(): void {
    if (this.mainBar && this.totalOperations > 0) {
      const percentage = Math.round((this.completedOperations / this.totalOperations) * 100);
      const status = this.getMainStatus(percentage);
      this.mainBar.update(this.completedOperations, { status });
    }
  }

  private getMainStatus(percentage: number): string {
    if (percentage < 20) return 'Setting up infrastructure';
    if (percentage < 40) return 'Deploying functions';
    if (percentage < 60) return 'Uploading assets';
    if (percentage < 80) return 'Configuring distribution';
    if (percentage < 95) return 'Finalizing deployment';
    return 'Almost done';
  }

  private extractResourceType(fullType: string): string {
    if (!fullType) return 'resource';
    
    // Extract last part of resource type (e.g., aws:lambda:Function -> function)
    const parts = fullType.split(':');
    const resourceName = parts[parts.length - 1] || 'resource';
    
    // Convert to user-friendly name
    return resourceName.toLowerCase()
      .replace('bucket', 'storage')
      .replace('function', 'function')
      .replace('distribution', 'CDN')
      .replace('role', 'permissions')
      .replace('policy', 'security')
      .replace('object', 'file');
  }

  private isFileUpload(type: string): boolean {
    return type.includes('file') || type.includes('object') || type.includes('asset');
  }

  private getSimpleName(fullName: string): string {
    // Extract filename from full resource name
    const parts = fullName.split(/[-_/]/);
    return parts[parts.length - 1] || fullName;
  }

  private getResourceStatus(type: string): string {
    if (type.includes('function')) return 'Deploying functions';
    if (type.includes('storage')) return 'Creating storage';
    if (type.includes('cdn')) return 'Setting up CDN';
    if (type.includes('permission')) return 'Configuring access';
    if (type.includes('security')) return 'Setting up security';
    return 'Creating resources';
  }

  // Update file total when we know the actual count
  setFileTotal(total: number): void {
    this.totalFiles = total;
    if (this.fileBar) {
      this.fileBar.setTotal(total);
    }
  }

  // Complete the progress tracking
  complete(success = true, operation: 'deploy' | 'destroy' = 'deploy'): void {
    const duration = this.getElapsedTime();
    
    if (this.simpleSpinner) {
      // Simple mode - just stop the spinner with a message
      if (success) {
        if (operation === 'destroy') {
          this.simpleSpinner.succeed(`Resources checked and cleaned up (${duration})`);
        } else {
          this.simpleSpinner.succeed(`Deployment verified (${duration})`);
        }
      } else {
        if (operation === 'destroy') {
          this.simpleSpinner.fail(`Destroy failed (${duration})`);
        } else {
          this.simpleSpinner.fail(`Deployment failed (${duration})`);
        }
      }
    } else if (this.multibar) {
      // Progress bar mode
      // Update all bars to 100%
      if (this.mainBar) this.mainBar.update(this.mainBar.getTotal());
      if (this.resourceBar) this.resourceBar.update(this.resourceBar.getTotal());
      if (this.fileBar && this.fileCount > 0) this.fileBar.update(this.fileBar.getTotal());
      
      // Stop the multi-bar
      this.multibar.stop();
      
      // Show completion message
      if (success) {
        if (operation === 'destroy') {
          console.log(chalk.green(`\n✓ Resources destroyed in ${duration}`));
        } else {
          console.log(chalk.green(`\n✓ Deployment completed in ${duration}`));
        }
      } else {
        if (operation === 'destroy') {
          console.log(chalk.red(`\n✗ Destroy failed after ${duration}`));
        } else {
          console.log(chalk.red(`\n✗ Deployment failed after ${duration}`));
        }
      }
    }
  }

  // Display deployment summary
  displaySummary(outputs: Record<string, any>): void {
    // Create summary table
    const table = new Table({
      head: ['Resource Type', 'Count', 'Status'],
      style: {
        head: ['cyan'],
        border: ['gray']
      }
    });
    
    // Count resource types
    const resourceCounts = new Map<string, number>();
    this.createdResources.forEach(r => {
      resourceCounts.set(r, (resourceCounts.get(r) || 0) + 1);
    });
    
    // Add rows to table
    resourceCounts.forEach((count, type) => {
      table.push([type, count.toString(), chalk.green('Created')]);
    });
    
    if (this.fileCount > 0) {
      table.push(['Files', this.fileCount.toString(), chalk.green('Uploaded')]);
    }
    
    // Only show table if we have data
    if (resourceCounts.size > 0 || this.fileCount > 0) {
      console.log('\n' + table.toString());
    }
    
    // Extract actual values from Pulumi outputs
    const getValue = (output: any): string => {
      if (typeof output === 'string') return output;
      if (output && typeof output === 'object' && 'value' in output) return output.value;
      if (output && typeof output === 'object') return JSON.stringify(output);
      return String(output);
    };
    
    // Display outputs
    if (outputs.url) {
      const url = getValue(outputs.url);
      console.log(chalk.bold('\nDeployment URL:'), chalk.cyan(url));
    }
    
    if (outputs.distributionId) {
      const distId = getValue(outputs.distributionId);
      console.log(chalk.gray('Distribution ID:'), distId);
    }
    
    if (outputs.bucketName) {
      const bucket = getValue(outputs.bucketName);
      console.log(chalk.gray('Storage Bucket:'), bucket);
    }
  }

  private getElapsedTime(): string {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  // For verbose mode logging
  log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }
}