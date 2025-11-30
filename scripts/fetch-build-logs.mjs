#!/usr/bin/env node
import https from 'https';
import zlib from 'zlib';

const appId = 'dbaa4c4e-c69c-4b20-ae2c-22b366986dbc';
const token = process.env.DIGITALOCEAN_API_TOKEN;

function request(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.digitalocean.com',
      path,
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  // Get latest deployment
  const deployRes = await request('/v2/apps/' + appId + '/deployments?page=1&per_page=1');
  const deploy = deployRes.deployments[0];
  console.log('Deployment:', deploy.id.slice(0, 8), '- Phase:', deploy.phase);

  // Get logs URL
  const logsRes = await request('/v2/apps/' + appId + '/deployments/' + deploy.id + '/components/unite-hub2/logs?type=BUILD&follow=false');

  if (!logsRes.historic_urls || logsRes.historic_urls.length === 0) {
    console.log('No historic URLs available');
    return;
  }

  const logUrl = new URL(logsRes.historic_urls[0]);
  console.log('Fetching from:', logUrl.hostname);

  // Fetch logs
  await new Promise((resolve) => {
    https.get({
      hostname: logUrl.hostname,
      path: logUrl.pathname + logUrl.search
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Try gzip decompression
        try {
          const decompressed = zlib.gunzipSync(buffer);
          const text = decompressed.toString('utf8');
          const lines = text.split('\n');
          console.log('\n=== Last 100 lines of build log ===');
          console.log(lines.slice(-100).join('\n'));
        } catch (e) {
          // Not gzipped, extract readable content
          const text = buffer.toString('utf8');
          // Filter for printable ASCII
          const clean = text.replace(/[^\x20-\x7E\n\r]/g, ' ');
          const lines = clean.split(/[\n\r]+/).filter(l => l.trim().length > 10);
          console.log('\n=== Found ' + lines.length + ' readable lines ===');
          console.log(lines.slice(-80).join('\n'));
        }
        resolve();
      });
    }).on('error', e => { console.log('Error:', e.message); resolve(); });
  });
}

main().catch(console.error);
