# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: src\test\testcenter.guard.spec.ts >> Test center route guards >> allows authenticated user to open guarded test center detail route
- Location: src\test\testcenter.guard.spec.ts:42:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Test Center 123 Details')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Test Center 123 Details')

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const adminToken = (() => {
  4  |   const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  5  |   const payload = btoa(JSON.stringify({ login: "admin-user", role: "USER", exp: Math.floor(Date.now() / 1000) + 3600 }));
  6  |   return `${header}.${payload}.`;
  7  | })();
  8  | 
  9  | const testCenterId = "123";
  10 | 
  11 | test.describe("Test center route guards", () => {
  12 |   test.beforeEach(async ({ page }) => {
  13 |     page.on("console", (message) => {
  14 |       console.log("browser console:", message.text());
  15 |     });
  16 | 
  17 |     page.on("pageerror", (error) => {
  18 |       console.log("browser pageerror:", error.message);
  19 |     });
  20 | 
  21 |     page.on("requestfailed", (request) => {
  22 |       console.log(`requestfailed: ${request.url()} ${request.failure()?.errorText}`);
  23 |     });
  24 | 
  25 |     page.on("request", (request) => {
  26 |       console.log(`request: ${request.method()} ${request.url()}`);
  27 |     });
  28 | 
  29 |     await page.addInitScript(({ token }) => {
  30 |       localStorage.setItem("accessToken", token);
  31 |     }, { token: adminToken });
  32 | 
  33 |     await page.route("**/svp-proxy/test_centers/*/validate_access", async (route) => {
  34 |       await route.fulfill({
  35 |         status: 200,
  36 |         contentType: "application/json",
  37 |         body: JSON.stringify({ access: true }),
  38 |       });
  39 |     });
  40 |   });
  41 | 
  42 |   test("allows authenticated user to open guarded test center detail route", async ({ page }) => {
  43 |     await page.goto(`/exam/test-centers/${testCenterId}`);
  44 |     console.log("navigated to", page.url());
  45 |     const bodyText = await page.locator("body").innerText();
  46 |     console.log("body text", bodyText.slice(0, 400));
  47 |     const html = await page.evaluate(() => document.body.innerHTML);
  48 |     console.log("body html", html.slice(0, 800));
> 49 |     await expect(page.locator("text=Test Center 123 Details")).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  50 |     await expect(page.locator("[data-testid=test-center-access-granted]")).toContainText("Test center access has been validated");
  51 |   });
  52 | });
  53 | 
```