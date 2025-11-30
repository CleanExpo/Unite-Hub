#!/usr/bin/env node
import https from 'https';

const appId = 'dbaa4c4e-c69c-4b20-ae2c-22b366986dbc';
const deployId = 'af3cfcac-815d-4f4f-872e-d7b61412d479';
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
    return;
  }

  if (d.phase !== 'BUILDING') {
    return;
  }

  // Get log URL
  const logsResult = await request(`/v2/apps/${appId}/deployments/${deployId}/components/${componentName}/logs?type=BUILD&follow=false`);
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
        console.log('\n--- Last 50 build log lines ---');
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
