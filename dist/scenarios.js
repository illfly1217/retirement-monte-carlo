import {VCMM, vcmmRate, statistics} from './data.js';
import {EQUITY_PARAMETERS} from './equity-parameters.js';

export const SCENARIO_VERSION = '2026-10-17.2';
export const VCMM_PRESET = Object.freeze({cagr: vcmmRate(.63), vol: .18, usWeight: .63, longRun: .07, transition: 10});
export const INFLATION_PRESETS = Object.freeze({
  TWD: Object.freeze({inflation: .02, inflationVol: .01}),
  USD: Object.freeze({inflation: .025, inflationVol: .015}),
});
export const isCustomReturn = mode => mode === 'custom';
export const isCustomInflation = mode => ['constant', 'lognormal'].includes(mode);

// Both the interface and Worker resolve the same immutable assumptions.
export function resolveScenario(config, dataset) {
  const c = {...config};
  if (c.returnMode === 'vcmm') Object.assign(c, VCMM_PRESET);
  if (c.returnMode === 'msci') {
    if (EQUITY_PARAMETERS.status !== 'ready') throw Error('MSCI 歷史估計參數尚未備妥，請選 VCMM 或自訂。');
    Object.assign(c, {cagr: EQUITY_PARAMETERS.parameters.cagr, vol: EQUITY_PARAMETERS.parameters.logVol});
  }
  if (c.inflationModel === 'preset') {
    const preset = INFLATION_PRESETS[c.currency];
    if (!preset) throw Error('未知幣種。');
    c.inflation = preset.inflation;
  }
  if (['constant', 'preset'].includes(c.inflationModel)) c.inflationVol = 0;
  if (c.inflationModel === 'cpi' && dataset?.cpi?.inflation?.length >= 2) {
    const summary = statistics(dataset.cpi.inflation);
    c.inflation = summary.cagr;
    c.inflationVol = summary.logVol;
  }
  return c;
}

export function scenarioMetadata(config, dataset) {
  const c = resolveScenario(config, dataset);
  const equity = {
    mode: c.returnMode, sampling: c.sampling,
    parameters: {cagr: c.cagr, logVol: c.vol},
    definition: 'nominal geometric drift; annualized monthly log-return standard deviation',
  };
  if (c.returnMode === 'vcmm') Object.assign(equity, {
    source: VCMM.url, version: `${VCMM.asOf}/${SCENARIO_VERSION}`,
    official: {asOf: VCMM.asOf, published: VCMM.published, us: VCMM.us, exUS: VCMM.exUS},
    researchAssumptions: {usWeight: c.usWeight, logVol: c.vol, longRun: c.longRun, transition: c.transition},
    termStructure: 'Years 1–10 use the derived regional midpoint anchor; then log drift transitions to the research long-run assumption.',
  });
  if (c.returnMode === 'msci') Object.assign(equity, {source: EQUITY_PARAMETERS.source, version: EQUITY_PARAMETERS.version, sample: EQUITY_PARAMETERS.sample, method: EQUITY_PARAMETERS.method, usageReview: EQUITY_PARAMETERS.usageReview});
  const inflation = {mode: c.inflationModel, currency: c.currency};
  if (c.inflationModel === 'cpi') {
    const source = dataset.cpi;
    Object.assign(inflation, {
      sampling: 'independent stationary blocks', blockMonths: c.block,
      boundaryTreatment: 'Restart weights balance segment starts and internal months to preserve uniform marginal sampling; never continue across gaps or sample ends.',
      source: source.source, version: source.version, from: source.dates[0], to: source.dates.at(-1),
      sampleStatistics: {cagr: c.inflation, logVol: c.inflationVol, months: source.inflation.length},
      note: 'Sample statistics describe the dataset; simulation resamples monthly inflation, not a fixed rate.',
    });
  } else Object.assign(inflation, {
    sampling: c.inflationModel === 'lognormal' ? 'independent normal log inflation' : 'constant',
    parameters: {geometricRate: c.inflation, logVol: c.inflationVol},
    version: c.inflationModel === 'preset' ? SCENARIO_VERSION : null,
    basis: c.inflationModel === 'preset' ? 'Project planning assumption; not an official forecast.' : 'User assumptions.',
  });
  return {version: SCENARIO_VERSION, equity, inflation};
}
