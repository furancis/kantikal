import { expect, test } from '@playwright/test'

test('renders the visual Suno workflow shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Visual music generation operating app' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Music video lane/i })).toBeVisible()
  await page.getByRole('button', { name: /Music video lane/i }).click()
  await expect(page.getByRole('heading', { name: 'Perfect lipsync gate' })).toBeVisible()
})
