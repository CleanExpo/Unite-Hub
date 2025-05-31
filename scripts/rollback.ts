#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DeploymentInfo {
  uid: string;
  name: string;
  url: string;
  created: string;
  state: string;
  type: string;
}

interface RollbackResult {
  success: boolean;
  previousDeployment?: DeploymentInfo;
  error?: string;
  rollbackUrl?: string;
}

export class RollbackManager {
  private projectName: string;
  
  constructor(projectName: string = 'unite-group-fresh') {
    this.projectName = projectName;
  }
  
  async getDeployments(): Promise<DeploymentInfo[]> {
    try {
      console.log('📦 Fetching deployment history...');
      
      const { stdout } = await execAsync(`vercel ls ${this.projectName} --limit 10 --format json`);
      const deployments = JSON.parse(stdout);
      
      return deployments.map((dep: any) => ({
        uid: dep.uid,
        name: dep.name,
        url: dep.url,
        created: dep.created,
        state: dep.state,
        type: dep.type
      }));
    } catch (error) {
      throw new Error(`Failed to fetch deployments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async findPreviousStableDeployment(): Promise<DeploymentInfo | null> {
    const deployments = await this.getDeployments();
    
    // Filter for successful production deployments, excluding the current one
    const stableDeployments = deployments.filter(dep => 
      dep.state === 'READY' && 
      dep.type === 'production'
    );
    
    if (stableDeployments.length < 2) {
      console.warn('⚠️  Not enough stable deployments found for rollback');
      return null;
    }
    
    // Return the second deployment (previous stable version)
    return stableDeployments[1];
  }
  
  async performRollback(targetDeployment?: DeploymentInfo): Promise<RollbackResult> {
    console.log('🔄 Initiating rollback procedure...\n');
    
    try {
      let previousDeployment: DeploymentInfo | null;
      
      if (targetDeployment) {
        previousDeployment = targetDeployment;
        console.log(`📦 Rolling back to specified deployment: ${previousDeployment.uid}`);
      } else {
        previousDeployment = await this.findPreviousStableDeployment();
        
        if (!previousDeployment) {
          return {
            success: false,
            error: 'No previous stable deployment found for rollback'
          };
        }
        
        console.log(`📦 Rolling back to previous deployment: ${previousDeployment.uid}`);
      }
      
      console.log(`   URL: ${previousDeployment.url}`);
      console.log(`   Created: ${new Date(previousDeployment.created).toLocaleString()}`);
      console.log('');
      
      // Promote the previous deployment
      console.log('⏳ Promoting previous deployment...');
      const { stdout } = await execAsync(`vercel promote ${previousDeployment.uid} --scope=${this.projectName}`);
      
      console.log('✅ Rollback completed successfully!');
      console.log(`🌐 Active URL: ${previousDeployment.url}`);
      
      return {
        success: true,
        previousDeployment,
        rollbackUrl: previousDeployment.url
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Rollback failed:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  async verifyRollback(rollbackUrl: string): Promise<boolean> {
    console.log('\n🔍 Verifying rollback...');
    
    try {
      // Import the smoke test function
      const { runSmokeTests } = await import('./post-deploy-tests');
      const testResult = await runSmokeTests(rollbackUrl);
      
      if (testResult) {
        console.log('✅ Rollback verification passed!');
        return true;
      } else {
        console.error('❌ Rollback verification failed!');
        return false;
      }
    } catch (error) {
      console.error('❌ Rollback verification error:', error);
      return false;
    }
  }
  
  async emergencyRollback(): Promise<RollbackResult> {
    console.log('🚨 EMERGENCY ROLLBACK INITIATED\n');
    console.log('='.repeat(50));
    
    const rollbackResult = await this.performRollback();
    
    if (rollbackResult.success && rollbackResult.rollbackUrl) {
      const verificationResult = await this.verifyRollback(rollbackResult.rollbackUrl);
      
      if (!verificationResult) {
        console.warn('⚠️  Rollback completed but verification failed');
        console.warn('   Manual verification recommended');
      }
    }
    
    return rollbackResult;
  }
  
  async listAvailableRollbackTargets(): Promise<DeploymentInfo[]> {
    const deployments = await this.getDeployments();
    
    const rollbackTargets = deployments.filter(dep => 
      dep.state === 'READY' && 
      dep.type === 'production'
    );
    
    console.log('\n📋 Available Rollback Targets:');
    console.log('='.repeat(50));
    
    rollbackTargets.forEach((dep, index) => {
      const createdDate = new Date(dep.created).toLocaleString();
      const isCurrent = index === 0 ? ' (CURRENT)' : '';
      console.log(`${index + 1}. ${dep.uid}${isCurrent}`);
      console.log(`   URL: ${dep.url}`);
      console.log(`   Created: ${createdDate}`);
      console.log('');
    });
    
    return rollbackTargets;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const rollbackManager = new RollbackManager();
  
  try {
    switch (command) {
      case 'emergency':
        await rollbackManager.emergencyRollback();
        break;
        
      case 'list':
        await rollbackManager.listAvailableRollbackTargets();
        break;
        
      case 'to':
        const targetUid = args[1];
        if (!targetUid) {
          console.error('Usage: tsx scripts/rollback.ts to <deployment-uid>');
          process.exit(1);
        }
        
        const deployments = await rollbackManager.getDeployments();
        const target = deployments.find(dep => dep.uid === targetUid);
        
        if (!target) {
          console.error(`Deployment ${targetUid} not found`);
          process.exit(1);
        }
        
        const result = await rollbackManager.performRollback(target);
        if (!result.success) {
          process.exit(1);
        }
        break;
        
      case 'auto':
      default:
        const autoResult = await rollbackManager.performRollback();
        if (!autoResult.success) {
          process.exit(1);
        }
        break;
    }
  } catch (error) {
    console.error('💥 Rollback script failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}
