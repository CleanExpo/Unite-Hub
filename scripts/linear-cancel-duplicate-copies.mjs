#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
const envPath='D:/Unite-Group/Nexus-Hub/secrets/local.env'
const canceledStateId='91ba795d-6e3d-4b9e-9c2a-bfc05b3720e0'
function parse(text,k){for(const r of text.split(/\r?\n/)){const l=r.trim();if(!l||l.startsWith('#')||!l.includes('='))continue;const [key,...v]=l.split('=');if(key.trim()!==k)continue;let val=v.join('=').trim();if((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'")))val=val.slice(1,-1);return val}return ''}
async function gql(query,variables={}){const key=parse(await readFile(envPath,'utf8'),'LINEAR_API_KEY');const res=await fetch('https://api.linear.app/graphql',{method:'POST',headers:{'Content-Type':'application/json',Authorization:key},body:JSON.stringify({query,variables})});const body=await res.json().catch(()=>({}));if(!res.ok||body.errors?.length)throw new Error(`Linear API failed: HTTP ${res.status} ${body.errors?.map(e=>e.message).join('; ')??''}`);return body.data}
async function update(issue){ if(issue.state==='Canceled') return console.error(`already ${issue.identifier}`); const res=await gql(`mutation U($id:String!,$stateId:String!){ issueUpdate(id:$id,input:{stateId:$stateId}){ success issue { identifier state { name } } } }`,{id:issue.id,stateId:canceledStateId}); console.error(`updated ${res.issueUpdate.issue.identifier} -> ${res.issueUpdate.issue.state.name}`)}
const openIssues = new Map((await readFile('pi-devops-open.jsonl','utf8')).trim().split(/\r?\n/).filter(Boolean).map(line => { const issue = JSON.parse(line); return [issue.identifier, issue] }))
const issues=[]
for(const line of (await readFile('linear-cleanup-plan.jsonl','utf8')).trim().split(/\r?\n/).slice(1)){const o=JSON.parse(line); if(o.to==='Duplicate' && openIssues.has(o.identifier)) issues.push(openIssues.get(o.identifier))}
console.log(JSON.stringify({cancelDuplicateCopies:issues.length}))
for(const issue of issues) await update(issue)
