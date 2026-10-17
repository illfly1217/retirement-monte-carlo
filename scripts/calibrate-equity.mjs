import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {parseCSV} from '../dist/data.js';

// A maintainer-only, offline calculation. No observations are copied to the artifact.
export function calibrateEquity(csv, metadata) {
  if (metadata.indexCode !== '664204' || metadata.currency !== 'USD' || !['net-total-return', 'gross-total-return'].includes(metadata.returnType)) throw Error('需要 MSCI ACWI IMI 664204、USD、明確 Net／Gross 總報酬資料。');
  if (!/^https:\/\//.test(metadata.sourceUrl || '') || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.retrieved || '')) throw Error('缺少可查核的來源及擷取日期。');
  if (!metadata.license?.publicDerivedParametersPermission || !metadata.license?.rawRedistributionPermission || !metadata.license?.termsUrls?.length) throw Error('須分別記錄彙總參數與原始序列的使用條件查核，不自動視為已授權。');
  const data = parseCSV(csv, {name: 'MSCI ACWI IMI', kind: metadata.returnType === 'net-total-return' ? 'index-net' : 'index-gross'});
  if (data.inflation.length) throw Error('股票參數校準不混入 CPI。');
  if (data.dates.at(-1) >= metadata.retrieved.slice(0, 7)) throw Error('只接受擷取日前已結束的完整月份。');
  const hash = createHash('sha256').update(csv).digest('hex');
  return {
    status: 'ready', name: 'MSCI ACWI IMI', version: `${metadata.retrieved}/${hash.slice(0, 12)}`,
    parameters: {cagr: data.stats.cagr, logVol: data.stats.logVol},
    sample: {from: data.dates[0], to: data.dates.at(-1), months: data.stats.months, currency: 'USD', returnBasis: metadata.returnType === 'net-total-return' ? 'Net' : 'Gross', dividends: 'reinvested', backtestBefore: '2007-06-05'},
    source: metadata.sourceUrl, retrieved: metadata.retrieved,
    provenance: {indexCode: metadata.indexCode, sourceSha256: metadata.sourceSha256 || null, inputSha256: hash},
    method: {version: 'monthly-log-sample-v1', cagr: 'expm1(12 * mean(log1p(r)))', logVol: 'sqrt(12) * sample_sd(log1p(r)), n-1', annualization: '12 months; no serial-correlation adjustment'},
    diagnostics: {arithmeticAnnual: data.stats.arithmeticAnnual, logMeanAnnual: data.stats.logMeanAnnual, lag1: data.stats.autocorrelation},
    usageReview: {rawRedistributionPermission: metadata.license.rawRedistributionPermission, publicDerivedParametersPermission: metadata.license.publicDerivedParametersPermission, termsUrls: metadata.license.termsUrls, note: 'This record documents the review; it does not grant a license. Raw observations are excluded.'},
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const {values} = parseArgs({options: {input: {type: 'string'}, metadata: {type: 'string'}, output: {type: 'string', default: 'local-data/msci/equity-parameters.js'}, source: {type: 'string'}}});
  if (!values.input || !values.metadata) throw Error('用法：node scripts/calibrate-equity.mjs --input LOCAL.csv --metadata LOCAL.json [--source ORIGINAL.xls] [--output OUTPUT.js]');
  const metadata = JSON.parse(await readFile(values.metadata, 'utf8'));
  if (values.source && createHash('sha256').update(await readFile(values.source)).digest('hex') !== metadata.sourceSha256) throw Error('原始檔雜湊與來源紀錄不符。');
  const artifact = calibrateEquity(await readFile(values.input, 'utf8'), metadata);
  await writeFile(values.output, '// Generated summary only. No original monthly observations. See usageReview before publication.\nexport const EQUITY_PARAMETERS = Object.freeze(' + JSON.stringify(artifact, null, 2) + ');\n');
  console.log(JSON.stringify({output: values.output, version: artifact.version, sample: artifact.sample, parameters: artifact.parameters, publication: artifact.usageReview.publicDerivedParametersPermission}));
}
