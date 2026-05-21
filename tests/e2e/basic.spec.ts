import { test, expect } from '@playwright/test'

test('app loads and shows welcome message', async ({ page }) => {
  await page.goto('http://localhost:1420')
  await expect(page.locator('text=Markdown Viewer')).toBeVisible()
  await expect(page.locator('text=Open a file or folder to get started')).toBeVisible()
})

test('toolbar buttons are visible', async ({ page }) => {
  await page.goto('http://localhost:1420')
  await expect(page.locator('text=Open File')).toBeVisible()
  await expect(page.locator('text=Open Folder')).toBeVisible()
  await expect(page.locator('text=Save')).toBeVisible()
  await expect(page.locator('text=Save As')).toBeVisible()
  await expect(page.locator('text=Source')).toBeVisible()
  await expect(page.locator('text=Preview')).toBeVisible()
  await expect(page.locator('text=Split')).toBeVisible()
})

test('view mode buttons toggle active state', async ({ page }) => {
  await page.goto('http://localhost:1420')
  const previewBtn = page.locator('button', { hasText: 'Preview' })
  const sourceBtn = page.locator('button', { hasText: 'Source' })

  await previewBtn.click()
  await expect(previewBtn).toHaveClass(/active/)

  await sourceBtn.click()
  await expect(sourceBtn).toHaveClass(/active/)
})
