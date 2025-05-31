import { promises as fs } from 'fs';
import path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
  critical: boolean;
}

export class DeploymentValidator {
  async validateAll(): Promise<boolean> {
    console.log('🚀 Starting Pre-Deployment Validation...\n');
    
    const validations = [
      this.validateEnvironmentVariables(),
      this.validateRouting(),
      this.validatePlaceholderContent(),
      this.validateAPIEndpoints(),
      this.validateDatabaseConfiguration(),
      this.validateComplianceSetup()
    ];
    
    const results = await Promise.all(validations);
    const criticalFailures = results.filter(r => !r.passed && r.critical);
    
    console.log('\n📊 VALIDATION RESULTS:');
    console.log('='.repeat(50));
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const status = result.passed ? '✅' : (result.critical ? '❌' : '⚠️');
      console.log(`${status} ${result.message}`);
    }
    
    if (criticalFailures.length > 0) {
      console.error('\n💥 CRITICAL FAILURES - DEPLOYMENT BLOCKED');
      console.error('='.repeat(50));
      criticalFailures.forEach(f => console.error(`❌ ${f.message}`));
      console.error('\n🛑 Please fix critical issues before deploying');
      return false;
    }
    
    const warnings = results.filter(r => !r.passed && !r.critical);
    if (warnings.length > 0) {
      console.warn('\n⚠️  WARNINGS DETECTED:');
      console.warn('='.repeat(50));
      warnings.forEach(w => console.warn(`⚠️  ${w.message}`));
    }
    
