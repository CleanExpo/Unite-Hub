const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

class DeploymentPreparator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.fixes = [];
  }

  async prepare() {
    console.log('🚀 Starting deployment preparation...\n');

    try {
      // Step 1: Fix TypeScript and ESLint issues
      console.log('🔧 Step 1: Fixing TypeScript and ESLint issues...');
      execSync('npx eslint . --ext .js,.jsx,.ts,.tsx --fix', { stdio: 'inherit' });
      execSync('npx tsc --noEmit', { stdio: 'inherit' });

      // Step 2: Clean and install dependencies
      console.log('🔧 Step 2: Cleaning and installing dependencies...');
      execSync('rm -rf .next node_modules', { stdio: 'inherit' });
      execSync('npm install', { stdio: 'inherit' });

      // Step 3: Run type checking
      console.log('🔧 Step 3: Running type checking...');
      execSync('npm run type-check', { stdio: 'inherit' });

      // Step 4: Run linting
      console.log('🔧 Step 4: Running linting...');
      execSync('npm run lint', { stdio: 'inherit' });

      // Step 5: Build the application
      console.log('🔧 Step 5: Building the application...');
      execSync('npm run build', { stdio: 'inherit' });

      console.log('\n✅ Deployment preparation completed successfully!');
    } catch (error) {
      console.error('\n❌ Deployment preparation failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the preparator if this file is executed directly
if (require.main === module) {
  const preparator = new DeploymentPreparator(process.cwd());
  preparator.prepare().catch(error => {
    console.error('Deployment preparation failed:', error);
    process.exit(1);
  });
}

module.exports = { DeploymentPreparator }; 