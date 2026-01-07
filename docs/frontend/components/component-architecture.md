# Component Architecture

## Overview

TSV Ledger uses a componentized frontend architecture with Bootstrap 5 for styling and vanilla JavaScript for functionality. All HTML files are broken into reusable components under 300 lines each, with modular JavaScript organized by feature.

## Component Structure

Components are organized in `public/components/[feature]/[component].html` with supporting CSS and JS.

```
public/components/
├── navigation/
│   ├── navigation.html
│   ├── navigation.css
│   └── navigation.js
├── data-import/
│   ├── data-import.html
│   ├── data-import.css
│   └── data-import.js
├── geographic-analysis/
│   ├── geographic-analysis.html
│   ├── geographic-analysis.css
│   └── geographic-analysis.js
└── ...
```

## Component Template

Each component follows a consistent structure with clear separation of concerns.

### Implementation

```html
<!-- public/components/example-component/example-component.html -->
<div class="example-component" id="example-component">
  <!-- Component Header -->
  <div class="component-header">
    <h3 class="component-title">Example Component</h3>
    <div class="component-actions">
      <button class="btn btn-primary" id="action-button">
        <i class="fas fa-plus"></i> Action
      </button>
    </div>
  </div>

  <!-- Component Content -->
  <div class="component-content">
    <!-- Dynamic content goes here -->
    <div id="content-area" class="content-area">
      <!-- Content loaded dynamically -->
    </div>
  </div>

  <!-- Component Footer (optional) -->
  <div class="component-footer">
    <div class="component-info">
      <small class="text-muted">Last updated: <span id="last-updated"></span></small>
    </div>
  </div>
</div>

<!-- Component-specific styles -->
<style>
.example-component {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.component-header {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.component-title {
  margin: 0;
  color: #495057;
}

.component-actions .btn {
  margin-left: 0.5rem;
}

.component-content {
  padding: 1rem;
}

.content-area {
  min-height: 200px;
}

.component-footer {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 8px 8px;
}
</style>

<!-- Component JavaScript -->
<script>
// public/components/example-component/example-component.js
class ExampleComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.contentArea = this.container.querySelector('#content-area');
    this.lastUpdated = this.container.querySelector('#last-updated');
    this.actionButton = this.container.querySelector('#action-button');

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadInitialData();
    this.updateTimestamp();
  }

  bindEvents() {
    this.actionButton.addEventListener('click', this.handleAction.bind(this));

    // Listen for custom events
    document.addEventListener('dataUpdated', this.handleDataUpdate.bind(this));
  }

  async handleAction(event) {
    event.preventDefault();

    try {
      this.setLoading(true);

      // Perform action
      const result = await this.performAction();

      // Update UI
      this.updateContent(result);

      // Emit success event
      this.emitEvent('actionCompleted', { result });

    } catch (error) {
      this.handleError(error);
    } finally {
      this.setLoading(false);
    }
  }

  handleDataUpdate(event) {
    const { data } = event.detail;
    this.updateContent(data);
    this.updateTimestamp();
  }

  async loadInitialData() {
    try {
      const data = await this.fetchData();
      this.updateContent(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  updateContent(data) {
    this.contentArea.innerHTML = this.renderContent(data);
  }

  renderContent(data) {
    // Render content based on data
    return `
      <div class="data-display">
        <p>Data loaded: ${data.length} items</p>
        <ul class="data-list">
          ${data.map(item => `<li>${item.name}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  updateTimestamp() {
    const now = new Date();
    this.lastUpdated.textContent = now.toLocaleString();
  }

  setLoading(loading) {
    this.container.classList.toggle('loading', loading);
    this.actionButton.disabled = loading;
    this.actionButton.innerHTML = loading ?
      '<i class="fas fa-spinner fa-spin"></i> Loading...' :
      '<i class="fas fa-plus"></i> Action';
  }

  emitEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  handleError(error) {
    console.error('Component error:', error);
    this.showError('An error occurred. Please try again.');
  }

  showError(message) {
    this.contentArea.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
      </div>
    `;
  }

  // Abstract methods to be implemented by subclasses
  async performAction() {
    throw new Error('performAction must be implemented by subclass');
  }

  async fetchData() {
    throw new Error('fetchData must be implemented by subclass');
  }
}

// Initialize component when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('example-component')) {
    new ExampleComponent('example-component');
  }
});
</script>
```

## Component Lifecycle

### Initialization
Components are initialized when the DOM is ready, ensuring all required elements exist.

### Event Binding
Components bind to both user interactions and custom application events.

### Data Management
Components handle their own data fetching, caching, and updates.

### Cleanup
Components should provide cleanup methods for proper memory management.

## Best Practices

### File Organization
- Keep HTML, CSS, and JS in the same directory
- Use consistent naming conventions
- Separate concerns clearly

### Performance
- Lazy load components when possible
- Minimize DOM manipulation
- Use efficient selectors

### Maintainability
- Document component APIs
- Use consistent patterns
- Keep components focused on single responsibilities