import { test, expect, type Page } from '@playwright/test';

async function ensureStarted(page: Page) {
  const startButton = page.getByRole('button', { name: /开始这 21 天的旅程|Begin the 21-day journey/ });
  if (await startButton.count()) {
    await startButton.click();
  }
}

test('加载页面并展示点阵背景', async ({ page }) => {
  await page.goto('/');
  await ensureStarted(page);
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveCount(1);
  const size = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    return { w: c.width, h: c.height };
  });
  expect(size.w).toBeGreaterThan(0);
  expect(size.h).toBeGreaterThan(0);
});

test('语言切换可用', async ({ page }) => {
  await page.goto('/');
  await ensureStarted(page);
  await expect(page.getByRole('button', { name: 'EN' })).toBeVisible();
  await expect(page.getByRole('button', { name: '中文' })).toBeVisible();

  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.getByRole('button', { name: /badge/i })).toBeVisible();

  await page.getByRole('button', { name: '中文' }).click();
  await expect(page.getByRole('button', { name: '徽章' })).toBeVisible();
});

test('创建任务并完成任务触发 XP 动效', async ({ page }) => {
  await page.goto('/');
  await ensureStarted(page);
  const input = page.getByPlaceholder(/Cast a new card|铸造一张新卡/);
  await input.click();
  await input.fill('E2E Task');
  await input.press('Enter');
  await page.getByRole('button', { name: /15m/i }).click();

  await expect(page.getByText('E2E Task')).toBeVisible();
  const completeButton = page.locator('button[aria-label^="complete:"]').first();
  await completeButton.click();
  await expect(page.getByTestId('xp-feedback')).toBeVisible();
});

test('放空卡进入倒计时界面', async ({ page }) => {
  await page.goto('/');
  await ensureStarted(page);
  await page.getByText(/🧘/).first().click();
  await expect(page.getByRole('button', { name: /放弃|Give up/ })).toBeVisible();
  await expect(page.locator('div.text-9xl')).toContainText(/\d{2}:\d{2}/);
});
