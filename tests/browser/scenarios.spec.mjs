import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {EQUITY_PARAMETERS} from '../../dist/equity-parameters.js';

async function parameters(page){if(await page.locator('#mobileParams').isVisible()&&!await page.locator('#run').isVisible())await page.locator('#mobileParams').click();}
async function snapshot(page){const pending=page.waitForEvent('download');await page.locator('#exportJSON').click();return JSON.parse(await readFile(await (await pending).path(),'utf8'));}
test.beforeEach(async({page})=>{await page.goto('./');await parameters(page);});

test('built-in return values stay visible and locked while custom drafts survive switches and reloads',async({page},info)=>{
  await expect(page.locator('#returnMode')).toHaveValue('msci');
  await expect(page.locator('#cagr')).toHaveValue('7.89');
  await expect(page.locator('#vol')).toHaveValue('15.97');
  await expect(page.locator('#cagr')).toHaveAttribute('readonly','');
  await expect(page.locator('#vol')).toHaveAttribute('readonly','');
  await expect(page.locator('#returnPresetNote')).toContainText('1997-02 — 2026-09');
  await page.locator('#returnMode').selectOption('custom');
  await page.locator('#cagr').fill('');await page.locator('#cagr').pressSequentially('6.2');
  await page.locator('#vol').fill('');await page.locator('#vol').pressSequentially('21.3');
  await expect(page.locator('#cagr')).toHaveValue('6.2');await expect(page.locator('#vol')).toHaveValue('21.3');
  await page.locator('#returnMode').selectOption('vcmm');
  await expect(page.locator('#cagr')).toHaveValue('5.089');await expect(page.locator('#vol')).toHaveValue('18.00');
  for(const id of ['cagr','vol','usWeight','longRun','transition'])await expect(page.locator('#'+id)).toHaveAttribute('readonly','');
  await expect(page.locator('#returnPresetNote')).toContainText('研究假設');
  await page.locator('#cagr').press('ArrowUp');await expect(page.locator('#cagr')).toHaveValue('5.089');
  await page.screenshot({path:info.outputPath('locked-vcmm.png'),fullPage:true});
  await page.reload();await parameters(page);
  await expect(page.locator('#returnMode')).toHaveValue('vcmm');
  await page.locator('#returnMode').selectOption('custom');
  await expect(page.locator('#cagr')).toHaveValue('6.2');await expect(page.locator('#vol')).toHaveValue('21.3');
  expect(await page.locator('#cagr').evaluate(input=>input.readOnly)).toBe(false);
  expect(await page.locator('#parameters').evaluate(form=>form.checkValidity())).toBe(true);
});

test('inflation presets and CPI statistics are read-only and custom inflation is restored',async({page},info)=>{
  await expect(page.locator('#inflationModel')).toHaveValue('preset');
  await expect(page.locator('#inflation')).toHaveValue('2.00');
  await expect(page.locator('#inflation')).toHaveAttribute('readonly','');
  await expect(page.locator('#inflationVolNA')).toContainText('不適用');
  await page.locator('#inflationModel').selectOption('lognormal');
  await page.locator('#inflation').fill('');await page.locator('#inflation').pressSequentially('3.3');
  await page.locator('#inflationVol').fill('');await page.locator('#inflationVol').pressSequentially('1.7');
  await expect(page.locator('#inflation')).toHaveValue('3.3');await expect(page.locator('#inflationVol')).toHaveValue('1.7');
  await page.locator('#inflationModel').selectOption('cpi');
  for(const id of ['inflation','inflationVol'])await expect(page.locator('#'+id)).toHaveAttribute('readonly','');
  await expect(page.locator('#inflationPresetNote')).toContainText('歷史樣本統計');
  await expect(page.locator('#inflationPresetNote')).toContainText('並非固定通膨率');
  await expect(page.locator('#inflationModelState')).toContainText('通膨與股票分開模擬');
  await expect(page.locator('#blockField')).toBeVisible();
  await page.screenshot({path:info.outputPath('cpi-statistics.png'),fullPage:true});
  await page.reload();await parameters(page);
  await page.locator('#inflationModel').selectOption('lognormal');
  await expect(page.locator('#inflation')).toHaveValue('3.3');await expect(page.locator('#inflationVol')).toHaveValue('1.7');
  await page.locator('#currency').selectOption('USD');
  await expect(page.locator('#inflationModel')).toHaveValue('preset');await expect(page.locator('#inflation')).toHaveValue('2.50');
  await page.locator('#reset').click();await expect(page.locator('#inflation')).toHaveValue('2.50');
});

