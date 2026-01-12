---
applyTo: "public/**/*.html,public/**/*.js,public/components/**/*"
---

# Frontend Development Instructions

## Architecture

```
public/
├── components/              # Reusable HTML components (<300 lines each)
│   ├── navigation/          # Nav sidebar components
│   ├── geographic-analysis/ # Map/location components
│   ├── employee-benefits/   # Benefits tracking
│   ├── reconciliation/      # Bank matching
│   └── amazon-zip-import/   # Amazon import UI
├── js/
│   ├── modules/             # Modular JavaScript
│   └── *.js                 # Page-specific scripts
├── css/                     # Stylesheets
└── *.html                   # Main page files
```

## Component Pattern

All HTML files MUST be under 300 lines. Break large files into:

```
public/components/[feature-name]/
├── [feature-name].html      # Main component (<300 lines)
├── [feature-name].js        # Component logic
└── [subcomponent].html      # Smaller parts if needed
```

## Server Middleware

The server automatically injects navigation into HTML via `src/menu.js`:

```javascript
// server.js middleware reads HTML files and injects sidebar
// No need to manually include navigation in each file
```

## Bootstrap 5 Usage

```html
<!-- Use Bootstrap 5 classes throughout -->
<div class="container mt-4">
  <div class="row">
    <div class="col-md-6">
      <!-- Content -->
    </div>
  </div>
</div>

<!-- Cards for content sections -->
<div class="card mb-3">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
</div>

<!-- Tables with Bootstrap styling -->
<table class="table table-striped table-hover">
  <!-- Use data attributes for dynamic tables -->
</table>
```

## API Calls Pattern

```javascript
// ✅ DO: Use fetch with async/await and error handling
async function loadData() {
  try {
    const response = await fetch("/api/endpoint");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    renderData(data);
  } catch (error) {
    showError("Failed to load data: " + error.message);
    console.error("API Error:", error);
  }
}

// ❌ DON'T: Skip error handling or use .then() chains
fetch("/api/endpoint")
  .then((r) => r.json())
  .then(displayResults); // Missing error handling!
```

## Form Handling

```javascript
// ✅ DO: Validate before submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const formData = new FormData(form);
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      body: formData,
    });
    // Handle response
  } catch (error) {
    showError(error.message);
  }
});
```

## DOM Manipulation

```javascript
// ✅ DO: Use template literals for HTML
function renderItems(items) {
  const html = items
    .map(
      (item) => `
    <tr data-id="${item.id}">
      <td>${escapeHtml(item.name)}</td>
      <td>${formatCurrency(item.amount)}</td>
    </tr>
  `
    )
    .join("");
  tableBody.innerHTML = html;
}

// ✅ DO: Always escape user content
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
```

## ✅ DO:

- Keep HTML components under 300 lines
- Use Bootstrap 5 utility classes
- Handle API errors with user feedback
- Escape user-generated content
- Use semantic HTML elements
- Add loading indicators for async operations

## ❌ DON'T:

- Create files over 300 lines
- Use inline styles (use Bootstrap classes)
- Skip error handling on fetch calls
- Trust user input without sanitization
- Use document.write()
- Block UI during API calls

## File Naming

- HTML pages: `kebab-case.html`
- Components: `component-name.html`
- JavaScript: `camelCase.js` or `kebab-case.js`
- CSS: `kebab-case.css`

## Testing Frontend

```bash
# E2E tests for user workflows
npx playwright test tests/e2e/

# Specific page test
npx playwright test tests/e2e/navigation.spec.js
```

## Related Instructions

| Topic                            | File                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| Backend API patterns             | [src.instructions.md](src.instructions.md)                                         |
| Test patterns                    | [tests.instructions.md](tests.instructions.md)                                     |
| Full componentization guidelines | [../copilot-instructions.md](../copilot-instructions.md#componentization-strategy) |
| Quick start                      | [../../AGENTS.md](../../AGENTS.md)                                                 |
