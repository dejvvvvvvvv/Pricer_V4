import {writeFileSync,mkdirSync} from 'fs';
import {join} from 'path';
const d='.claude/agents';
mkdirSync(d,{recursive:true});
const a=[
['mp-spec-security-api-keys','API Keys & Secrets Guardian','haiku','plan','SECURITY'],
['mp-spec-security-upload','Upload Security Specialist','sonnet','plan','SECURITY'],
['mp-spec-security-auth','Auth & Session Security','sonnet','plan','SECURITY'],
['mp-spec-security-injection','Injection Prevention Specialist','sonnet','plan','SECURITY'],
['mp-spec-security-gdpr','GDPR & Privacy Compliance','sonnet','plan','SECURITY'],
['mp-sr-quality','Senior Quality Architect','opus','plan','QUALITY'],
['mp-mid-quality-code','Code Quality Engineer','opus','plan','QUALITY'],
['mp-mid-quality-test','Test Quality Engineer','opus','acceptEdits','QUALITY'],
['mp-spec-test-unit','Unit Test Specialist','sonnet','acceptEdits','QUALITY'],
['mp-spec-test-e2e','E2E Test Specialist','sonnet','acceptEdits','QUALITY'],
['mp-spec-test-api','API Test Specialist','sonnet','acceptEdits','QUALITY'],
['mp-spec-test-visual','Visual Regression Test Specialist','sonnet','acceptEdits','QUALITY'],
['mp-spec-test-build','Build Test Specialist','sonnet','acceptEdits','QUALITY'],
['mp-spec-test-browser','Browser Compatibility Tester','haiku','plan','QUALITY'],
['mp-sr-infra','Senior Infrastructure Architect','opus','plan','INFRA'],
['mp-mid-infra-build','Build Pipeline Engineer','opus','acceptEdits','INFRA'],
['mp-mid-infra-deploy','Deployment Engineer','opus','acceptEdits','INFRA'],
['mp-spec-infra-docker','Docker & Container Specialist','sonnet','acceptEdits','INFRA'],
['mp-spec-infra-firebase','Firebase Infrastructure Specialist','sonnet','acceptEdits','INFRA'],
['mp-spec-infra-deps','Dependency Management Specialist','sonnet','acceptEdits','INFRA'],
['mp-spec-infra-monitoring','Monitoring & Observability Specialist','sonnet','acceptEdits','INFRA']
];
const g=(n,t,m,p,dom)=>`---
name: ${n}
description: ${t}
model: claude-${m==='opus'?'opus-4-6':m==='sonnet'?'sonnet-4-5-20250929':'haiku-4-5-20251001'}
permissionMode: ${p}
---
# ${t}
Domain: ${dom} | ModelPricer V3 agent
`;
let c=0;
a.forEach(([n,t,m,p,dom])=>{try{writeFileSync(join(d,n+'.md'),g(n,t,m,p,dom),'utf8');console.log('✓ '+n);c++;}catch(e){console.error('✗ '+n+':',e.message);}});
console.log('\nCreated: '+c+'/'+a.length);