    console.log('\n🎉 All critical validations passed - DEPLOYMENT APPROVED');
    console.log('='.repeat(50));
    return true;
  }
  
  async validateEnvironmentVariables(): Promise<ValidationResult> {
    try {
      // Read .env.example to get required variables
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envExample = await fs.readFile(envExamplePath, 'utf8');
      
      const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];
      
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        return {
          passed: false,
          message: `Missing critical environment variables: ${missing.join(', ')}`,
          critical: true
        };
      }
      
      // Validate formats
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
        return {
          passed: false,
          message: 'NEXT_PUBLIC_SUPABASE_URL format appears invalid',
          critical: true
        };
      }
      
      if (anonKey && !anonKey.startsWith('eyJ')) {
        return {
          passed: false,
          message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY format appears invalid',
          critical: true
        };
      }
      
      if (serviceKey && !serviceKey.startsWith('eyJ')) {
        return {
          passed: false,
          message: 'SUPABASE_SERVICE_ROLE_KEY format appears invalid',
          critical: true
        };
      }
      
      return {
        passed: true,
        message: 'Environment variables configured and validated',
        critical: true
      };
    } catch (error) {
      return {
        passed: false,
        message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      };
    }
  }
  
  async validateRouting(): Promise<ValidationResult> {
    try {
      const interactiveSolutionsPath = path.join(process.cwd(), 'src/components/landing/InteractiveSolutions.tsx');
      const content = await fs.readFile(interactiveSolutionsPath, 'utf8');
      
      // Check for proper locale routing
      const hasLocaleRoutes = content.includes('/${locale}${activeSolution.href}');
      const hasUseParams = content.includes('useParams');
      
      if (!hasLocaleRoutes) {
        return {
          passed: false,
          message: 'InteractiveSolutions component missing locale-aware routing',
          critical: true
        };
      }
      
      if (!hasUseParams) {
        return {
          passed: false,
          message: 'InteractiveSolutions component missing useParams import',
          critical: true
        };
      }
      
      return {
        passed: true,
        message: 'Routing validation passed - locale-aware routing implemented',
        critical: true
      };
    } catch (error) {
      return {
        passed: false,
        message: `Routing validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      };
    }
  }
  
  async validatePlaceholderContent(): Promise<ValidationResult> {
    try {
      const srcPath = path.join(process.cwd(), 'src');
      const problematicPatterns = [
        'alert(\'Coming Soon!\')',
        'TODO:',
        'PLACEHOLDER',
        'FIXME:',
        'xxx',
        'placeholder text'
      ];
      
      const issues: string[] = [];
      
      const scanDirectory = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
            const content = await fs.readFile(fullPath, 'utf8');
            
            for (const pattern of problematicPatterns) {
              if (content.includes(pattern)) {
                issues.push(`${fullPath}: Contains "${pattern}"`);
              }
            }
          }
        }
      };
      
      await scanDirectory(srcPath);
      
      if (issues.length > 0) {
        return {
          passed: false,
          message: `Placeholder content detected in ${issues.length} files`,
          critical: false // Warning, not critical
        };
      }
      
      return {
        passed: true,
        message: 'No problematic placeholder content detected',
        critical: false
      };
    } catch (error) {
      return {
        passed: false,
        message: `Placeholder validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false
      };
    }
  }
  
  async validateAPIEndpoints(): Promise<ValidationResult> {
    try {
      const apiPath = path.join(process.cwd(), 'src/app/api');
      const requiredEndpoints = [
        'setup-database/route.ts',
        'compliance/cookie-consent/route.ts',
        'health/route.ts'
      ];
      
      const missing: string[] = [];
      
      for (const endpoint of requiredEndpoints) {
        const endpointPath = path.join(apiPath, endpoint);
        try {
          await fs.access(endpointPath);
        } catch {
          missing.push(endpoint);
        }
      }
      
      if (missing.length > 0) {
        return {
          passed: false,
          message: `Missing critical API endpoints: ${missing.join(', ')}`,
          critical: true
        };
      }
      
      return {
        passed: true,
        message: 'All critical API endpoints present',
        critical: true
      };
    } catch (error) {
      return {
        passed: false,
        message: `API endpoint validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      };
    }
  }
  
  async validateDatabaseConfiguration(): Promise<ValidationResult> {
    try {
      const complianceServicePath = path.join(process.cwd(), 'src/lib/compliance/service.ts');
      const supabaseAdminPath = path.join(process.cwd(), 'src/lib/supabase/admin.ts');
      
      // Check if compliance service exists
      try {
        await fs.access(complianceServicePath);
      } catch {
        return {
          passed: false,
          message: 'Compliance service not found',
          critical: true
        };
      }
      
      // Check if supabase admin client exists
      try {
        await fs.access(supabaseAdminPath);
      } catch {
        return {
          passed: false,
          message: 'Supabase admin client not found',
          critical: true
        };
      }
      
      // Check compliance service implementation
      const complianceContent = await fs.readFile(complianceServicePath, 'utf8');
      const hasRecordCookieConsent = complianceContent.includes('recordCookieConsent');
      const hasGetCookieConsent = complianceContent.includes('getCookieConsent');
      
      if (!hasRecordCookieConsent || !hasGetCookieConsent) {
        return {
          passed: false,
          message: 'Compliance service missing required methods',
          critical: true
        };
      }
      
      return {
        passed: true,
        message: 'Database configuration validated',
        critical: true
      };
    } catch (error) {
      return {
        passed: false,
        message: `Database validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      };
    }
  }
  
  async validateComplianceSetup(): Promise<ValidationResult> {
    try {
      const complianceTypesPath = path.join(process.cwd(), 'src/lib/compliance/types.ts');
      
      try {
        await fs.access(complianceTypesPath);
      } catch {
        return {
          passed: false,
          message: 'Compliance types definition not found',
          critical: true
        };
      }
      
      const typesContent = await fs.readFile(complianceTypesPath, 'utf8');
      const hasCookieConsentFormData = typesContent.includes('CookieConsentFormData');
      const hasComplianceService = typesContent.includes('ConsentType');
      
      if (!hasCookieConsentFormData || !hasComplianceService) {
        return {
          passed: false,
          message: 'Compliance types incomplete',
          critical: true
        };
      }
      
      return {
        passed: true,
        message: 'Compliance framework validated',
        critical: true
      };
    } catch (error) {
      return {
        passed: false,
        message: `Compliance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      };
    }
  }
}

// CLI interface
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator.validateAll().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Validation failed with error:', error);
    process.exit(1);
  });
}
