import test from'node:test';
import assert from'node:assert/strict';
import{Worker}from'node:worker_threads';
import{DEFAULTS}from'../dist/engine.js';
test('Production Worker protocol: run, cached strategies, assumptions, search, invalid data',async()=>{
  const w=new Worker(new URL('./worker-host.mjs',import.meta.url));
  try{
    await new Promise((resolve,reject)=>{w.once('message',resolve);w.once('error',reject);});
    let id=0;
    const run=(action,extra={})=>new Promise((resolve,reject)=>{const request=++id;const onMessage=m=>{if(m.id!==request||m.type==='progress')return;w.off('message',onMessage);resolve(m);};w.on('message',onMessage);w.once('error',reject);w.postMessage({id:request,action,config:{...DEFAULTS,paths:1000,years:50,...extra},dataset:null});});
    const first=await run('run');assert.equal(first.type,'result');assert.equal(first.result.paths,1000);assert.equal(first.result.assetPercentiles.length,51);
    const compare=await run('compare');assert.equal(compare.result.length,4);assert.equal(compare.result[0].survival,first.result.survival);assert.equal(compare.result[1].survival,1);
    const assumptions=await run('assumptions');assert.equal(assumptions.result.length,2);assert.notEqual(assumptions.result[0].survival,assumptions.result[1].survival);
    const swr=await run('swr');assert.equal(swr.result.trials.length,150);assert.ok(swr.result.rate>0);
    const error=await run('run',{sampling:'stationary',returnMode:'historical'});assert.equal(error.type,'error');assert.match(error.message,/尚未載入/);
  }finally{await w.terminate();}
});
