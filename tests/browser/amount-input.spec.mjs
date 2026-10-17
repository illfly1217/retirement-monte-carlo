import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function parameters(page) {
  if (await page.locator('#mobileParams').isVisible() && !await page.locator('#run').isVisible()) await page.locator('#mobileParams').click();
}

async function snapshot(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#exportJSON').click();
  return JSON.parse(await readFile(await (await pending).path(), 'utf8'));
}

test.beforeEach(async ({page}) => {await page.goto('./'); await parameters(page);});

test('asset digits, selections and deletion beside separators remain editable', async ({page}, info) => {
  const input = page.locator('#initial');
  await expect(input).toHaveValue('30,000,000');
  await expect(input).toHaveAttribute('inputmode', 'numeric');
  await input.locator('..').screenshot({path: info.outputPath('asset-input.png')});
  await input.fill('');
  await input.pressSequentially('30000000');
  await expect(input).toHaveValue('30,000,000');
  await input.evaluate(element => element.setSelectionRange(1, 1));
  await input.press('5');
  await expect(input).toHaveValue('350,000,000');
  expect(await input.evaluate(element => element.selectionStart)).toBe(2);
  await input.press('Backspace');
  await expect(input).toHaveValue('30,000,000');
  expect(await input.evaluate(element => element.selectionStart)).toBe(1);
  await input.evaluate(element => element.setSelectionRange(3, 3));
  await input.press('Backspace');
  await expect(input).toHaveValue('3,000,000');
  expect(await input.evaluate(element => element.selectionStart)).toBe(1);
  await input.fill('30000000');
  await input.evaluate(element => element.setSelectionRange(2, 2));
  await input.press('Delete');
  await expect(input).toHaveValue('3,000,000');
  await input.fill('30000000');
  await input.evaluate(element => element.setSelectionRange(3, 6));
  await input.press('5');
  await expect(input).toHaveValue('305,000');
  expect(await input.evaluate(element => element.selectionStart)).toBe(3);
  await input.fill('1000000000000');
  await expect(input).toHaveValue('1,000,000,000,000');
  expect(await input.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('pasted assets are validated without corrupting the last saved amount', async ({page}) => {
  const input = page.locator('#initial');
  for (const text of ['45000000', '45,000,000']) {
    await input.selectText();
    // Exercise the browser's post-paste input event without changing the user's clipboard.
    await input.evaluate((element, text) => {
      element.setRangeText(text, element.selectionStart, element.selectionEnd, 'end');
      element.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertFromPaste', data: text}));
    }, text);
    await expect(input).toHaveValue('45,000,000');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('retirement-config-v2')).initial)).toBe(45000000);
    await expect(page.locator('#spendingMetric')).toHaveText('NT$1,800,000');
  }
  for (const text of ['', '1,2,3', '12.5', '-100', '1e6', '0', '1000000000001']) {
    await input.fill(text);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#initialError')).toBeVisible();
    expect(await page.locator('#parameters').evaluate(form => form.checkValidity())).toBe(false);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('retirement-config-v2')).initial)).toBe(45000000);
    await expect(page.locator('#spendingMetric')).toHaveText('—');
  }
  await page.locator('#run').click();
  await expect(page.locator('#statusText')).not.toContainText('計算完成');
  await page.reload(); await parameters(page);
  await expect(input).toHaveValue('45,000,000');
  await expect(page.locator('#initialError')).toBeHidden();
});

test('raw and grouped amounts produce the same numeric simulation and exports', async ({page}) => {
  await page.locator('#returnMode').selectOption('custom');
  await page.locator('#inflationModel').selectOption('constant');
  await page.locator('#years').fill('1');
  await page.locator('#paths').selectOption('1000');
  for (const id of ['cagr', 'vol', 'fee', 'inflation']) await page.locator('#' + id).fill('0');
  const snapshots = [];
  for (const text of ['30000000', '30,000,000']) {
    await parameters(page);
    await page.locator('#initial').fill(text);
    await page.locator('#run').click();
    await expect(page.locator('#statusText')).toContainText('計算完成');
    await expect(page.locator('#error')).toBeHidden();
    await expect(page.locator('#spendingMetric')).toHaveText('NT$1,200,000');
    snapshots.push(await snapshot(page));
  }
  for (const saved of snapshots) {
    expect(saved.config.initial).toBe(30000000);
    expect(saved.result.terminal[3]).toBe(28800000);
  }
  expect(snapshots[0].config).toEqual(snapshots[1].config);
  // Run time is measured separately from the reproducible numerical results.
  const results = snapshots.map(({result: {elapsed, ...numerical}}) => numerical);
  expect(results[0]).toEqual(results[1]);
  const pending = page.waitForEvent('download');
  await page.locator('#exportCSV').click();
  const csv = await readFile(await (await pending).path(), 'utf8');
  expect(csv).toContain('0,TWD,30000000,');
  expect(csv).toContain('1,TWD,28800000,');
});
