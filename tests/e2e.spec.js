/**
 * TSV Expenses - E2E Tests
 * Playwright tests for the minimal expense tracker
 */

const { test, expect } = require("@playwright/test");

const BASE_URL = "http://localhost:8080";

test.describe("TSV Expenses", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("loads with empty state", async ({ page }) => {
    await page.goto(BASE_URL);

    // Check page title and header
    await expect(page).toHaveTitle(/TSV Expenses/);
    await expect(page.locator("h1")).toContainText("TSV Expenses");

    // Check summary cards show $0
    await expect(page.locator(".category-supplies p")).toContainText("$0.00");
    await expect(page.locator(".category-benefits p")).toContainText("$0.00");

    // Check empty state message
    await expect(page.locator("text=No expenses found")).toBeVisible();
  });

  test("can add expense manually", async ({ page }) => {
    await page.goto(BASE_URL);

    // Open manual entry form
    await page.click('summary:has-text("Add Expense Manually")');

    // Fill form
    await page.fill('input[type="date"]', "2026-02-09");
    await page.fill('input[placeholder="Description"]', "Test Office Supplies");
    await page.fill('input[placeholder="Location"]', "Dallas");
    await page.selectOption(
      'select:has-text("Select Category")',
      "Office Supplies"
    );
    await page.fill('input[placeholder="Amount"]', "150.00");

    // Submit
    await page.click('button[type="submit"]');

    // Verify expense appears in table
    await expect(
      page.locator('td:has-text("Test Office Supplies")')
    ).toBeVisible();
    await expect(page.locator('td:has-text("Dallas")')).toBeVisible();
    await expect(page.locator('tbody td:has-text("$150.00")')).toBeVisible();

    // Verify totals updated
    await expect(page.locator(".category-supplies p")).toContainText("$150.00");
  });

  test("can change expense category", async ({ page }) => {
    await page.goto(BASE_URL);

    // Add an expense first
    await page.click('summary:has-text("Add Expense Manually")');
    await page.fill('input[placeholder="Description"]', "Category Test");
    await page.fill('input[placeholder="Location"]', "Austin");
    await page.selectOption(
      'select:has-text("Select Category")',
      "Office Supplies"
    );
    await page.fill('input[placeholder="Amount"]', "100.00");
    await page.click('button[type="submit"]');

    // Verify initial category
    await expect(page.locator(".category-supplies p")).toContainText("$100.00");
    await expect(page.locator(".category-benefits p")).toContainText("$0.00");

    // Change category in table row
    await page.selectOption("tbody select", "Employee Benefits");

    // Verify totals swapped
    await expect(page.locator(".category-supplies p")).toContainText("$0.00");
    await expect(page.locator(".category-benefits p")).toContainText("$100.00");
  });

  test("can filter by category", async ({ page }) => {
    await page.goto(BASE_URL);

    // Add two expenses with different categories
    await page.click('summary:has-text("Add Expense Manually")');

    await page.fill('input[placeholder="Description"]', "Supplies Item");
    await page.fill('input[placeholder="Location"]', "Houston");
    await page.selectOption(
      'select:has-text("Select Category")',
      "Office Supplies"
    );
    await page.fill('input[placeholder="Amount"]', "50.00");
    await page.click('button[type="submit"]');

    await page.fill('input[placeholder="Description"]', "Benefits Item");
    await page.fill('input[placeholder="Location"]', "Houston");
    await page.selectOption("form select", "Employee Benefits");
    await page.fill('input[placeholder="Amount"]', "75.00");
    await page.click('button[type="submit"]');

    // Both should be visible
    await expect(page.locator('td:has-text("Supplies Item")')).toBeVisible();
    await expect(page.locator('td:has-text("Benefits Item")')).toBeVisible();

    // Filter by Office Supplies
    await page.selectOption(
      ".filters select:nth-of-type(2)",
      "Office Supplies"
    );

    // Only supplies visible
    await expect(page.locator('td:has-text("Supplies Item")')).toBeVisible();
    await expect(
      page.locator('td:has-text("Benefits Item")')
    ).not.toBeVisible();
  });

  test("can delete expense", async ({ page }) => {
    await page.goto(BASE_URL);

    // Add expense
    await page.click('summary:has-text("Add Expense Manually")');
    await page.fill('input[placeholder="Description"]', "Delete Me");
    await page.fill('input[placeholder="Location"]', "Test");
    await page.selectOption(
      'select:has-text("Select Category")',
      "Office Supplies"
    );
    await page.fill('input[placeholder="Amount"]', "25.00");
    await page.click('button[type="submit"]');

    await expect(page.locator('td:has-text("Delete Me")')).toBeVisible();

    // Delete with confirmation
    page.on("dialog", (dialog) => dialog.accept());
    await page.click('button:has-text("🗑️")');

    // Verify removed
    await expect(page.locator('td:has-text("Delete Me")')).not.toBeVisible();
    await expect(page.locator(".category-supplies p")).toContainText("$0.00");
  });

  test("persists data in localStorage", async ({ page }) => {
    await page.goto(BASE_URL);

    // Add expense
    await page.click('summary:has-text("Add Expense Manually")');
    await page.fill('input[placeholder="Description"]', "Persistent Item");
    await page.fill('input[placeholder="Location"]', "Persist City");
    await page.selectOption(
      'select:has-text("Select Category")',
      "Employee Benefits"
    );
    await page.fill('input[placeholder="Amount"]', "200.00");
    await page.click('button[type="submit"]');

    // Reload page
    await page.reload();

    // Data should persist
    await expect(page.locator('td:has-text("Persistent Item")')).toBeVisible();
    await expect(page.locator(".category-benefits p")).toContainText("$200.00");
  });

  test("can import CSV file", async ({ page }) => {
    await page.goto(BASE_URL);

    // Create a test CSV
    const csvContent = `Date,Description,Location,Category,Amount
2026-01-15,Paper supplies,Dallas,Office Supplies,45.00
2026-01-20,Health insurance,Austin,Employee Benefits,500.00`;

    // Upload CSV
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Wait for import
    await expect(page.locator("text=Imported 2 expenses")).toBeVisible();

    // Verify data
    await expect(page.locator('td:has-text("Paper supplies")')).toBeVisible();
    await expect(page.locator('td:has-text("Health insurance")')).toBeVisible();
    await expect(page.locator(".category-supplies p")).toContainText("$45.00");
    await expect(page.locator(".category-benefits p")).toContainText("$500.00");
  });
});
