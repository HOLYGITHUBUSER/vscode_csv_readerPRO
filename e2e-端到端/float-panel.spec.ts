/**
 * E2E for the right-bottom floating panel (#csvFloatPanel): global filter
 * input + row-height cycle button + clear-filter button.
 *
 * Runs real Chromium clicks / keyboard input against the real media-媒体/main.js.
 * Expected contract (matches CsvEditorProvider's message handler):
 *   - typing into #csvGlobalSearch → postMessage type:'filterSort' (debounced)
 *   - clicking #csvRowHeightToggle → postMessage type:'setRowHeightMode',
 *     cycling data-mode: compact → firstline → wrap → compact
 *   - after typing a filter, #csvClearFilter becomes visible; clicking it
 *     clears the input and fires another filterSort with empty query
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { writeHarnessHtml } from './harness';

const cfg = {
  columns: 3,
  addSerialIndex: true,
  fontSize: 14,
  rowHeightMode: 'firstline' as const,
  header: { absRow: 0, cells: ['Name', 'Age', 'City'] },
  body: [
    { absRow: 1, cells: ['Alice', '30', 'NYC'] },
    { absRow: 2, cells: ['Bob',   '25', 'LA']  },
    { absRow: 3, cells: ['Cindy', '28', 'SF']  },
  ],
};

let harnessDir: string;
test.afterAll(() => {
  if (harnessDir) try { fs.rmSync(harnessDir, { recursive: true, force: true }); } catch {}
});

test('floating panel: filter input types and fires filterSort', async ({ page }) => {
  const { url, dir } = writeHarnessHtml(cfg);
  harnessDir = dir;

  const pageErrors: string[] = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(`[console.error] ${m.text()}`); });

  await page.goto(url);
  await expect(page.locator('#csv-root')).toBeVisible();
  expect(pageErrors).toEqual([]);

  await page.screenshot({
    path: 'e2e-端到端/test-results/float-panel-initial.png',
    fullPage: true,
  });

  const input = page.locator('#csvGlobalSearch');
  await expect(input).toBeVisible();

  // Real key events → should produce at least one filterSort message.
  await input.click();
  await input.fill('Alice');
  // Allow any debounce inside main.js to fire.
  await page.waitForTimeout(400);

  const posted = await page.evaluate(() => (window as any).__posted as any[]);
  const filterMsgs = posted.filter(m => m && m.type === 'filterSort');
  expect(
    filterMsgs.length,
    `Expected typing into #csvGlobalSearch to emit filterSort; got messages: ${JSON.stringify(posted)}`,
  ).toBeGreaterThan(0);

  // Last filterSort should carry the current text ("Alice") somewhere in its payload.
  const last = filterMsgs[filterMsgs.length - 1];
  const payloadStr = JSON.stringify(last);
  expect(payloadStr.toLowerCase()).toContain('alice');
});

test('floating panel: row-height toggle cycles compact → firstline → wrap', async ({ page }) => {
  const { url, dir } = writeHarnessHtml({ ...cfg, rowHeightMode: 'compact' });
  harnessDir = dir;

  const pageErrors: string[] = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(`[console.error] ${m.text()}`); });

  await page.goto(url);
  await expect(page.locator('#csv-root')).toBeVisible();
  expect(pageErrors).toEqual([]);

  const btn = page.locator('#csvRowHeightToggle');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute('data-mode', 'compact');

  // Click 1: compact → firstline
  await btn.click();
  await expect(btn).toHaveAttribute('data-mode', 'firstline');

  // Click 2: firstline → wrap
  await btn.click();
  await expect(btn).toHaveAttribute('data-mode', 'wrap');

  // Click 3: wrap → compact (full cycle)
  await btn.click();
  await expect(btn).toHaveAttribute('data-mode', 'compact');

  // Each click should have emitted a setRowHeightMode message with the new mode.
  const posted = await page.evaluate(() => (window as any).__posted as any[]);
  const modeMsgs = posted.filter(m => m && m.type === 'setRowHeightMode');
  expect(modeMsgs.length).toBeGreaterThanOrEqual(3);
  expect(modeMsgs.slice(-3).map(m => m.mode)).toEqual(['firstline', 'wrap', 'compact']);
});

test('filterSortResult message from host rewrites tbody', async ({ page }) => {
  const { url, dir } = writeHarnessHtml(cfg);
  harnessDir = dir;

  await page.goto(url);
  await expect(page.locator('#csv-root')).toBeVisible();

  // Before: 3 rows (Alice/Bob/Cindy)
  await expect(page.locator('#csv-root tbody tr')).toHaveCount(3);

  // Simulate host posting a filtered result with only one row.
  await page.evaluate(() => {
    const msg = {
      type: 'filterSortResult',
      addSerialIndex: true,
      sortCol: -1,
      sortDir: null,
      rows: [
        {
          absRow: 1,
          displayIdx: 1,
          cells: [
            { value: 'Alice', rendered: 'Alice' },
            { value: '30',    rendered: '30' },
            { value: 'NYC',   rendered: 'NYC' },
          ],
        },
      ],
    };
    window.postMessage(msg, '*');
  });

  await expect(page.locator('#csv-root tbody tr')).toHaveCount(1);
  await expect(page.locator('#csv-root tbody td[data-col="0"]').first()).toContainText('Alice');
  // Sort indicator cleared.
  await expect(page.locator('th[data-col="0"]')).not.toHaveClass(/sort-asc/);
  await expect(page.locator('th[data-col="0"]')).not.toHaveClass(/sort-desc/);
});

test('floating panel: clear button shows after typing and resets filter', async ({ page }) => {
  const { url, dir } = writeHarnessHtml(cfg);
  harnessDir = dir;

  await page.goto(url);
  await expect(page.locator('#csv-root')).toBeVisible();

  const input = page.locator('#csvGlobalSearch');
  const clear = page.locator('#csvClearFilter');

  // Initially hidden.
  await expect(clear).toBeHidden();

  await input.fill('Bob');
  await page.waitForTimeout(400);
  await expect(clear).toBeVisible();

  await clear.click();
  await expect(input).toHaveValue('');
  // After clear, at least one filterSort with empty-ish payload should exist.
  const posted = await page.evaluate(() => (window as any).__posted as any[]);
  const filterMsgs = posted.filter(m => m && m.type === 'filterSort');
  expect(filterMsgs.length).toBeGreaterThan(0);
  const last = filterMsgs[filterMsgs.length - 1];
  // globalSearch (or analogous field) should be empty string after clear.
  // Accept any of: globalSearch, query, text — we don't want to over-fit the key name.
  const emptyFields = ['globalSearch', 'query', 'text', 'value']
    .map(k => (last as any)[k])
    .filter(v => v !== undefined);
  expect(emptyFields.length, `clear-filter should publish an empty search field; last msg: ${JSON.stringify(last)}`).toBeGreaterThan(0);
  for (const v of emptyFields) expect(v).toBe('');
});
