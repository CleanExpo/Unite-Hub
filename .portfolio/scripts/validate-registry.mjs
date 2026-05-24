#!/usr/bin/env node
// Validates PORTFOLIO.yaml against schema, plus extra invariants:
// - canonical_names are unique
// - no alias collides with another product's canonical_name or alias
// - do_not_clone_to paths are absolute Windows paths
// Usage: node validate-registry.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const YAML = require("yaml");
const Ajv = require("ajv");

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const yamlText = readFileSync(resolve(root, "PORTFOLIO.yaml"), "utf8");
const schema = JSON.parse(readFileSync(resolve(root, "schema/portfolio.schema.json"), "utf8"));
const data = YAML.parse(yamlText);

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
if (!validate(data)) {
  console.error("Schema validation failed:");
  for (const err of validate.errors) console.error(`  ${err.instancePath} ${err.message}`);
  process.exit(1);
}

const errors = [];
const seenCanon = new Set();
const seenAlias = new Map(); // alias -> canonical

for (const p of data.products) {
  if (seenCanon.has(p.canonical_name)) errors.push(`duplicate canonical_name: ${p.canonical_name}`);
  seenCanon.add(p.canonical_name);

  for (const a of p.aliases ?? []) {
    if (seenAlias.has(a) && seenAlias.get(a) !== p.canonical_name) {
      errors.push(`alias "${a}" used by both ${seenAlias.get(a)} and ${p.canonical_name}`);
    }
    if (seenCanon.has(a) && a !== p.canonical_name) {
      errors.push(`alias "${a}" collides with a different canonical_name`);
    }
    seenAlias.set(a, p.canonical_name);
  }

  for (const path of p.local?.do_not_clone_to ?? []) {
    if (!/^[A-Z]:\\/.test(path)) errors.push(`${p.canonical_name}: do_not_clone_to path not absolute: ${path}`);
  }
}

if (errors.length) {
  console.error("Invariant errors:");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`OK — ${data.products.length} products, ${seenAlias.size} aliases, no collisions`);
