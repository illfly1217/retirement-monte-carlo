import test from 'node:test';
import assert from 'node:assert/strict';
import {CPI} from '../dist/cpi-data.js';
import {datasetForCurrency} from '../dist/datasets.js';
import {DEFAULTS,prepareMarket,validate,evaluate} from '../dist/engine.js';

test('official CPI snapshots retain dates, real published values, and missing releases',()=>{
  assert.equal(CPI.retrieved,'2026-10-17');
  assert.equal(CPI.TWD.levels[0],52.95);
  assert.equal(CPI.TWD.levels.at(-1),112.82);
  assert.equal(CPI.USD.levels.at(-1),336.94);
  for(const currency of ['TWD','USD']){
    const source=CPI[currency];assert.equal(source.dates.length,source.levels.length);
    assert.ok(source.dates.length>500);assert.equal(new Set(source.dates).size,source.dates.length);
    assert.deepEqual([...source.dates].sort(),source.dates);
    assert.ok(source.levels.every(v=>Number.isFinite(v)&&v>0));
  }
  const us=datasetForCurrency('USD').cpi;
  assert.deepEqual(us.gaps,['2025-09 → 2025-11']);
  assert.ok(!us.dates.includes('2025-10')&&!us.dates.includes('2025-11'));
  const i=us.dates.indexOf('2025-12'),level=CPI.USD.dates.indexOf('2025-12');
  assert.equal(us.inflation[i],CPI.USD.levels[level]/CPI.USD.levels[level-1]-1);
});
test('bundled CPI works for both currencies, is reproducible, and leaves equity shocks unchanged',()=>{
  for(const currency of ['TWD','USD']){
    const data=datasetForCurrency(currency),c={...DEFAULTS,currency,paths:100,years:3,inflationModel:'cpi'};
    validate(c,data);
    const a=prepareMarket(c,data),b=prepareMarket(c,data),constant=prepareMarket({...c,inflationModel:'constant'},data);
    assert.deepEqual(a.inflation,b.inflation);assert.deepEqual(a.factors,constant.factors);
    assert.ok(a.inflation.some(v=>v!==a.inflation[0]));
    assert.ok(Number.isFinite(evaluate(c,a).terminal[3]));
    assert.throws(()=>validate({...c,currency:currency==='USD'?'TWD':'USD'},data),/幣種/);
  }
});
test('CPI blocks restart at missing months instead of treating the gap as adjacent',()=>{
  const c={...DEFAULTS,paths:100,years:1,inflationModel:'cpi',block:120};
  const data={returns:[],inflation:[],cpi:{currency:'USD',dates:[],inflation:[]}};
  for(let i=0;i<24;i++){data.cpi.dates.push(`${2000+Math.floor(i/6)}-${String((i%6)*2+1).padStart(2,'0')}`);data.cpi.inflation.push(i/10000);}
  const a=prepareMarket(c,data),b=prepareMarket({...c,block:1},data);
  assert.deepEqual(a.inflation,b.inflation);
});
