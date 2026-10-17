import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS, prepareMarket} from '../dist/engine.js';
import {datasetForCurrency} from '../dist/datasets.js';

test('all independent inflation modes preserve the same stock paths; zero volatility equals fixed inflation', () => {
  for (const currency of ['TWD', 'USD']) for (const seed of [19, 741]) {
    const c = {...DEFAULTS, currency, paths: 100, years: 3, seed, inflationModel: 'constant'};
    const data = datasetForCurrency(currency), fixed = prepareMarket(c, data);
    for (const inflationVol of [0, .03]) {
      const stochastic = prepareMarket({...c, inflationModel: 'lognormal', inflationVol}, data);
      assert.deepEqual(stochastic.factors, fixed.factors, `stock paths changed: ${currency}/${seed}/${inflationVol}`);
      if (inflationVol === 0) assert.deepEqual(stochastic.inflation, fixed.inflation);
      else assert.notDeepEqual(stochastic.inflation, fixed.inflation);
    }
    assert.deepEqual(prepareMarket({...c, inflationModel: 'cpi'}, data).factors, fixed.factors);
  }
});

for (const hasGap of [false, true]) test(`CPI sampling preserves the sample log mean with ${hasGap ? 'a missing-month boundary' : 'a finite sample boundary'}`, () => {
  // Concentrate inflation at segment starts: boundary underweighting cannot hide
  // behind a nearly flat real-world CPI sample. Observations are synthetic.
  const dates = Array.from({length: 24}, (_, i) => {
    const serial = 2000 * 12 + i + (hasGap && i >= 10 ? 1 : 0);
    return `${Math.floor(serial / 12)}-${String(serial % 12 + 1).padStart(2, '0')}`;
  });
  const monthly = dates.map((_, i) => i === 0 || hasGap && i === 10 ? .01 : 0);
  const data = {returns: [], inflation: [], cpi: {currency: 'USD', dates, inflation: monthly}};
  const expected = monthly.reduce((s, v) => s + Math.log1p(v), 0) / monthly.length * 12;
  for (const block of [1, 24, 120]) {
    const c = {...DEFAULTS, paths: 4000, years: 20, inflationModel: 'cpi', block};
    const market = prepareMarket(c, data);
    const rates = Array.from({length: c.paths}, (_, p) => {
      let total = 0;
      for (let y = 0; y < c.years; y++) total += Math.log(market.inflation[p * c.years + y]);
      return total / c.years;
    });
    const mean = rates.reduce((a, b) => a + b, 0) / c.paths;
    const se = Math.sqrt(rates.reduce((s, v) => s + (v - mean) ** 2, 0) / (c.paths - 1) / c.paths);
    assert.ok(Math.abs(mean - expected) < 6 * se + 1e-12, `block=${block}: ${mean} versus ${expected}, SE=${se}`);
  }
});
