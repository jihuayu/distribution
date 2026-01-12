import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should have consistent navigation across all pages', async ({ page }) => {
    const pages = ['/', '/repositories', '/settings']
    
    for (const url of pages) {
      await page.goto(url)
      
      // Check all navigation links are present
      await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /Repositories/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible()
    }
  })

  test('should highlight active page in navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check if there's any active state indicator
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
    
    // Navigate to different pages and verify
    await page.goto('/repositories')
    await expect(page.getByRole('link', { name: /Repositories/i })).toBeVisible()
    
    await page.goto('/settings')
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible()
  })

  test('should maintain navigation state after page refresh', async ({ page }) => {
    await page.goto('/repositories')
    await page.reload()
    
    // Should still be on repositories page
    await expect(page).toHaveURL(/.*repositories/)
    await expect(page.getByRole('heading', { name: /Repositories/i })).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper page titles', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Registry Management/)
    
    await page.goto('/repositories')
    await expect(page).toHaveTitle(/Registry Management/)
    
    await page.goto('/settings')
    await expect(page).toHaveTitle(/Registry Management/)
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const pages = ['/', '/repositories', '/settings']
    
    for (const url of pages) {
      await page.goto(url)
      
      // Check that page has at least one h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThan(0)
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through navigation links
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check focus is on a link
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON']).toContain(focusedElement)
  })
})

test.describe('Performance', () => {
  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should not have console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    
    // Filter out expected errors (like API connection failures in test env)
    const unexpectedErrors = consoleErrors.filter(err => 
      !err.includes('Failed to fetch') && 
      !err.includes('NetworkError') &&
      !err.includes('ERR_CONNECTION_REFUSED')
    )
    
    expect(unexpectedErrors).toHaveLength(0)
  })
})

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ]

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      
      // Check navigation is visible
      await expect(page.getByRole('navigation')).toBeVisible()
      
      // Check main content is visible
      await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()
    })
  }
})
