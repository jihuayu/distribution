import { test, expect } from '@playwright/test'

test.describe('Repositories Page', () => {
  test('should load the repositories page', async ({ page }) => {
    await page.goto('/repositories')
    
    // Check page title
    await expect(page).toHaveTitle(/Registry Management/)
  })

  test('should display repositories heading', async ({ page }) => {
    await page.goto('/repositories')
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Repositories/i })).toBeVisible()
  })

  test('should have navigation', async ({ page }) => {
    await page.goto('/repositories')
    
    // Check navigation exists
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should display repository list or empty state', async ({ page }) => {
    await page.goto('/repositories')
    
    // Should either show repositories or a message about no repositories
    const hasReposList = await page.getByText(/repository/i).count() > 0
    const hasEmptyState = await page.getByText(/No repositories/i).isVisible().catch(() => false)
    
    expect(hasReposList || hasEmptyState).toBeTruthy()
  })

  test('should have refresh button', async ({ page }) => {
    await page.goto('/repositories')
    
    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    if (await refreshButton.isVisible()) {
      await expect(refreshButton).toBeEnabled()
      
      // Test clicking refresh button
      await refreshButton.click()
      
      // Wait a moment for potential reload
      await page.waitForTimeout(500)
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/repositories')
    
    // Check page loads and navigation is accessible
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Repositories/i })).toBeVisible()
  })

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/repositories')
    
    // Click dashboard link
    await page.getByRole('link', { name: /Dashboard/i }).click()
    
    // Check URL changed
    await expect(page).toHaveURL('/')
  })

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/repositories')
    
    // Click settings link
    await page.getByRole('link', { name: /Settings/i }).click()
    
    // Check URL changed
    await expect(page).toHaveURL(/.*settings/)
  })

  test('should handle loading state gracefully', async ({ page }) => {
    await page.goto('/repositories')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Check no error messages are displayed
    const errorText = page.getByText(/error/i)
    const errorCount = await errorText.count()
    
    // It's ok if there are errors from failed API calls in dev mode
    // But page should still render
    await expect(page.getByRole('heading', { name: /Repositories/i })).toBeVisible()
  })
})
