#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
const envPath='D:/Unite-Group/Nexus-Hub/secrets/local.env'
const projectId=process.argv[2]
function parse(text,k){for(const r of text.split(/\r?\n/)){const l=r.trim();if(!l||l.startsWith('#')||!l.includes('='))continue;const [key,...v]=l.split('=');if(key.trim()!==k)continue;let val=v.join('=').trim();if((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'")))val=val.slice(1,-1);return val}return ''}
async function gql(query, variables={}){const key=parse(await readFile(envPath,'utf8'),'LINEAR_API_KEY');const res=await fetch('https://api.linear.app/graphql',{method:'POST',headers:{'Content-Type':'application/json',Authorization:key},body:JSON.stringify({query,variables})});const body=await res.json().catch(()=>({}));if(!res.ok||body.errors?.length)throw new Error(`HTTP ${res.status} ${body.errors?.map(e=>e.message).join(';')}`);return body.data}
const q=`query ProjectIssues($projectId: ID!, $after: String) { issues(first:100, after:$after, filter:{ project:{ id:{ eq:$projectId } }, state:{ type:{ nin:["completed","canceled"] } } }) { pageInfo { hasNextPage endCursor } nodes { id identifier title description priority estimate url createdAt updatedAt state { id name type } team { key name } assignee { name } labels { nodes { name } } } } }`
let after=null; const issues=[]; do { const data=await gql(q,{projectId,after}); issues.push(...data.issues.nodes); after=data.issues.pageInfo.hasNextPage?data.issues.pageInfo.endCursor:null } while(after)
issues.sort((a,b)=>`${a.state.type}|${a.state.name}|${a.identifier}`.localeCompare(`${b.state.type}|${b.state.name}|${b.identifier}`))
for(const i of issues) console.log(JSON.stringify({id:i.id,identifier:i.identifier,title:i.title,state:i.state.name,stateType:i.state.type,team:i.team.key,assignee:i.assignee?.name??null,labels:i.labels.nodes.map(l=>l.name),priority:i.priority,estimate:i.estimate??null,updatedAt:i.updatedAt,url:i.url,description:(i.description??'').slice(0,1200)}))
console.error(`count=${issues.length}`)
