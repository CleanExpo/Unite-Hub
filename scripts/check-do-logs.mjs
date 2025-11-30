#!/usr/bin/env node
import https from 'https';

const appId = 'dbaa4c4e-c69c-4b20-ae2c-22b366986dbc';
const deployId = '1bd667ca-9172-4f5c-ab5a-bf0ff614a70f';
const componentName = 'unite-hub2';
const token = process.env.DIGITALOCEAN_API_TOKEN;

// Get log URL
function request(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.digitalocean.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Get deployment status
  const deploy = await request(`/v2/apps/${appId}/deployments/${deployId}`);
  const d = deploy.deployment;
  console.log('Phase:', d.phase);
  console.log('Progress:', d.progress?.steps?.map(s => s.name + ': ' + s.status).join(', '));
  console.log('Updated:', d.updated_at);

  if (d.phase === 'ERROR') {
    console.log('\n--- ERROR DETAILS ---');
    d.progress?.steps?.forEach(s => {
      if (s.status === 'ERROR') {
        console.log(s.name + ':', s.reason?.message || 'no message');
      }
    });
  }

  if (d.phase === 'ACTIVE') {
    console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
    const app = await request(`/v2/apps/${appId}`);
    console.log('Live URL:', app.app?.live_url);
    // Continue to show runtime logs
  }

  if (d.phase !== 'BUILDING' && d.phase !== 'ACTIVE') {
    return;
  }

  // Get log URL (BUILD for building phase, RUN for active)
  const logType = d.phase === 'BUILDING' ? 'BUILD' : 'RUN';
  const logsResult = await request(`/v2/apps/${appId}/deployments/${deployId}/components/${componentName}/logs?type=${logType}&follow=false`);
  const logUrl = logsResult.live_url || logsResult.url;

  if (!logUrl) {
    console.log('No log URL available');
    return;
  }

  // Fetch logs
  const url = new URL(logUrl);
  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Accept': 'text/plain' }
    };

    let output = '';
    const req = https.request(options, (res) => {
      res.on('data', chunk => { output += chunk.toString(); });
      res.on('end', () => {
        const lines = output.split('\n');
        console.log(`\n--- Last 50 ${logType.toLowerCase()} log lines ---`);
        console.log(lines.slice(-50).join('\n'));
        resolve();
      });
    });

    setTimeout(() => {
      const lines = output.split('\n');
      console.log('\n--- Timeout (last 50 lines) ---');
      console.log(lines.slice(-50).join('\n'));
      resolve();
    }, 15000);

    req.on('error', e => { console.error(e.message); resolve(); });
    req.end();
  });
}

main().catch(console.error);
