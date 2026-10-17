import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS, prepareMarket} from '../dist/engine.js';
import {resolveScenario, scenarioMetadata, VCMM_PRESET} from '../dist/scenarios.js';
import {datasetForCurrency} from '../dist/datasets.js';
import {calibrateEquity} from '../scripts/calibrate-equity.mjs';
import {levelsCSV} from './fixtures.mjs';

test('locked VCMM assumptions resolve identically in the engine despite stale saved inputs', () => {
  const c = {...DEFAULTS, paths:100, years:1, returnMode:'vcmm'};
  const stale = {...c, cagr:.29, vol:.7, usWeight:0, longRun:.2, transition:1};
  assert.deepEqual(resolveScenario(stale), {...stale, ...VCMM_PRESET, inflationVol:0});
  assert.deepEqual(prepareMarket(c).factors, prepareMarket(stale).factors);
});

test('CPI summaries describe the sample while generated inflation still varies', () => {
  const data=datasetForCurrency('TWD'), c={...DEFAULTS,currency:'TWD',paths:100,years:2,inflationModel:'cpi'};
  const resolved=resolveScenario(c,data), metadata=scenarioMetadata(c,data);
  assert.notEqual(resolved.inflation,.025);
  assert.equal(metadata.inflation.sampleStatistics.cagr,resolved.inflation);
  assert.equal(metadata.inflation.sampleStatistics.logVol,resolved.inflationVol);
  assert.equal(metadata.equity.sampling,'parametric');
  assert.equal(metadata.inflation.sampling,'independent stationary blocks');
  assert.ok(new Set(prepareMarket(c,data).inflation).size>1);
  assert.equal('returns' in metadata,false);
});

test('fixed built-in and custom inflation have distinct sources and no active volatility', () => {
  for(const currency of ['TWD','USD']){
    const preset=resolveScenario({...DEFAULTS,currency,inflationModel:'preset',inflation:.1,inflationVol:.2});
    assert.equal(preset.inflation,currency==='TWD'?.02:.025);assert.equal(preset.inflationVol,0);
    assert.equal(resolveScenario({...preset,inflationModel:'constant',inflation:.035}).inflation,.035);
  }
});

const metadata={indexCode:'664204',currency:'USD',returnType:'net-total-return',sourceUrl:'https://example.test/synthetic-fixture',retrieved:'2026-10-17',license:{rawRedistributionPermission:'synthetic test only',publicDerivedParametersPermission:'synthetic test only',termsUrls:['https://example.test/synthetic-terms']}};
const equityCSV=levelsCSV.split('\n').map(line=>line.split(',').slice(0,2).join(',')).join('\n');
test('offline calibration computes known compound returns and publishes no observations', () => {
  const result=calibrateEquity(equityCSV,metadata);
  assert.ok(Math.abs(result.parameters.cagr-(1.01**12-1))<1e-12);
  assert.ok(result.parameters.logVol<1e-12);
  assert.equal(result.sample.months,24);assert.equal(result.sample.from,'2000-02');
  const keys=JSON.stringify(result);
  assert.doesNotMatch(keys,/"(levels|returns|dates)":/);
  assert.equal(result.provenance.inputSha256.length,64);
  assert.throws(()=>calibrateEquity(equityCSV,{...metadata,returnType:'price'}),/總報酬/);
  assert.throws(()=>calibrateEquity(equityCSV,{...metadata,currency:'EUR'}),/USD/);
  assert.throws(()=>calibrateEquity(equityCSV,{...metadata,license:null}),/使用條件/);
  assert.throws(()=>calibrateEquity(equityCSV.replace('2000-02','2000-03'),metadata),/連續/);
});