test('sampling status explains separate stock and CPI methods without unusable selectors',async({page})=>{
  await expect(page.locator('select#sampling')).toHaveCount(0);
  await expect(page.locator('#samplingMethodsLink')).toBeVisible();
  await page.locator('#inflationModel').selectOption('cpi');
  await expect(page.locator('#samplingMethodsLink')).toContainText('模型與資料說明');
  await page.locator('#samplingMethodsLink').click();
  await expect(page.locator('#data')).toBeVisible();await expect(page.locator('#samplingMethods')).toHaveAttribute('open','');
  await expect(page.locator('#samplingMethods')).toContainText('不是準確度等級');
  await expect(page.locator('#samplingMethods')).toContainText('不保留原月份連續結構');
  await expect(page.locator('#samplingMethods')).toContainText('樣本中從未出現');
  await expect(page.locator('#inflationSamplingMethod')).toContainText('不表示股票也改用歷史抽樣');
});

test('MSCI simulation and exports use exact calibrated values while showing rounded summaries',async({page})=>{
  await page.locator('#years').fill('3');await page.locator('#paths').selectOption('1000');
  await page.locator('#inflationModel').selectOption('cpi');
  await page.locator('#run').click();await expect(page.locator('#statusText')).toContainText('計算完成');
  await expect(page.locator('#runMeta')).toContainText('股票：參數模型');await expect(page.locator('#runMeta')).toContainText('CPI 獨立區塊抽樣');
  const saved=await snapshot(page);
  expect(saved.config.cagr).toBe(EQUITY_PARAMETERS.parameters.cagr);
  expect(saved.config.vol).toBe(EQUITY_PARAMETERS.parameters.logVol);
  expect(saved.scenarios.equity.sample.months).toBe(356);
  expect(saved.scenarios.equity.version).toBe(EQUITY_PARAMETERS.version);
  expect(saved.scenarios.inflation.sampleStatistics.cagr).toBe(saved.config.inflation);
  expect(JSON.stringify(saved)).not.toContain('"returns":');expect(JSON.stringify(saved)).not.toContain('"levels":');
  const pending=page.waitForEvent('download');await page.locator('#exportCSV').click();
  const csv=(await readFile(await (await pending).path(),'utf8')).trim().split('\n').map(line=>line.split(','));
  const row=Object.fromEntries(csv[0].map((key,i)=>[key,csv[1][i]]));
  expect(row.return_scenario).toBe('msci');expect(row.equity_sampling).toBe('parametric');
  expect(row.inflation_scenario).toBe('cpi');expect(row.inflation_rate_kind).toBe('sample-statistic');
  expect(Number(row.cagr)).toBe(saved.config.cagr);expect(Number(row.log_vol)).toBe(saved.config.vol);
});

test('legacy custom inflation stays editable and VCMM restores the current preset',async({page})=>{
  await page.evaluate(()=>localStorage.setItem('retirement-config-v2',JSON.stringify({currency:'USD',returnMode:'vcmm',inflationModel:'constant',inflation:.033,cagr:.29,vol:.7,usWeight:0,longRun:.2,transition:1})));
  await page.reload();await parameters(page);
  await expect(page.locator('#inflationModel')).toHaveValue('constant');await expect(page.locator('#inflation')).toHaveValue('3.3');
  expect(await page.locator('#inflation').evaluate(input=>input.readOnly)).toBe(false);
  await expect(page.locator('#cagr')).toHaveValue('5.089');await expect(page.locator('#vol')).toHaveValue('18.00');
  await expect(page.locator('#usWeight')).toHaveValue('63');await expect(page.locator('#longRun')).toHaveValue('7');
});
