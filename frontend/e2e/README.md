# E2E Tests

End-to-end tests for the Registry Management UI using Playwright.

## Overview

This directory contains E2E tests that verify the functionality of the web management interface:

- **dashboard.spec.ts** - Tests for the main dashboard page
- **repositories.spec.ts** - Tests for the repositories browser
- **settings.spec.ts** - Tests for the settings/configuration viewer
- **navigation.spec.ts** - Tests for navigation, accessibility, performance, and responsive design

## Running Tests

### Install Dependencies

```bash
npm install
npx playwright install
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests with UI

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode

```bash
npm run test:e2e:headed
```

### Debug Tests

```bash
npm run test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test e2e/dashboard.spec.ts
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: http://localhost:3000
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Parallel**: Tests run in parallel for faster execution
- **Web Server**: Automatically starts Next.js dev server before tests
- **Retries**: 2 retries on CI, 0 locally
- **Trace**: Enabled on first retry for debugging

## Test Coverage

### Dashboard Tests
- Page loading and title
- Navigation links
- Status display
- Version information
- Repository count
- Refresh functionality
- Responsive design
- Page navigation

### Repositories Tests
- Page loading
- Repository list or empty state
- Refresh functionality
- Responsive design
- Navigation between pages
- Error handling

### Settings Tests
- Page loading
- Configuration display
- Refresh functionality
- Sensitive data sanitization
- Responsive design
- Error handling
- API failure handling

### Navigation & General Tests
- Consistent navigation across pages
- Active page highlighting
- Page refresh handling
- Accessibility (titles, headings, keyboard navigation)
- Performance (load times, console errors)
- Responsive design (mobile, tablet, desktop)

## Writing New Tests

Follow these patterns when adding new tests:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/page-url')
    
    // Your test assertions
    await expect(page.getByRole('heading')).toBeVisible()
  })
})
```

## Best Practices

1. **Use Role Selectors**: Prefer `getByRole()` over CSS selectors for better accessibility
2. **Wait for States**: Use `waitForLoadState()` when needed
3. **Handle Errors Gracefully**: Tests should handle API failures in dev mode
4. **Test Responsiveness**: Include mobile viewport tests
5. **Check Accessibility**: Verify proper headings, titles, and keyboard navigation
6. **Avoid Hardcoded Waits**: Use Playwright's auto-waiting instead of `waitForTimeout()`

## CI Integration

Tests are configured to run automatically in CI:

```yaml
- name: Install dependencies
  run: cd frontend && npm install

- name: Install Playwright browsers
  run: cd frontend && npx playwright install --with-deps

- name: Run E2E tests
  run: cd frontend && npm run test:e2e
```

## Troubleshooting

### Tests fail with "Connection refused"

The web server might not be starting correctly. Check:
- Next.js builds successfully: `npm run build`
- Port 3000 is available
- Check `playwright.config.ts` webServer settings

### Tests are flaky

- Increase timeouts in `playwright.config.ts`
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Check for race conditions in your app

### Browser not found

Run: `npx playwright install`

## Reports

Test results are saved in `playwright-report/` directory. View with:

```bash
npx playwright show-report
```

## Debugging

- Use `await page.pause()` to pause execution
- Run `npm run test:e2e:debug` for step-by-step debugging
- Check screenshots in `test-results/` on failure
- View traces in Playwright Trace Viewer
