import {DEFAULTS,prepareMarket,evaluate,searchRate} from '../dist/engine.js';
import {writeFileSync} from 'node:fs';
import os from 'node:os';
const reports=[];
for(const paths of [10000,100000]){
  const c={...DEFAULTS,paths},begin=performance.now();
  const market=prepareMarket(c),prepared=performance.now();
  const r=evaluate(c,market),end=performance.now();
  const report={runtime:process.version,cpu:os.cpus()[0]?.model,paths,years:c.years,model:c.sampling,marketMs:prepared-begin,evaluationMs:end-prepared,totalMs:end-begin,ruin:1-r.survival,lifestyle:r.lifestyle,seed:c.seed};
  reports.push(report);console.log(JSON.stringify(report));
}
if(process.argv.includes('--swr')){const c={...DEFAULTS,paths:10000};const m=prepareMarket(c),t=performance.now(),r=searchRate(c,m);const report={operation:'150-point grid search',paths:c.paths,years:c.years,elapsedMs:performance.now()-t,rate:r.rate};reports.push(report);console.log(JSON.stringify(report));}
writeFileSync('docs/benchmark-node.json',JSON.stringify({executed:new Date().toISOString(),environment:'Node on development host, not a browser claim',reports},null,2));
