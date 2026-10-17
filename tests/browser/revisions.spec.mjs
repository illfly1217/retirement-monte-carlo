import {test,expect} from '@playwright/test';

async function parameters(page){
  if(await page.locator('#mobileParams').isVisible()&&!await page.locator('#run').isVisible())await page.locator('#mobileParams').click();
}
test.beforeEach(async({page})=>{await page.goto('./');await parameters(page);});

test('strategy settings only expose controls for the selected rule',async({page})=>{
  const details=page.getByText('提領策略細節',{exact:true}).locator('..');
  await expect(details).toBeHidden();
  await expect(page.locator('#guard')).toBeDisabled();
  await page.locator('#strategy').selectOption('gk');
  await expect(details).toBeVisible();
  await expect(details).toHaveAttribute('open','');
  await expect(page.locator('#guard')).toBeVisible();
  await expect(page.locator('#guard')).toBeEnabled();
  await expect(page.locator('#ceiling')).toBeHidden();
  await expect(page.locator('#ceiling')).toBeDisabled();
  await page.locator('#strategy').selectOption('dynamic');
  await expect(page.locator('#guard')).toBeHidden();
  await expect(page.locator('#guard')).toBeDisabled();
  await expect(page.locator('#ceiling')).toBeVisible();
  await page.locator('#strategy').selectOption('percent');
  await expect(details).toBeHidden();
  await page.locator('#strategy').selectOption('gk');
  // An invalid dormant field must not block an unrelated strategy.
  await page.locator('#guard').fill('999');
  await page.locator('#strategy').selectOption('fixed');
  expect(await page.locator('#parameters').evaluate(form=>form.checkValidity())).toBe(true);
  await page.locator('#run').click();
  await expect(page.locator('#statusText')).toContainText('計算完成');
});

test('currency presets, persistence, results and downloads use the selected currency',async({page})=>{
  await expect(page.locator('#currency')).toHaveValue('TWD');
  await expect(page.locator('#initial')).toHaveValue('30000000');
  await expect(page.locator('#inflation')).toHaveValue('2');
  await page.locator('#currency').selectOption('USD');
  await expect(page.locator('#initial')).toHaveValue('1000000');
  await expect(page.locator('#inflation')).toHaveValue('2.5');
  await page.locator('#initial').fill('1500000');
  await page.reload();await parameters(page);
  await expect(page.locator('#currency')).toHaveValue('USD');
  await expect(page.locator('#initial')).toHaveValue('1500000');
  await page.locator('#currency').selectOption('TWD');
  await expect(page.locator('#initial')).toHaveValue('30000000');
  await page.locator('#run').click();
  await expect(page.locator('#statusText')).toContainText('計算完成');
  await expect(page.locator('#spendingMetric')).toContainText('NT$');
  await expect(page.locator('#runMeta')).toContainText('TWD');
  await page.locator('#yearInspect').fill('10');
  await expect(page.locator('#assetChart .chart-tooltip')).toContainText('TWD');
  const download=page.waitForEvent('download');await page.locator('#exportCSV').click();
  expect((await download).suggestedFilename()).toContain('twd');
  await parameters(page);await page.locator('#currency').selectOption('USD');
  // Completed results keep their own currency until another run completes.
  await expect(page.locator('#spendingMetric')).toContainText('NT$');
});

test('existing USD settings migrate and reset preserves the chosen currency',async({page})=>{
  await page.evaluate(()=>{localStorage.removeItem('retirement-config-v2');localStorage.setItem('retirement-config-v1',JSON.stringify({initial:2500000,inflation:.03,strategy:'dynamic'}));});
  await page.reload();await parameters(page);
  await expect(page.locator('#currency')).toHaveValue('USD');
  await expect(page.locator('#initial')).toHaveValue('2500000');
  await expect(page.locator('#ceiling')).toBeVisible();
  await page.locator('#reset').click();
  await expect(page.locator('#currency')).toHaveValue('USD');
  await expect(page.locator('#initial')).toHaveValue('1000000');
  await expect(page.locator('#strategyDetails')).toBeHidden();
  await page.locator('#currency').selectOption('TWD');await page.locator('#initial').fill('40000000');
  await page.locator('#reset').click();await expect(page.locator('#initial')).toHaveValue('30000000');
});
