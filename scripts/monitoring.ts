import axios from 'axios';
import nodemailer from 'nodemailer';
import process from 'process';
import { config } from 'dotenv';

// Load environment variables
config({ path: process.cwd() + '/.env.local' });
config({ path: process.cwd() + '/.env' });

const HEALTH_ENDPOINT = '/api/health';
const REPORT_EMAIL = process.env.REPORT_EMAIL;

interface HealthCheckResult {
  healthy: boolean;
  details: string;
  timestamp: Date;
}

class AdvancedMonitoringSystem {
  
  async checkServiceHealth(baseUrl: string): Promise<HealthCheckResult> {
    try {
      const res = await axios.get(`${baseUrl}${HEALTH_ENDPOINT}`, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      
      if (res.status === 200) {
        const data = res.data;
        const isHealthy = data.healthy || data.status === 'healthy' || data.ok;
        
        console.log(isHealthy ? '✅ Service health OK.' : '❌ Service health NOT OK.');
        
        return {
          healthy: isHealthy,
          details: JSON.stringify(data),
          timestamp: new Date()
        };
      } else {
        console.error(`❌ Health endpoint returned status ${res.status}`);
        return {
          healthy: false,
          details: `HTTP ${res.status}: ${res.statusText}`,
          timestamp: new Date()
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Health endpoint failed: ${errorMessage}`);
      return {
        healthy: false,
        details: `Connection error: ${errorMessage}`,
        timestamp: new Date()
      };
    }
  }

  async checkDatabaseConnectivity(): Promise<HealthCheckResult> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceKey) {
        console.warn('⚠️ Database connectivity check skipped - missing configuration');
        return {
          healthy: true,
          details: 'Database check skipped - missing configuration',
          timestamp: new Date()
        };
      }

      await axios.get(`${supabaseUrl}/rest/v1/`, {
        headers: { apiKey: serviceKey },
        timeout: 5000
      });
      
      console.log('✅ Database connectivity OK.');
      return {
        healthy: true,
        details: 'Database connection successful',
        timestamp: new Date()
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Database connectivity failed:', errorMessage);
      return {
        healthy: false,
        details: `Database error: ${errorMessage}`,
        timestamp: new Date()
      };
    }
  }

  async checkEnvVarsIntegrity(): Promise<HealthCheckResult> {
    try {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
        'SUPABASE_SERVICE_ROLE_KEY'
      ];
      
      const missing = requiredVars.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
        return {
          healthy: false,
          details: `Missing required environment variables: ${missing.join(', ')}`,
          timestamp: new Date()
        };
      }
      
      console.log('✅ Environment variables integrity OK.');
      return {
        healthy: true,
        details: 'All required environment variables present',
        timestamp: new Date()
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        healthy: false,
        details: `Environment check error: ${errorMessage}`,
        timestamp: new Date()
      };
    }
  }

  async checkCriticalPages(baseUrl: string): Promise<HealthCheckResult> {
    try {
      const criticalPages = ['/', '/api/health'];
      const failures: string[] = [];
      
      for (const page of criticalPages) {
        try {
          const res = await axios.get(`${baseUrl}${page}`, { 
            timeout: 5000,
            validateStatus: () => true 
          });
          
          if (res.status >= 500) {
            failures.push(`${page} (${res.status})`);
          }
        } catch (error: unknown) {
          failures.push(`${page} (connection failed)`);
        }
      }
      
      if (failures.length > 0) {
        console.error(`❌ Critical pages failing: ${failures.join(', ')}`);
        return {
          healthy: false,
          details: `Critical pages failing: ${failures.join(', ')}`,
          timestamp: new Date()
        };
      }
      
      console.log('✅ Critical pages accessible.');
      return {
        healthy: true,
        details: 'All critical pages accessible',
        timestamp: new Date()
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        healthy: false,
        details: `Critical pages check error: ${errorMessage}`,
        timestamp: new Date()
      };
    }
  }

  async sendAlert(subject: string, body: string): Promise<void> {
    try {
      if (!REPORT_EMAIL) {
        console.warn('⚠️ REPORT_EMAIL not configured. Skipping email alert.');
        console.log(`📧 Would send alert: ${subject}`);
        return;
      }

      // Check if SMTP configuration is available
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.warn('⚠️ SMTP configuration incomplete. Skipping email alert.');
        console.log(`📧 Would send alert: ${subject}`);
        return;
      }

      // Configure transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Send mail
      await transporter.sendMail({
        from: `"Error-Free Deployment Monitor" <${smtpUser}>`,
        to: REPORT_EMAIL,
        subject,
        text: body,
        html: `<pre>${body}</pre>`,
      });

      console.log(`📧 Alert email sent to ${REPORT_EMAIL}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to send alert email: ${errorMessage}`);
    }
  }

  async performFullHealthCheck(baseUrl: string): Promise<{ 
    overall: boolean; 
    results: HealthCheckResult[]; 
    summary: string 
  }> {
    console.log(`🔍 Performing comprehensive health check for: ${baseUrl}`);
    
    const checks = [
      { name: 'Service Health', check: () => this.checkServiceHealth(baseUrl) },
      { name: 'Database Connectivity', check: () => this.checkDatabaseConnectivity() },
      { name: 'Environment Variables', check: () => this.checkEnvVarsIntegrity() },
      { name: 'Critical Pages', check: () => this.checkCriticalPages(baseUrl) }
    ];

    const results: HealthCheckResult[] = [];
    const failedChecks: string[] = [];

    for (const { name, check } of checks) {
      console.log(`\n🔎 Checking: ${name}`);
      try {
        const result = await check();
        results.push(result);
        
        if (!result.healthy) {
          failedChecks.push(`${name}: ${result.details}`);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorResult: HealthCheckResult = {
          healthy: false,
          details: `${name} check failed: ${errorMessage}`,
          timestamp: new Date()
        };
        results.push(errorResult);
        failedChecks.push(`${name}: Check failed with error`);
      }
    }

    const overall = results.every(r => r.healthy);
    const summary = overall 
      ? '✅ All health checks passed'
      : `❌ ${failedChecks.length} health check(s) failed:\n${failedChecks.join('\n')}`;

    console.log(`\n📊 Health Check Summary: ${overall ? 'HEALTHY' : 'ISSUES DETECTED'}`);
    
    return { overall, results, summary };
  }

  async runContinuousMonitor(baseUrl: string, intervalMs: number): Promise<void> {
    console.log(`🔁 Starting continuous monitoring every ${intervalMs / 1000}s for ${baseUrl}`);
    
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    
    while (true) {
      try {
        const healthCheck = await this.performFullHealthCheck(baseUrl);
        
        if (!healthCheck.overall) {
          consecutiveFailures++;
          console.error(`❌ Health check failed (${consecutiveFailures}/${maxConsecutiveFailures})`);
          
          if (consecutiveFailures >= maxConsecutiveFailures) {
            await this.sendAlert(
              `🚨 CRITICAL: Service Unhealthy (${consecutiveFailures} consecutive failures)`,
              `Service health monitoring has detected ${consecutiveFailures} consecutive failures for ${baseUrl}.\n\n` +
              `Time: ${new Date().toISOString()}\n\n` +
              `Details:\n${healthCheck.summary}\n\n` +
              `Please investigate immediately.`
            );
            
            // Reset counter after sending alert to avoid spam
            consecutiveFailures = 0;
          }
        } else {
          // Reset counter on successful check
          if (consecutiveFailures > 0) {
            console.log(`✅ Service recovered after ${consecutiveFailures} failures`);
            await this.sendAlert(
              `✅ Service Recovered`,
              `Service health monitoring detected recovery for ${baseUrl}.\n\n` +
              `Time: ${new Date().toISOString()}\n\n` +
              `The service is now healthy after ${consecutiveFailures} previous failures.`
            );
          }
          consecutiveFailures = 0;
        }
        
        console.log(`⏱️  Next check in ${intervalMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Monitoring error: ${errorMessage}`);
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  }

  printUsage(): void {
    console.log(`
Usage: tsx scripts/monitoring.ts <command> <baseUrl> [options]

Commands:
  health <baseUrl>                    - Single health check
  monitor <baseUrl> [intervalMs]      - Continuous monitoring (default: 10min)  
  report <baseUrl>                    - Generate detailed health report

Examples:
  tsx scripts/monitoring.ts health https://your-app.vercel.app
  tsx scripts/monitoring.ts monitor https://your-app.vercel.app 300000
  tsx scripts/monitoring.ts report https://your-app.vercel.app

Environment Variables Required:
  REPORT_EMAIL                        - Email address for alerts
  SMTP_HOST, SMTP_PORT               - SMTP server configuration
  SMTP_USER, SMTP_PASS               - SMTP authentication
  NEXT_PUBLIC_SUPABASE_URL           - For database checks
  SUPABASE_SERVICE_ROLE_KEY          - For database connectivity
    `);
  }
}

async function main() {
  const monitor = new AdvancedMonitoringSystem();
  
  const mode = process.argv[2];
  const baseUrl = process.argv[3];
  const intervalMs = parseInt(process.argv[4] || '600000', 10); // default 10 minutes

  if (!mode || !baseUrl) {
    monitor.printUsage();
    process.exit(1);
  }

  try {
    switch (mode) {
      case 'health': {
        const healthCheck = await monitor.performFullHealthCheck(baseUrl);
        process.exit(healthCheck.overall ? 0 : 1);
        break;
      }
      
      case 'monitor': {
        await monitor.runContinuousMonitor(baseUrl, intervalMs);
        break;
      }
      
      case 'report': {
        const healthCheck = await monitor.performFullHealthCheck(baseUrl);
        console.log(`\n📝 HEALTH REPORT FOR: ${baseUrl}`);
        console.log('='.repeat(60));
        console.log(`Overall Status: ${healthCheck.overall ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('\nDetailed Results:');
        healthCheck.results.forEach((result, i) => {
          console.log(`${i + 1}. ${result.healthy ? '✅' : '❌'} ${result.details}`);
        });
        console.log('\n' + '='.repeat(60));
        process.exit(healthCheck.overall ? 0 : 1);
        break;
      }
      
      default: {
        console.error(`❌ Unknown command: ${mode}`);
        monitor.printUsage();
        process.exit(1);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Monitoring script error: ${errorMessage}`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  console.error(`❌ Monitoring script error: ${errorMessage}`);
  process.exit(1);
});
