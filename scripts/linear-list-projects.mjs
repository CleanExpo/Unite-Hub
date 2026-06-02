#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
const envPath='D:/Unite-Group/Nexus-Hub/secrets/local.env'
function parse(text,k){for(const r of text.split(/\r?\n/)){const l=r.trim();if(!l||l.startsWith('#')||!l.includes('='))continue;const [key,...v]=l.split('=');if(key.trim()!==k)continue;let val=v.join('=').trim();if((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'")))val=val.slice(1,-1);return val}return ''}
async function gql(query, variables={}){const key=parse(await readFile(envPath,'utf8'),'LINEAR_API_KEY');const res=await fetch('https://api.linear.app/graphql',{method:'POST',headers:{'Content-Type':'application/json',Authorization:key},body:JSON.stringify({query,variables})});const body=await res.json();if(!res.ok||body.errors?.length)throw new Error(JSON.stringify(body.errors));return body.data}
const data=await gql(`query { projects(first:100) { nodes { id name state teams { nodes { key name } } } } }`)
for (const p of data.projects.nodes) console.log(JSON.stringify({id:p.id,name:p.name,state:p.state,teams:p.teams.nodes.map(t=>t.key)}))
