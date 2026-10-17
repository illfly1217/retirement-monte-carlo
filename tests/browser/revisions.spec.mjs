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
