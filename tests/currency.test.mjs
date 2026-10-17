import test from 'node:test';
import assert from 'node:assert/strict';
import {currencyDefaults} from '../dist/currency.js';
import {money} from '../dist/charts.js';
import {validate} from '../dist/engine.js';

test('currency presets are complete valid scenarios with distinct amounts and inflation',()=>{
  const twd=currencyDefaults(),usd=currencyDefaults('USD');
  assert.equal(twd.currency,'TWD');assert.equal(twd.initial,30000000);assert.equal(twd.inflation,.02);
  assert.equal(usd.currency,'USD');assert.equal(usd.initial,1000000);assert.equal(usd.inflation,.025);
  validate(twd);validate(usd);
  assert.throws(()=>currencyDefaults('EUR'),/幣種/);
  assert.throws(()=>validate({...twd,currency:'EUR'}),/幣種/);
});
test('all currency formats retain an explicit symbol and compact local units',()=>{
  assert.equal(money(1200000,false,'TWD'),'NT$1,200,000');
  assert.match(money(30000000,true,'TWD'),/^NT\$.*萬/);
  assert.equal(money(40000,false,'USD'),'$40,000');
  assert.equal(money(NaN,false,'TWD'),'—');
});
