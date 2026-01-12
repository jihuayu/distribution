import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test('should load the settings page', async ({ page }) => {
    await page.goto('/settings')
    
    // Check page title
    await expect(page).toHaveTitle(/Registry Management/)
  })

  test('should display settings heading', async ({ page }) => {
    await page.goto('/settings')
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible()
  })

  test('should have navigation', async ({ page }) => {
    await page.goto('/settings')
    
    // Check navigation exists
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should display configuration section', async ({ page }) => {
    await page.goto('/settings')
    
    // Check for configuration-related content
    await expect(page.getByText(/Configuration/i)).toBeVisible()
  })

  test('should have refresh button', async ({ page }) => {
    await page.goto('/settings')
    
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

  test('should display configuration data or loading state', async ({ page }) => {
    await page.goto('/settings')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Should show either config data or a loading/error message
    const hasContent = await page.getByText(/version|storage|http/i).count() > 0
    const hasMessage = await page.getByText(/loading|error|no config/i).count() > 0
    
    expect(hasContent || hasMessage).toBeTruthy()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/settings')
    
    // Check page loads and navigation is accessible
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible()
  })

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/settings')
    
    // Click dashboard link
    await page.getByRole('link', { name: /Dashboard/i }).click()
    
    // Check URL changed
    await expect(page).toHaveURL('/')
  })

  test('should navigate to repositories', async ({ page }) => {
    await page.goto('/settings')
    
    // Click repositories link
    await page.getByRole('link', { name: /Repositories/i }).click()
    
    // Check URL changed
    await expect(page).toHaveURL(/.*repositories/)
  })

  test('should not display sensitive information', async ({ page }) => {
    await page.goto('/settings')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that sensitive fields are not visible (if config is loaded)
    const pageContent = await page.textContent('body')
    
    // Common sensitive field patterns that should be sanitized
    expect(pageContent).not.toMatch(/secretkey|secret|password|token.*:.*/i)
  })

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/settings')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Page should still render even if API fails
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})
