# Code Style Guide

## File Rules
- **Max lines**: 100 (enforced by lint)
- **Max function**: 20 lines
- **Naming**: camelCase (JS), kebab-case (files)

## JavaScript
```javascript
// ✅ DO: Arrow functions, async/await
const getData = async () => {
  const res = await fetch('/api/data');
  return res.json();
};

// ❌ DON'T: var, callbacks, .then chains
```

## HTML
```html
<!-- ✅ DO: Semantic elements, Alpine.js directives -->
<article x-data="expense()">
  <h2 x-text="title"></h2>
</article>

<!-- ❌ DON'T: Divs for everything, inline styles -->
```

## CSS
```css
/* ✅ DO: Use Pico's semantic defaults */
/* Add custom styles only when Pico insufficient */

/* ❌ DON'T: Override Pico's sensible defaults */
```

## Comments
```javascript
// ✅ DO: Explain WHY, not WHAT
// Calculate pro-rata amount for partial month

// ❌ DON'T: Obvious comments
// Add 1 to counter
counter++;
```

## Error Handling
```javascript
// ✅ DO: User-friendly messages
try {
  await saveExpense(data);
} catch (e) {
  showError('Could not save. Please try again.');
  console.error('Save failed:', e);
}
```
