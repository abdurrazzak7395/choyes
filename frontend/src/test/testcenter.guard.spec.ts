import { test, expect } from '@playwright/test';

// Replace BASE with your dev server address if different
const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Test: when server returns access: false, user should be redirected to '/'
test('redirects to root when user has no access to the test center', async ({ page }) => {
  await page.route('**/test_centers/*/validate_access', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: false })
    });
  });

  // Navigate directly to a protected route
  await page.goto(`${BASE}/test-center/centers/123`);

  // Expect redirect to root path
  await expect(page).toHaveURL(new RegExp(`${BASE}/?$`));
});

// Test: when server returns access: true, user can stay on page
test('allows access when server validates test center access', async ({ page }) => {
  await page.route('**/test_centers/*/validate_access', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: true, role: 'owner' })
    });
  });

  await page.goto(`${BASE}/test-center/centers/123`);

  // Expect page remains on the test-center view (URL contains /test-center/centers/123)
  await expect(page).toHaveURL(new RegExp(`${BASE}/test-center/centers/123`));

  // Optionally assert some element exists on the page that would indicate the view loaded
  // Example: a heading with text "Test Centers" (adjust selector to match your UI)
  // const heading = page.locator('h1');
  // await expect(heading).toContainText('Test Centers');
});
