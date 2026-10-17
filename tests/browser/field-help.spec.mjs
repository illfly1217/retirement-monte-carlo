import {test,expect} from '@playwright/test';

async function parameters(page){
  if(await page.locator('#mobileParams').isVisible())await page.locator('#mobileParams').click();
}
async function aligned(page,left,right){
  const a=await page.locator(left).boundingBox(),b=await page.locator(right).boundingBox();
  expect(Math.abs(a.y-b.y)).toBeLessThan(1);
  expect(Math.abs(a.height-b.height)).toBeLessThan(1);
  expect(Math.abs(a.width-b.width)).toBeLessThan(1);
}

test.beforeEach(async({page})=>{await page.goto('./');await parameters(page);});

test('paired parameter controls align across inflation modes and narrow screens',async({page},info)=>{
  const width=info.project.name.startsWith('mobile')?320:1100;
  await page.setViewportSize({width,height:900});
  for(const currency of ['TWD','USD']){
    await page.locator('#currency').selectOption(currency);
    for(const mode of ['preset','cpi','lognormal','constant']){
      await page.locator('#inflationModel').selectOption(mode);
      await aligned(page,'#inflation',['preset','constant'].includes(mode)?'#inflationVolNA':'#inflationVol');
    }
  }
  for(const [strategy,left,right] of [['gk','#guard','#adjust'],['dynamic','#ceiling','#floor']]){
    await page.locator('#strategy').selectOption(strategy);
    await aligned(page,left,right);
  }
  await page.locator('#costSettings').evaluate(element=>element.open=true);
  await aligned(page,'#fee','#drag');
  await page.locator('#returnMode').selectOption('vcmm');
  await page.locator('#vcmmFields').evaluate(element=>element.open=true);
  await aligned(page,'#longRun','#transition');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('field explanations support hover, keyboard, taps and dismissal without submitting',async({page},info)=>{
  const tooltip=page.getByRole('tooltip');
  await page.locator('#strategy').selectOption('gk');
  const guard=page.getByRole('button',{name:'護欄偏離說明',exact:true});
  await guard.scrollIntoViewIfNeeded();
  if(info.project.name.startsWith('mobile'))await guard.tap();
  else await guard.hover();
  await expect(tooltip).toContainText('3.2% 與 4.8%');
  const box=await tooltip.boundingBox(),viewport=page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
  if(!info.project.name.startsWith('mobile')){
    await tooltip.hover();await expect(tooltip).toBeVisible();
    await page.mouse.move(viewport.width-10,10);await expect(tooltip).toBeHidden();
  }
  await guard.focus();await expect(tooltip).toBeVisible();
  await guard.press('Escape');await expect(tooltip).toBeHidden();
  await guard.press('Tab');await expect(page.locator('#guard')).toBeFocused();
  await page.locator('#guard').press('Shift+Tab');await expect(guard).toBeFocused();
  await expect(tooltip).toBeVisible();
  await guard.click();await expect(tooltip).toBeVisible();
  await guard.click();await expect(tooltip).toBeHidden();
  await guard.click();await page.locator('#guard').click();await expect(tooltip).toBeHidden();
  await page.locator('#strategy').selectOption('dynamic');
  await page.getByRole('button',{name:'動態上限說明',exact:true}).click();
  await expect(tooltip).toContainText('扣除通膨後');
  await page.locator('#inflationModel').selectOption('cpi');
  await expect(tooltip).toBeHidden();
  await page.getByRole('button',{name:'通膨對數波動說明',exact:true}).click();
  await expect(tooltip).toContainText('年化標準差');
  await page.screenshot({path:info.outputPath('inflation-help.png')});
  await page.locator('.sidebar').evaluate(element=>element.scrollTop=0);
  await expect(tooltip).toBeHidden();
  await expect(page.locator('#statusText')).toContainText('設定你的退休計畫');
  await expect(page.locator('#guard')).toHaveValue('20');
  expect(await page.locator('#parameters').evaluate(form=>form.checkValidity())).toBe(true);
});
