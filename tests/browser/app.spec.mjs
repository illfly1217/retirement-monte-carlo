import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {levelsCSV,returnsCSV,gapCSV} from '../fixtures.mjs';

async function parameters(page){
  if(await page.locator('#mobileParams').isVisible()&&!await page.locator('#run').isVisible())await page.locator('#mobileParams').click();
}
async function run(page){
  await parameters(page);await page.locator('#run').click();
  await expect(page.locator('#statusText')).toContainText('計算完成');
  await expect(page.locator('#error')).toBeHidden();
}
async function upload(page,text){
  await page.locator('#csvUpload').setInputFiles({name:'SYNTHETIC-qa.csv',mimeType:'text/csv',buffer:Buffer.from(text)});
}
test.beforeEach(async({page})=>{await page.goto('./');await expect(page.locator('#statusText')).toBeVisible();});

test('default form submits; Pages subpath loads modules and Worker; charts respond',async({page},info)=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.reload();
  await parameters(page);
  expect(await page.locator('#parameters').evaluate(e=>e.checkValidity())).toBe(true);
  await run(page);
  await expect(page.locator('#ruinMetric')).toHaveText('43.0%');
  await expect(page.locator('#lifestyleMetric')).toHaveText('57.0%');
  expect(requests.some(url=>url.endsWith('/retirement-monte-carlo/worker.js'))).toBe(true);
  for(const file of ['app.js','engine.js','data.js','charts.js','style.css'])expect(requests.some(url=>url.endsWith('/retirement-monte-carlo/'+file))).toBe(true);
  for(const url of requests.filter(x=>x.startsWith('http://127.0.0.1:4175')))expect(new URL(url).pathname.startsWith('/retirement-monte-carlo/')).toBe(true);
  await page.locator('#tails').check();await page.locator('#logScale').check();
  await page.locator('#yearInspect').fill('30');
  await expect(page.locator('#yearOutput')).toHaveText('第 30 年');
  await expect(page.locator('#assetChart .chart-tooltip')).toContainText('P99');
  await page.locator('#assetChart').press('ArrowRight');
  await expect(page.locator('#yearOutput')).toHaveText('第 31 年');
  await page.locator('#assetChart').press('Escape');
  await expect(page.locator('#assetChart .chart-tooltip')).toBeHidden();
  await page.locator('#pathView').selectOption('samples');
  await expect(page.locator('.legend')).toContainText('期末最好樣本');
  if(!info.project.name.startsWith('mobile')){await page.locator('#viewYears').fill('20');await expect(page.locator('#yearInspect')).toHaveAttribute('max','20');await expect(page.locator('#yearOutput')).toHaveText('第 20 年');}
  expect(await page.locator('#assetChart svg').getAttribute('viewBox')).toBeTruthy();
  expect(await page.locator('#assetChart').innerHTML()).not.toMatch(/NaN|Infinity/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('dashboard.png'),fullPage:true});
});

test('four strategies share paths; assumption comparison and 150-point search',async({page})=>{
  await page.getByRole('button',{name:'策略與情境',exact:true}).click();
  await page.locator('#compareRun').click();await expect(page.locator('#statusText')).toContainText('計算完成');
  await expect(page.locator('#compareTable tr')).toHaveCount(4);
  await expect(page.locator('#compareTable tr').nth(1)).toContainText('0.0%');
  await page.locator('#assumptionRun').click();await expect(page.locator('#statusText')).toContainText('計算完成');
  await expect(page.locator('#assumptionTable tr')).toHaveCount(2);
  await page.getByRole('button',{name:'提領率探索',exact:true}).click();
  await page.locator('#swrRun').click();await expect(page.locator('#statusText')).toContainText('計算完成');
  await expect(page.locator('#swrValue')).toHaveText('1.5%');
});

test('CSV errors, persistence, paired CPI, IID, VCMM, no-CPI replacement and clear',async({page})=>{
  await page.getByRole('button',{name:'資料與方法',exact:true}).click();
  await page.locator('#datasetName').fill('SYNTHETIC QA ONLY');
  await upload(page,gapCSV);await expect(page.locator('#error')).toContainText('連續');
  await upload(page,levelsCSV);await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#datasetSummary')).toContainText('24 個月');
  await page.reload();await page.getByRole('button',{name:'資料與方法',exact:true}).click();
  await expect(page.locator('#datasetSummary')).toContainText('SYNTHETIC QA ONLY');
  await run(page);
  await parameters(page);await page.locator('#sampling').selectOption('iid');await run(page);
  await parameters(page);await page.locator('#returnMode').selectOption('vcmm');await page.locator('#inflationModel').selectOption('lognormal');await run(page);
  await page.getByRole('button',{name:'策略與情境',exact:true}).click();
  await page.locator('#assumptionRun').click();await expect(page.locator('#statusText')).toContainText('計算完成');
  await expect(page.locator('#assumptionTable tr')).toHaveCount(3);
  await parameters(page);await page.locator('#inflationModel').selectOption('historical');
  // Close mobile drawer by choosing the tab via the top bar, then use the visible page.
  if(await page.locator('#mobileParams').isVisible())await page.locator('#mobileParams').click();
  await page.getByRole('button',{name:'資料與方法',exact:true}).click();
  await upload(page,returnsCSV);
  await expect(page.locator('#inflationModel')).toHaveValue('constant');
  await page.locator('#clearData').click();await expect(page.locator('#datasetSummary')).toContainText('沒有匯入');
  await page.reload();await page.getByRole('button',{name:'資料與方法',exact:true}).click();
  await expect(page.locator('#datasetSummary')).toContainText('沒有匯入');
});

test('downloads contain real results and snapshot omits raw monthly series; stale labels stay coherent',async({page})=>{
  await run(page);
  let download=page.waitForEvent('download');await page.locator('#exportCSV').click();
  const csv=await readFile(await (await download).path(),'utf8');expect(csv.trim().split('\n')).toHaveLength(52);expect(csv).toContain('asset_p99');
  download=page.waitForEvent('download');await page.locator('#exportJSON').click();
  const json=JSON.parse(await readFile(await (await download).path(),'utf8'));
  expect(json.result.ruined).toBe(4304);expect(json.config.seed).toBe(741);expect(json.timing.marketCached).toBe(false);expect(JSON.stringify(json)).not.toContain('"returns":');
  await parameters(page);await page.locator('#initial').fill('2000000');await page.locator('#years').fill('40');
  await expect(page.locator('#spendingMetric')).toHaveText('$40,000');await expect(page.locator('#horizon')).toHaveText('50 年');
  if(await page.locator('#mobileParams').isVisible())await page.locator('#mobileParams').click();
  await page.getByRole('button',{name:'提領率探索',exact:true}).click();await page.locator('#spendingFloor').fill('70');
  await page.reload();await page.getByRole('button',{name:'提領率探索',exact:true}).click();await expect(page.locator('#spendingFloor')).toHaveValue('70');
});

test('100k simulation can be cancelled and rerun',async({page},info)=>{
  test.skip(info.project.name.startsWith('mobile'),'100k is measured on desktop; emulation does not validate phone memory.');
  await page.locator('#paths').selectOption('100000');await page.locator('#run').click();
  await page.locator('#cancel').click();await expect(page.locator('#statusText')).toContainText('已停止');
  await run(page);await expect(page.locator('#statusText')).toContainText('100,000');await expect(page.locator('#exportJSON')).toBeEnabled();
});
