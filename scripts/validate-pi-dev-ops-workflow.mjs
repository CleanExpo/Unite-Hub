#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [, , manifestPath, evidencePath] = process.argv;

if (!manifestPath || !evidencePath) {
  console.error('Usage: node scripts/validate-pi-dev-ops-workflow.mjs <manifest.json> <evidence.json>');
  process.exit(2);
}

function readJson(filePath) {
  const absolute = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

const manifest = readJson(manifestPath);
const evidence = readJson(evidencePath);
const errors = [];

const requiredManifestTop = ['workflow_id', 'version', 'intent', 'risk', 'governance', 'model_routing', 'budgets', 'scope', 'gates', 'required_evidence_fields', 'verification'];
for (const field of requiredManifestTop) {
  if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
    errors.push(`manifest missing ${field}`);
  }
}

const requiredGates = ['intake', 'connection', 'bloat', 'build', 'verification', 'review', 'finalise', 'token'];
for (const gate of requiredGates) {
  if (!Array.isArray(manifest.gates) || !manifest.gates.includes(gate)) {
    errors.push(`manifest missing gate ${gate}`);
  }
}

for (const field of manifest.required_evidence_fields || []) {
  if (evidence[field] === undefined || evidence[field] === null || evidence[field] === '' || (Array.isArray(evidence[field]) && evidence[field].length === 0)) {
    errors.push(`evidence missing ${field}`);
  }
}

if (!['complete', 'blocked', 'rolled_back'].includes(evidence.final_state)) {
  errors.push('evidence final_state must be complete, blocked, or rolled_back');
}

if (!evidence.connection_map || Object.keys(evidence.connection_map).length < 3) {
  errors.push('evidence connection_map must include at least three live touchpoints');
}

const maxChangedFiles = Number(manifest?.budgets?.max_changed_files ?? 0);
if (maxChangedFiles > 0 && Array.isArray(evidence.actual_changed_files) && evidence.actual_changed_files.length > maxChangedFiles) {
  errors.push(`changed file budget exceeded: ${evidence.actual_changed_files.length} > ${maxChangedFiles}`);
}

const deniedPaths = manifest?.scope?.denied_paths || [];
const changedFiles = evidence.actual_changed_files || [];
for (const changed of changedFiles) {
  for (const denied of deniedPaths) {
    const pattern = denied.replace(/\\/g, '/').replace(/\*\*/g, '').replace(/\*/g, '');
    const normalized = changed.replace(/\\/g, '/');
    if (pattern && normalized.startsWith(pattern.replace(/\/$/, ''))) {
      errors.push(`changed file is in denied path: ${changed}`);
    }
  }
}

const fakeGreenPhrases = ['TODO', 'TBD', 'fake pass', 'assume pass'];
const evidenceText = JSON.stringify(evidence);
for (const phrase of fakeGreenPhrases) {
  if (evidence.final_state === 'complete' && evidenceText.includes(phrase)) {
    errors.push(`complete evidence contains unresolved/fake-green phrase: ${phrase}`);
  }
}

if (errors.length) {
  console.error('Pi-Dev-Ops workflow validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Pi-Dev-Ops workflow validation passed');
console.log(JSON.stringify({
  workflow_id: manifest.workflow_id,
  final_state: evidence.final_state,
  changed_files: changedFiles.length,
  gates: manifest.gates.length
}, null, 2));
