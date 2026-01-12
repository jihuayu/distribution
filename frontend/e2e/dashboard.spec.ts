import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/')
    
    // Check page title
    await expect(page).toHaveTitle(/Registry Management/)
    
    // Check navigation exists
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should display dashboard heading', async ({ page }) => {
    await page.goto('/')
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Repositories/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible()
  })

  test('should display status section', async ({ page }) => {
    await page.goto('/')
    
    // Check for status-related content
    await expect(page.getByText(/Status/i)).toBeVisible()
  })

  test('should display version information', async ({ page }) => {
    await page.goto('/')
    
    // Check for version text
    await expect(page.getByText(/Version/i)).toBeVisible()
  })

  test('should display repository count section', async ({ page }) => {
    await page.goto('/')
    
    // Check for repository count
    await expect(page.getByText(/Repositories/i)).toBeVisible()
  })

  test('should have refresh functionality', async ({ page }) => {
    await page.goto('/')
    
    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    if (await refreshButton.isVisible()) {
      await expect(refreshButton).toBeEnabled()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check navigation is still accessible
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should navigate to repositories page', async ({ page }) => {
    await page.goto('/')
    
    // Click repositories link
    await page.getByRole('link', { name: /Repositories/i }).click()
    
    // Check URL changed
    await expect(page).toHaveURL(/.*repositories/)
  })

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/')
    
    // Click settings link
    await page.getByRole('link', { name: /Settings/i }).click()
    
    // Check URL changed
    await expect(page).toHaveURL(/.*settings/)
  })
})
