/**
 * Benefits Module
 * Handles Amazon item filtering and benefits categorization for board/owners
 */

class EmployeeBenefitsManager {
  constructor() {
    this.selectedItems = new Set();
    this.amazonItems = [];
    this.benefitsMapping = new Map();
    this.itemAllocations = new Map(); // Store percentage allocations per item
    this.itemProgressiveAllocations = new Map(); // Track progressive allocations: {itemId: {benefits: X, business: Y}}
    this.initialized = false;
    this.modalId = 'employeeBenefitsModal';
    this.storageKey = 'employeeBenefitsSelection';
    this.allocationStorageKey = 'employeeBenefitsAllocations';
    this.progressiveAllocationStorageKey = 'employeeBenefitsProgressiveAllocations';

    // New: Default all items to 100% business supplies
    this.defaultToBusinessSupplies = true;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadAmazonItems();
      // Create the modal since it doesn't exist in HTML
      this.createSelectionModal();
      this.setupModalEventListeners();
      this.loadSavedSelection();
      // Note: updateSelectionStatus() is called by the HTML after initialization
      this.initialized = true;
      console.log('✅ Benefits Manager initialized');
    } catch (error) {
      console.error('❌ Error initializing Benefits Manager:', error);
    }
  }

  async loadAmazonItems() {
    try {
      console.log('🔍 Loading Amazon items for benefits filtering (business card only)...');
      
      // Load Amazon items filtered for business card ending in 5795
      const response = await fetch('/api/amazon-items?businessCard=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch Amazon items');
      }
      
      this.amazonItems = await response.json();
      
      // Initialize progressive allocations for all items - default to 100% business supplies
      this.amazonItems.forEach(item => {
        if (!this.itemProgressiveAllocations.has(item.id)) {
          this.itemProgressiveAllocations.set(item.id, {
            benefits: 0,    // Start with 0% benefits
            business: 100,  // Start with 100% business supplies
            total: 100
          });
        }
      });

  // Ensure allocation shapes are normalized (support older saved shapes)
  this.normalizeProgressiveAllocations();
      
      console.log(`📦 Loaded ${this.amazonItems.length} business card Amazon items`);
      
    } catch (error) {
      console.error('❌ Error loading Amazon items:', error);
      // Fallback to all Amazon items if business card filtering fails
      try {
        console.log('🔄 Fallback: Loading all Amazon items...');
        const fallbackResponse = await fetch('/api/amazon-items');
        this.amazonItems = await fallbackResponse.json();
        
        // Initialize progressive allocations for fallback items too
        this.amazonItems.forEach(item => {
          if (!this.itemProgressiveAllocations.has(item.id)) {
            this.itemProgressiveAllocations.set(item.id, { allocated: 0, remaining: 100 });
          }
        });
        
        console.log(`📦 Loaded ${this.amazonItems.length} total Amazon items`);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        // Final fallback to demo data
        this.loadDemoData();
      }
    }
  }

  // Normalize progressive allocation shapes so older storage formats
  // ({ allocated, remaining } or plain objects) are converted to the
  // canonical { benefits, business, total } shape used throughout the UI.
  normalizeProgressiveAllocations() {
    try {
      const allocs = this.itemProgressiveAllocations;
      if (!allocs) return;

      const normalizeEntry = (raw) => {
        if (!raw || typeof raw !== 'object') return { benefits: 0, business: 100, total: 100 };
        // Prefer explicit fields
        let benefits = null;
        let business = null;

        if (raw.benefits != null) benefits = Number(raw.benefits);
        if (raw.business != null) business = Number(raw.business);

        // Backwards-compat: older shape used 'allocated' for benefits
        if (benefits == null && raw.allocated != null) benefits = Number(raw.allocated);
        // Backwards-compat: older shape used 'remaining' for business
        if (business == null && raw.remaining != null) business = Number(raw.remaining);

        if (benefits == null && business == null) {
          // Last resort: try any numeric-like fields
          benefits = Number(raw.benefits || raw.allocated || 0);
          business = Number(raw.business || raw.remaining || (100 - benefits));
        }

        if (isNaN(benefits)) benefits = 0;
        if (isNaN(business)) business = 100 - benefits;

        // Normalize to integer percentages and ensure sum to 100
        benefits = Math.max(0, Math.min(100, Math.round(benefits)));
        business = Math.max(0, Math.min(100, Math.round(business)));
        business = 100 - benefits;

        return { benefits, business, total: 100 };
      };

      // Support Map-like and plain object storage
      if (typeof allocs.forEach === 'function' && typeof allocs.get === 'function' && typeof allocs.set === 'function') {
        // It's a Map
        Array.from(allocs.keys()).forEach(id => {
          try {
            const raw = allocs.get(id);
            const norm = normalizeEntry(raw);
            allocs.set(id, norm);
          } catch (e) {
            // ignore per-entry errors
          }
        });
      } else if (typeof allocs === 'object') {
        Object.keys(allocs).forEach(id => {
          try {
            allocs[id] = normalizeEntry(allocs[id]);
          } catch (e) {}
        });
      }
    } catch (e) {
      // non-fatal
      console.warn('normalizeProgressiveAllocations failed', e);
    }
  }

  createSelectionModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById(this.modalId);
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="${this.modalId}Label" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h4 class="modal-title" id="${this.modalId}Label">
                <i class="fas fa-balance-scale me-2"></i>Benefits Configuration Tool
              </h4>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
              <!-- Header with summary stats -->
              <div class="bg-light p-3 border-bottom">
                <div class="row text-center">
                  <div class="col-md-3">
                    <div class="card border-primary">
                      <div class="card-body p-2">
                        <h5 class="text-primary mb-1" id="totalItemsCount">-</h5>
                        <small class="text-muted">Total Items</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="card border-info">
                      <div class="card-body p-2">
                        <h5 class="text-info mb-1" id="businessSuppliesValue">$-</h5>
                        <small class="text-muted">Business Supplies</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="card border-success">
                      <div class="card-body p-2">
                        <h5 class="text-success mb-1" id="benefitsValue">$-</h5>
                        <small class="text-muted">Board Benefits</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="card border-warning">
                      <div class="card-body p-2">
                        <h5 class="text-warning mb-1" id="benefitsPercentage">-%</h5>
                        <small class="text-muted">Benefits %</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row g-0" style="min-height: 70vh;">
                <!-- Business Supplies Panel -->
                <div class="col-md-6 border-end">
                  <div class="p-3 bg-light border-bottom">
                    <div class="d-flex justify-content-between align-items-center">
                      <h5 class="mb-0 text-info">
                        <i class="fas fa-briefcase me-2"></i>Business Supplies
                      </h5>
                      <span class="badge bg-info" id="businessItemsCount">0 items</span>
                    </div>
                    <div class="mt-2">
                      <input type="text" class="form-control form-control-sm" id="searchBusiness"
                             placeholder="Search business supplies...">
                    </div>
                  </div>
                  <div class="p-3" style="max-height: 60vh; overflow-y: auto;">
                    <div id="businessSuppliesList" class="row g-3">
                      <!-- Business supplies cards will be populated here -->
                    </div>
                  </div>
                </div>

                <!-- Benefits Panel -->
                <div class="col-md-6">
                  <div class="p-3 bg-light border-bottom">
                    <div class="d-flex justify-content-between align-items-center">
                      <h5 class="mb-0 text-success">
                        <i class="fas fa-gift me-2"></i>Board Benefits
                      </h5>
                      <span class="badge bg-success" id="benefitsItemsCount">0 items</span>
                    </div>
                    <div class="mt-2">
                      <input type="text" class="form-control form-control-sm" id="searchBenefits"
                             placeholder="Search benefits...">
                    </div>
                  </div>
                  <div class="p-3" style="max-height: 60vh; overflow-y: auto;">
                    <div id="benefitsList" class="row g-3">
                      <!-- Benefits cards will be populated here -->
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <div class="me-auto">
                <small class="text-muted">
                  <i class="fas fa-info-circle me-1"></i>
                  Drag sliders to allocate between Business Supplies and Board Benefits
                </small>
              </div>
              <button type="button" class="btn btn-outline-secondary" id="resetAll">
                <i class="fas fa-undo me-2"></i>Reset All
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-success" id="generateReport">
                <i class="fas fa-chart-bar me-2"></i>Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup modal event listeners
    this.setupModalEventListeners();
  }

  setupModalEventListeners() {
    const modal = document.getElementById(this.modalId);

    // Search functionality
    document.getElementById('searchBusiness').addEventListener('input', (e) => {
      this.filterItems('business', e.target.value);
    });

    document.getElementById('searchBenefits').addEventListener('input', (e) => {
      this.filterItems('benefits', e.target.value);
    });

    // Reset all allocations
    document.getElementById('resetAll').addEventListener('click', () => {
      this.resetAllAllocations();
    });

    // Generate report
    document.getElementById('generateReport').addEventListener('click', () => {
      this.generateBenefitsReport();
    });

    // Modal show event
    modal.addEventListener('show.bs.modal', () => {
      // Only update display if data is already loaded
      if (this.amazonItems.length > 0) {
        this.updateModalDisplay();
      }
    });
  }

  createBusinessCard(item) {
  const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
    const businessAmount = (item.price * alloc.business) / 100;

    const div = document.createElement('div');
  div.className = 'col-md-6 col-lg-4';
  // expose searchable metadata for the modal search inputs
  div.dataset.itemName = (item.name || '').toLowerCase();
  div.dataset.itemId = item.id;
    div.innerHTML = `
      <div class="card h-100 border-info">
        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
          <small class="fw-bold">${item.category || 'Other'}</small>
          <button class="btn btn-sm btn-outline-light" onclick="employeeBenefitsManager.editItem('${item.id}')" title="Edit item">
            <i class="fas fa-edit"></i>
          </button>
        </div>
        <div class="card-body">
          <h6 class="card-title">${item.name}</h6>
          <div class="mb-2">
            <span class="badge bg-primary">$${businessAmount.toFixed(2)} (${alloc.business}%)</span>
          </div>
          <div class="mb-3">
            <label class="form-label small">Allocate to Benefits:</label>
            <div class="d-flex align-items-center gap-2">
              <input type="range" class="form-range flex-grow-1" min="0" max="100" value="${alloc.benefits}"
                     data-item-id="${item.id}" oninput="employeeBenefitsManager.updateAllocationSlider('${item.id}', this.value)">
              <small class="text-muted" style="min-width: 35px;">${alloc.benefits}%</small>
            </div>
          </div>
          <div class="row text-center">
            <div class="col-6">
              <small class="text-info">Business</small>
              <div class="fw-bold text-info">${alloc.business}%</div>
            </div>
            <div class="col-6">
              <small class="text-success">Benefits</small>
              <div class="fw-bold text-success">${alloc.benefits}%</div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-light">
          <small class="text-muted">
            <i class="fas fa-calendar me-1"></i>${item.date}
          </small>
        </div>
      </div>
    `;
    return div;
  }

  createBenefitsCard(item) {
  const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
    const benefitsAmount = (item.price * alloc.benefits) / 100;

    const div = document.createElement('div');
  div.className = 'col-md-6 col-lg-4';
  // expose searchable metadata for the modal search inputs
  div.dataset.itemName = (item.name || '').toLowerCase();
  div.dataset.itemId = item.id;
    div.innerHTML = `
      <div class="card h-100 border-success">
        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <small class="fw-bold">${item.category || 'Other'}</small>
          <button class="btn btn-sm btn-outline-light" onclick="employeeBenefitsManager.editItem('${item.id}')" title="Edit item">
            <i class="fas fa-edit"></i>
          </button>
        </div>
        <div class="card-body">
          <h6 class="card-title">${item.name}</h6>
          <div class="mb-2">
            <span class="badge bg-success">$${benefitsAmount.toFixed(2)} (${alloc.benefits}%)</span>
          </div>
          <div class="mb-3">
            <label class="form-label small">Adjust Benefits Allocation:</label>
            <div class="d-flex align-items-center gap-2">
              <input type="range" class="form-range flex-grow-1" min="0" max="100" value="${alloc.benefits}"
                     data-item-id="${item.id}" oninput="employeeBenefitsManager.updateAllocationSlider('${item.id}', this.value)">
              <small class="text-muted" style="min-width: 35px;">${alloc.benefits}%</small>
            </div>
          </div>
          <div class="row text-center">
            <div class="col-6">
              <small class="text-info">Business</small>
              <div class="fw-bold text-info">${alloc.business}%</div>
            </div>
            <div class="col-6">
              <small class="text-success">Benefits</small>
              <div class="fw-bold text-success">${alloc.benefits}%</div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-light">
          <small class="text-muted">
            <i class="fas fa-calendar me-1"></i>${item.date}
          </small>
        </div>
      </div>
    `;
    return div;
  }

  updateAllocationSlider(itemId, benefitsPercentage) {
    const pct = parseInt(benefitsPercentage);
    const businessPercentage = 100 - pct;

    // Update the allocation
    this.itemProgressiveAllocations.set(itemId, {
      benefits: pct,
      business: businessPercentage,
      total: 100
    });

    // Update display
    this.updateModalDisplay();
    this.saveProgressiveAllocations();

    console.log(`✅ Updated ${itemId}: ${businessPercentage}% business, ${pct}% benefits`);
  }

  resetAllAllocations() {
    if (confirm('Are you sure you want to reset all allocations to 100% Business Supplies?')) {
      this.amazonItems.forEach(item => {
        this.itemProgressiveAllocations.set(item.id, {
          benefits: 0,
          business: 100,
          total: 100
        });
      });

      this.updateModalDisplay();
      this.saveProgressiveAllocations();
      console.log('✅ All allocations reset to 100% business supplies');
    }
  }

  updateModalItems() {
    if (!document.getElementById(this.modalId)) return;
    
    const availableContainer = document.getElementById('availableItems');
    const selectedContainer = document.getElementById('selectedItems');
    
    if (!availableContainer || !selectedContainer) return;
    
    // Filter items based on search
    const searchTerm = document.getElementById('searchAvailable')?.value.toLowerCase() || '';
    const searchSelectedTerm = document.getElementById('searchSelected')?.value.toLowerCase() || '';
    
    const availableItems = this.amazonItems.filter(item => {
      const progressiveAlloc = this.itemProgressiveAllocations.get(item.id) || { allocated: 0, remaining: 100 };
      return progressiveAlloc.remaining > 0 && 
             (item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm));
    });
    
    const selectedItemsArray = this.amazonItems.filter(item => {
      const progressiveAlloc = this.itemProgressiveAllocations.get(item.id) || { allocated: 0, remaining: 100 };
      return progressiveAlloc.allocated > 0 && 
             (item.name.toLowerCase().includes(searchSelectedTerm) || item.category.toLowerCase().includes(searchSelectedTerm));
    });
    
    // Category information for better UX
    const categoryInfo = {
      'employee_amenities': { label: 'Board Amenities', color: 'success', icon: 'coffee', priority: 1 },
      'wellness_comfort': { label: 'Wellness & Comfort', color: 'success', icon: 'heart', priority: 2 },
      'kitchen_equipment': { label: 'Kitchen Equipment', color: 'info', icon: 'utensils', priority: 3 },
      'office_supplies': { label: 'Office Supplies', color: 'primary', icon: 'clipboard', priority: 4 },
      'employee_tech': { label: 'Board Technology', color: 'dark', icon: 'laptop', priority: 5 },
      'cleaning_supplies': { label: 'Cleaning & Safety', color: 'warning', icon: 'spray-can', priority: 6 },
      'safety_security': { label: 'Safety & Security', color: 'danger', icon: 'shield-alt', priority: 7 },
      'other': { label: 'Other Items', color: 'secondary', icon: 'question', priority: 8 }
    };
    
    // Group items by category
    const groupByCategory = (items) => {
      const grouped = {};
      items.forEach(item => {
        const category = item.category || 'other';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(item);
      });
      return grouped;
    };
    
    // Render available items
    availableContainer.innerHTML = '';
    const groupedAvailable = groupByCategory(availableItems);
    
    // Sort categories by priority (high-benefit categories first)
    const sortedCategories = Object.keys(groupedAvailable).sort((a, b) => {
      const priorityA = categoryInfo[a]?.priority || 99;
      const priorityB = categoryInfo[b]?.priority || 99;
      return priorityA - priorityB;
    });
    
    sortedCategories.forEach(categoryKey => {
      const items = groupedAvailable[categoryKey];
      const info = categoryInfo[categoryKey] || categoryInfo.other;
      
      // Calculate category remaining value
      const categoryRemainingValue = items.reduce((sum, item) => {
        const progressiveAlloc = this.itemProgressiveAllocations.get(item.id) || { allocated: 0, remaining: 100 };
        const remainingAmount = item.price - (item.price * progressiveAlloc.allocated) / 100;
        return sum + remainingAmount;
      }, 0);
      
      // Category header
      const header = document.createElement('div');
      header.className = 'list-group-item bg-light';
      header.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted fw-bold">
            <i class="fas fa-${info.icon} me-2"></i>
            ${info.label} (${items.length} items)
          </small>
          <div class="d-flex align-items-center gap-2">
            <small class="text-primary fw-bold">$${categoryRemainingValue.toFixed(2)}</small>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-success btn-sm" 
                      onclick="employeeBenefitsManager.selectCategoryItems('${categoryKey}', '${categoryKey}')"
                      title="Select all items in this category">
                <i class="fas fa-plus"></i> All
              </button>
            <button class="btn btn-outline-danger btn-sm" 
                    onclick="employeeBenefitsManager.deselectCategoryItems('${categoryKey}')"
                    title="Deselect all items in this category">
              <i class="fas fa-minus"></i> None
            </button>
          </div>
        </div>
      `;
      availableContainer.appendChild(header);
      
      // Sort items by name within category
      items.sort((a, b) => a.name.localeCompare(b.name))
           .forEach(item => {
             const element = this.createItemElement(item, false, info.color);
             availableContainer.appendChild(element);
           });
    });
    
    // Add summary for available items (business supplies)
    if (availableItems.length > 0) {
      const totalRemainingValue = availableItems.reduce((sum, item) => {
        const progressiveAlloc = this.itemProgressiveAllocations.get(item.id) || { allocated: 0, remaining: 100 };
        const remainingAmount = item.price - (item.price * progressiveAlloc.allocated) / 100;
        return sum + remainingAmount;
      }, 0);
      
      const availableSummary = document.createElement('div');
      availableSummary.className = 'list-group-item bg-primary bg-opacity-10 border-primary';
      availableSummary.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <strong class="text-primary">
            <i class="fas fa-briefcase me-2"></i>Business Supplies Available
          </strong>
          <span class="badge bg-primary fs-6">
            ${availableItems.length} items • $${totalRemainingValue.toFixed(2)}
          </span>
        </div>
      `;
      availableContainer.insertBefore(availableSummary, availableContainer.firstChild);
    }
    
    if (availableItems.length === 0) {
      availableContainer.innerHTML = `
        <div class="list-group-item text-center text-muted">
          <i class="fas fa-search me-2"></i>No items found
        </div>
      `;
    }
    
    // Render selected items with summary
    selectedContainer.innerHTML = '';
    
    if (selectedItemsArray.length === 0) {
      selectedContainer.innerHTML = `
        <div class="list-group-item text-center text-muted">
          <i class="fas fa-info-circle me-2"></i>
          No items selected for benefits
        </div>
      `;
    } else {
      // Summary at top - calculate total allocated value for benefits
      const totalAllocatedValue = selectedItemsArray.reduce((sum, item) => {
        const progressiveAlloc = this.itemProgressiveAllocations.get(item.id) || { allocated: 0, remaining: 100 };
        const allocatedAmount = (item.price * progressiveAlloc.allocated) / 100;
        return sum + allocatedAmount;
      }, 0);
      
      const summary = document.createElement('div');
      summary.className = 'list-group-item bg-success bg-opacity-10 border-success';
      summary.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <strong class="text-success">
            <i class="fas fa-calculator me-2"></i>Benefits Summary
          </strong>
          <span class="badge bg-success fs-6">
            ${selectedItemsArray.length} items • $${totalAllocatedValue.toFixed(2)}
          </span>
        </div>
      `;
      selectedContainer.appendChild(summary);
      
      // Group selected items by category
      const groupedSelected = groupByCategory(selectedItemsArray);
      Object.keys(groupedSelected)
            .sort((a, b) => (categoryInfo[a]?.priority || 99) - (categoryInfo[b]?.priority || 99))
            .forEach(categoryKey => {
              const items = groupedSelected[categoryKey];
              const info = categoryInfo[categoryKey] || categoryInfo.other;
              
              // Calculate category total based on allocated amounts
              const categoryTotal = items.reduce((sum, item) => {
                const progressiveAlloc = this.itemProgressiveAllocations.get(item.id) || { allocated: 0, remaining: 100 };
                const allocatedAmount = (item.price * progressiveAlloc.allocated) / 100;
                return sum + allocatedAmount;
              }, 0);
              
              // Category header for selected
              const header = document.createElement('div');
              header.className = 'list-group-item bg-light';
              header.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-muted fw-bold">
                    <i class="fas fa-${info.icon} me-2"></i>
                    ${info.label}
                  </small>
                  <small class="text-muted">
                    ${items.length} items • $${categoryTotal.toFixed(2)}
                  </small>
                </div>
              `;
              selectedContainer.appendChild(header);
              
              items.sort((a, b) => a.name.localeCompare(b.name))
                   .forEach(item => {
                     const element = this.createItemElement(item, true, info.color);
                     selectedContainer.appendChild(element);
                   });
            });
    }
    
    // Update counts and status
    document.getElementById('availableCount').textContent = availableItems.length;
    document.getElementById('selectedCount').textContent = selectedItemsArray.length;
    this.updateSelectionStatus();
    
    // Update button texts after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.updateAllButtonTexts();
    }, 100);
  }

  updateAllButtonTexts() {
    // Update button text for all visible items
    this.amazonItems.forEach(item => {
      this.updateAddButtonText(item.id);
    });
  }

  updateSelectionStatus() {
    const statusElement = document.getElementById('selectionStatus');
    if (!statusElement) return;
    
    const total = this.amazonItems ? this.amazonItems.length : 0;
    const businessItems = this.amazonItems ? 
      this.amazonItems.filter(item => {
        const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
        return alloc.business > 0;
      }).length : 0;
    
    const benefitsItems = this.amazonItems ?
      this.amazonItems.filter(item => {
        const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
        return alloc.benefits > 0;
      }).length : 0;
    
    const statusText = `<strong>${total}</strong> total items • <strong>${businessItems}</strong> business supplies • <strong>${benefitsItems}</strong> benefits`;
    statusElement.innerHTML = statusText;
  }

  updateModalDisplay() {
    if (!document.getElementById(this.modalId)) {
      console.log('⚠️ Modal not found, skipping updateModalDisplay');
      return;
    }

    const businessList = document.getElementById('businessSuppliesList');
    const benefitsList = document.getElementById('benefitsList');

    // If lists are not yet available (race with modal rendering), retry once after a short tick.
    if (!businessList || !benefitsList) {
      console.log('⚠️ Modal lists not found, will retry shortly:', {
        businessList: !!businessList,
        benefitsList: !!benefitsList,
        retryScheduled: !!this._modalDisplayRetry
      });

      if (!this._modalDisplayRetry) {
        this._modalDisplayRetry = true;
        setTimeout(() => {
          this._modalDisplayRetry = false;
          try {
            this.updateModalDisplay();
          } catch (err) {
            console.warn('Retry updateModalDisplay failed', err);
          }
        }, 50);
      }

      return;
    }

    console.log('📊 Updating modal display with', this.amazonItems.length, 'items');

    // Clear existing content
    businessList.innerHTML = '';
    benefitsList.innerHTML = '';

    // Filter items based on allocations
    const businessItems = this.amazonItems.filter(item => {
      const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
      return alloc.business > 0;
    });

    const benefitsItems = this.amazonItems.filter(item => {
      const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
      return alloc.benefits > 0;
    });

    console.log('📊 Filtered items:', {
      businessItems: businessItems.length,
      benefitsItems: benefitsItems.length
    });

    // Add business supplies cards
    businessItems.forEach(item => {
      const card = this.createBusinessCard(item);
      businessList.appendChild(card);
    });

    // Add benefits cards
    benefitsItems.forEach(item => {
      const card = this.createBenefitsCard(item);
      benefitsList.appendChild(card);
    });

  // Update summary stats
  this.updateSummaryStats(businessItems, benefitsItems);

    // Update counts
    document.getElementById('businessItemsCount').textContent = businessItems.length;
    document.getElementById('benefitsItemsCount').textContent = benefitsItems.length;

    console.log(`📊 Updated modal: ${businessItems.length} business items, ${benefitsItems.length} benefits items`);
  }

  // NOTE: duplicate implementations existed. Keep single canonical implementation below.

  quickSelectCategory(category) {
    const categoryItems = this.amazonItems.filter(item => item.category === category);
    categoryItems.forEach(item => {
      // Set 100% to benefits for quick selection
      this.itemProgressiveAllocations.set(item.id, {
        benefits: 100,
        business: 0,
        total: 100
      });
    });

    this.updateModalDisplay();
    this.saveProgressiveAllocations();

    console.log(`✅ Quick selected ${categoryItems.length} items in category: ${category}`);
  }

  selectCategoryItems(category) {
    const categoryItems = this.amazonItems.filter(item => item.category === category);
    categoryItems.forEach(item => {
      this.selectedItems.add(item.id);
      // Set default allocation if not already set
      if (!this.itemAllocations.has(item.id)) {
        this.itemAllocations.set(item.id, 100);
      }
    });

    this.updateModalDisplay();
    this.saveSelection();
    this.saveAllocations();

    console.log(`✅ Selected all ${categoryItems.length} items in category: ${category}`);
  }

  deselectCategoryItems(category) {
    const categoryItems = this.amazonItems.filter(item => item.category === category);
    categoryItems.forEach(item => {
      this.selectedItems.delete(item.id);
      // Keep allocation for when item is re-selected
    });

    this.updateModalDisplay();
    this.saveSelection();

    console.log(`❌ Deselected all items in category: ${category}`);
  }

  createBusinessCard(item) {
    const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
    const businessAmount = (item.price * alloc.business) / 100;

    const div = document.createElement('div');
    div.className = 'col-md-6 col-lg-4';
    div.innerHTML = `
      <div class="card h-100 border-info">
        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
          <small class="fw-bold">${item.category || 'Other'}</small>
          <button class="btn btn-sm btn-outline-light" onclick="employeeBenefitsManager.editItem('${item.id}')" title="Edit item">
            <i class="fas fa-edit"></i>
          </button>
        </div>
        <div class="card-body">
          <h6 class="card-title">${item.name}</h6>
          <div class="mb-2">
            <span class="badge bg-primary">$${businessAmount.toFixed(2)} (${alloc.business}%)</span>
          </div>
          <div class="mb-3">
            <label class="form-label small">Allocate to Benefits:</label>
            <div class="d-flex align-items-center gap-2">
              <input type="range" class="form-range flex-grow-1" min="0" max="100" value="${alloc.benefits}"
                     data-item-id="${item.id}" oninput="employeeBenefitsManager.updateAllocationSlider('${item.id}', this.value)">
              <small class="text-muted" style="min-width: 35px;">${alloc.benefits}%</small>
            </div>
          </div>
          <div class="row text-center">
            <div class="col-6">
              <small class="text-info">Business</small>
              <div class="fw-bold text-info">${alloc.business}%</div>
            </div>
            <div class="col-6">
              <small class="text-success">Benefits</small>
              <div class="fw-bold text-success">${alloc.benefits}%</div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-light">
          <small class="text-muted">
            <i class="fas fa-calendar me-1"></i>${item.date}
          </small>
        </div>
      </div>
    `;
    return div;
  }

  createBenefitsCard(item) {
    const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
    const benefitsAmount = (item.price * alloc.benefits) / 100;

    const div = document.createElement('div');
    div.className = 'col-md-6 col-lg-4';
    div.innerHTML = `
      <div class="card h-100 border-success">
        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <small class="fw-bold">${item.category || 'Other'}</small>
          <button class="btn btn-sm btn-outline-light" onclick="employeeBenefitsManager.editItem('${item.id}')" title="Edit item">
            <i class="fas fa-edit"></i>
          </button>
        </div>
        <div class="card-body">
          <h6 class="card-title">${item.name}</h6>
          <div class="mb-2">
            <span class="badge bg-success">$${benefitsAmount.toFixed(2)} (${alloc.benefits}%)</span>
          </div>
          <div class="mb-3">
            <label class="form-label small">Adjust Benefits Allocation:</label>
            <div class="d-flex align-items-center gap-2">
              <input type="range" class="form-range flex-grow-1" min="0" max="100" value="${alloc.benefits}"
                     data-item-id="${item.id}" oninput="employeeBenefitsManager.updateAllocationSlider('${item.id}', this.value)">
              <small class="text-muted" style="min-width: 35px;">${alloc.benefits}%</small>
            </div>
          </div>
          <div class="row text-center">
            <div class="col-6">
              <small class="text-info">Business</small>
              <div class="fw-bold text-info">${alloc.business}%</div>
            </div>
            <div class="col-6">
              <small class="text-success">Benefits</small>
              <div class="fw-bold text-success">${alloc.benefits}%</div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-light">
          <small class="text-muted">
            <i class="fas fa-calendar me-1"></i>${item.date}
          </small>
        </div>
      </div>
    `;
    return div;
  }

  createItemElement(item, isSelected, categoryColor = 'secondary') {
    const div = document.createElement('div');
    div.className = `list-group-item list-group-item-action ${isSelected ? 'selected-item' : 'available-item'}`;
    div.dataset.itemId = item.id;
    div.dataset.itemName = item.name.toLowerCase();

    const bgClass = isSelected ? 'bg-success bg-opacity-10' : '';
    
    // Get current allocation status for progressive system
    // Initialize progressive allocation if it doesn't exist
    if (!this.itemProgressiveAllocations.has(item.id)) {
      this.itemProgressiveAllocations.set(item.id, { allocated: 0, remaining: 100 });
    }
    const progressiveAlloc = this.itemProgressiveAllocations.get(item.id);
    
    // Calculate amounts based on progressive allocation
    const allocatedAmount = (item.price * progressiveAlloc.allocated) / 100;
    const remainingAmount = item.price - allocatedAmount;

    // Context-aware price display
    let priceDisplay;
    if (isSelected) {
      // In selected list - show allocated portion
      priceDisplay = `$${allocatedAmount.toFixed(2)} (${progressiveAlloc.allocated}%)`;
    } else if (progressiveAlloc.allocated > 0) {
      // In available list but partially allocated - show remaining portion
      priceDisplay = `$${remainingAmount.toFixed(2)} (${progressiveAlloc.remaining}%)`;
    } else {
      // In available list, not allocated - show full price
      priceDisplay = item.priceFormatted || `$${item.price.toFixed(2)}`;
    }

    // Category labels for better UX
    const categoryLabels = {
      'employee_amenities': 'Employee Amenities',
      'office_supplies': 'Office Supplies',
      'cleaning_supplies': 'Cleaning & Safety',
      'kitchen_equipment': 'Kitchen Equipment',
      'wellness_comfort': 'Wellness & Comfort',
      'employee_tech': 'Employee Technology',
      'safety_security': 'Safety & Security',
      'other': 'Other Items'
    };

    const categoryDisplay = categoryLabels[item.category] || item.category;

    // Percentage control for progressive allocation system
    const controlTitle = isSelected ? 'Allocation Status:' : 'Add to Benefits:';
    const controlDescription = isSelected ? '' : `(select portion from remaining ${progressiveAlloc.remaining}%)`;
    const percentageControl = `
      <div class="mt-2 p-2 bg-light rounded">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <small class="text-muted fw-bold">${controlTitle}</small>
          <small class="text-success fw-bold">${progressiveAlloc.allocated}% Allocated</small>
        </div>
        ${controlDescription ? `<small class="text-muted d-block mb-2">${controlDescription}</small>` : ''}
        <div class="d-flex align-items-center gap-2">
          <input type="range" class="form-range flex-grow-1 percentage-slider" min="0" max="${progressiveAlloc.remaining}" value="${progressiveAlloc.remaining}"
                 data-item-id="${item.id}"
                 oninput="employeeBenefitsManager.updateSliderDisplay('${item.id}', this.value)">
          <small class="text-muted percentage-display" style="min-width: 35px;">${progressiveAlloc.remaining}%</small>
          ${progressiveAlloc.allocated > 0 ? `<button class="btn btn-outline-secondary btn-sm" onclick="employeeBenefitsManager.resetProgressiveAllocation('${item.id}')" title="Reset all allocations"><i class="fas fa-undo"></i></button>` : ''}
        </div>
        <div class="d-flex justify-content-between mt-1">
          <small class="text-success">Benefits: $${allocatedAmount.toFixed(2)}</small>
          <small class="text-muted">Remaining: $${remainingAmount.toFixed(2)}</small>
        </div>
        ${progressiveAlloc.allocated > 0 ? `<div class="mt-1"><small class="text-info">Allocated: ${progressiveAlloc.allocated}% | Available: ${progressiveAlloc.remaining}%</small></div>` : ''}
      </div>
    `;

    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-start ${bgClass}">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="mb-1 flex-grow-1">${item.name}</h6>
            <span class="badge bg-${categoryColor} ms-2">${priceDisplay}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <p class="mb-0 text-muted small">
              <i class="fas fa-calendar me-1"></i>${item.date} •
              <span class="text-${categoryColor}">${categoryDisplay}</span>
            </p>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary"
                      onclick="employeeBenefitsManager.editItem('${item.id}')"
                      title="Edit item details">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn ${isSelected ? 'btn-outline-danger' : 'btn-outline-success'} add-to-benefits-btn"
                      data-item-id="${item.id}"
                      title="${isSelected ? 'Remove from benefits' : `Add current percentage to benefits`}">
                <i class="fas ${isSelected ? 'fa-minus' : 'fa-plus'}"></i>
                <span class="button-text">${isSelected ? 'Remove' : `Add ${progressiveAlloc.remaining}%`}</span>
              </button>
            </div>
          </div>
          ${percentageControl}
        </div>
      </div>
    `;

    return div;
  }

  updateSummaryStats(businessItems, benefitsItems) {
    const totalItems = this.amazonItems.length;
    const businessValue = businessItems.reduce((sum, item) => {
      const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
      return sum + (item.price * alloc.business) / 100;
    }, 0);

    const benefitsValue = benefitsItems.reduce((sum, item) => {
      const alloc = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
      return sum + (item.price * alloc.benefits) / 100;
    }, 0);

  const denom = (businessValue + benefitsValue);
  const benefitsPercentage = denom > 0 ? (benefitsValue / denom) * 100 : 0;

    // Debug: Check if elements exist
    const totalItemsEl = document.getElementById('totalItemsCount');
    const businessValueEl = document.getElementById('businessSuppliesValue');
    const benefitsValueEl = document.getElementById('benefitsValue');
    const benefitsPercentageEl = document.getElementById('benefitsPercentage');

    console.log('🔍 Updating summary stats:', {
      totalItems,
      businessValue: Number.isFinite(businessValue) ? businessValue.toFixed(2) : 'NaN',
      benefitsValue: Number.isFinite(benefitsValue) ? benefitsValue.toFixed(2) : 'NaN',
      benefitsPercentage: Number.isFinite(benefitsPercentage) ? benefitsPercentage.toFixed(1) : 'NaN',
      elementsFound: {
        totalItems: !!totalItemsEl,
        businessValue: !!businessValueEl,
        benefitsValue: !!benefitsValueEl,
        benefitsPercentage: !!benefitsPercentageEl
      }
    });

    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (businessValueEl) businessValueEl.textContent = `$${businessValue.toFixed(2)}`;
    if (benefitsValueEl) benefitsValueEl.textContent = `$${benefitsValue.toFixed(2)}`;
    if (benefitsPercentageEl) benefitsPercentageEl.textContent = `${benefitsPercentage.toFixed(1)}%`;
  }

  editItem(itemId) {
    const item = this.amazonItems.find(item => item.id === itemId);
    if (!item) return;

    const newName = prompt('Edit item name:', item.name);
    if (newName && newName !== item.name) {
      item.name = newName;
      this.updateModalDisplay();
      console.log(`✅ Edited item ${itemId} name to: ${newName}`);
    }
  }

  removeItem(itemId) {
    console.log(`🗑️ Removing item ${itemId} from selection`);
    
    // Remove from selected items
    this.selectedItems.delete(itemId);
    
    // Update the display
    this.updateModalDisplay();
    this.saveSelection();
    
    console.log(`✅ Item ${itemId} removed from selection`);
  }

  updateAllocationSlider(itemId, benefitsPercentage) {
    const pct = parseInt(benefitsPercentage);
    const businessPercentage = 100 - pct;

    // Update the allocation
    this.itemProgressiveAllocations.set(itemId, {
      benefits: pct,
      business: businessPercentage,
      total: 100
    });

    // Update display
    this.updateModalDisplay();
    this.saveProgressiveAllocations();

    console.log(`✅ Updated ${itemId}: ${businessPercentage}% business, ${pct}% benefits`);
  }

  addItemWithPercentage(itemId) {
    console.log(`➕ Adding item ${itemId} to selection with percentage`);
    
    // Get the current percentage from the slider
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    const slider = itemElement ? itemElement.querySelector('input[type="range"]') : null;
    const percentage = slider ? parseInt(slider.value) : 0;
    
    // Use the progressive allocation system
    this.updateProgressiveAllocation(itemId, percentage);
  }

  updateAddButtonText(itemId) {
    // Update button text for both available and selected lists
    const availableElement = document.querySelector(`#availableItems [data-item-id="${itemId}"]`);
    const selectedElement = document.querySelector(`#selectedItems [data-item-id="${itemId}"]`);
    
    const progressiveAlloc = this.itemProgressiveAllocations.get(itemId) || { allocated: 0, remaining: 100 };
    
    // Update available list button (for adding more to benefits)
    if (availableElement) {
      const slider = availableElement.querySelector('input[type="range"]');
      const button = availableElement.querySelector('.add-to-benefits-btn');
      const buttonText = availableElement.querySelector('.button-text');
      
      if (button && buttonText) {
        if (progressiveAlloc.remaining > 0) {
          // Can still allocate more to benefits
          const percentage = slider ? parseInt(slider.value) : progressiveAlloc.remaining;
          buttonText.textContent = `Add ${percentage}%`;
          button.className = 'btn btn-outline-success add-to-benefits-btn';
          button.setAttribute('onclick', `employeeBenefitsManager.updateProgressiveAllocation('${itemId}', ${percentage})`);
          button.title = `Add ${percentage}% more to benefits (currently ${progressiveAlloc.allocated}% allocated)`;
        } else {
          // Fully allocated - hide button or disable
          button.style.display = 'none';
        }
      }
    }
    
    // Update selected list button (for removing from benefits)
    if (selectedElement) {
      const button = selectedElement.querySelector('.add-to-benefits-btn');
      const buttonText = selectedElement.querySelector('.button-text');
      
      if (button && buttonText) {
        buttonText.textContent = 'Remove';
        button.className = 'btn btn-outline-danger add-to-benefits-btn';
        button.setAttribute('onclick', `employeeBenefitsManager.resetProgressiveAllocation('${itemId}')`);
        button.title = `Remove from benefits and reset allocation (${progressiveAlloc.allocated}% currently allocated)`;
      }
    }
  }

  updateProgressiveAllocation(itemId, additionalPercentage) {
    const pct = parseInt(additionalPercentage);
    console.log(`🔧 Adding ${pct}% to progressive allocation for ${itemId}`);
    
    if (pct < 0) return;
    
    // Get current progressive allocation
    const currentAlloc = this.itemProgressiveAllocations.get(itemId) || { allocated: 0, remaining: 100 };
    
    // Check if we have enough remaining to allocate
    if (pct > currentAlloc.remaining) {
      console.warn(`⚠️ Cannot allocate ${pct}% - only ${currentAlloc.remaining}% remaining`);
      return;
    }
    
    // Update the allocation
    const newAllocated = currentAlloc.allocated + pct;
    const newRemaining = 100 - newAllocated;
    
    this.itemProgressiveAllocations.set(itemId, {
      allocated: newAllocated,
      remaining: newRemaining
    });
    
    // Add to selected items when first allocated (any percentage > 0)
    if (currentAlloc.allocated === 0 && pct > 0) {
      this.selectedItems.add(itemId);
    }
    
    // Update display and save
    this.updateModalDisplay();
    this.updateAllButtonTexts();
    this.saveSelection();
    this.saveProgressiveAllocations();
    
    console.log(`✅ Added ${pct}% to ${itemId}: ${newAllocated}% allocated, ${newRemaining}% remaining`);
  }

  resetProgressiveAllocation(itemId) {
    console.log(`🔄 Resetting progressive allocation for ${itemId}`);
    
    // Reset to no allocation
    this.itemProgressiveAllocations.set(itemId, { allocated: 0, remaining: 100 });
    
    // Remove from selected items since allocation is now 0%
    this.selectedItems.delete(itemId);
    
    // Update display and save
    this.updateModalDisplay();
    this.updateAllButtonTexts();
    this.saveSelection();
    this.saveProgressiveAllocations();
    
    console.log(`✅ Reset allocation for ${itemId} to 0% allocated, 100% remaining`);
  }

  updateAllocation(itemId, percentage) {
    const pct = parseInt(percentage);
    console.log(`🔧 Updating allocation for ${itemId}: ${pct}%`);
    if (pct >= 0 && pct <= 100) {
      this.itemAllocations.set(itemId, pct);
      this.saveAllocations();
      // Update the display without full refresh for better UX
      this.updateItemDisplay(itemId);
      console.log(`✅ Allocation updated successfully for ${itemId}`);
    } else {
      console.warn(`⚠️ Invalid percentage: ${pct}% for item ${itemId}`);
    }
  }

  updateSliderDisplay(itemId, percentage) {
    const pct = parseInt(percentage);
    console.log(`📊 Updating slider display for ${itemId}: ${pct}%`);
    // Update the percentage display text in real-time
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
      const percentageDisplay = itemElement.querySelector('.percentage-display');
      if (percentageDisplay) {
        percentageDisplay.textContent = `${pct}%`;
        console.log(`✅ Slider display updated for ${itemId}`);
      } else {
        console.warn(`⚠️ Percentage display element not found for ${itemId}`);
      }
      
      // Update button text to show current slider value
      const button = itemElement.querySelector('.add-to-benefits-btn');
      const buttonText = itemElement.querySelector('.button-text');
      if (button && buttonText) {
        const progressiveAlloc = this.itemProgressiveAllocations.get(itemId) || { allocated: 0, remaining: 100 };
        
        // Check if this item is in the available list (can still add more)
        const isInAvailableList = itemElement.closest('#availableItems') !== null;
        
        if (isInAvailableList && progressiveAlloc.remaining > 0) {
          // In available list and can still allocate more
          buttonText.textContent = `Add ${pct}%`;
          button.setAttribute('onclick', `employeeBenefitsManager.updateProgressiveAllocation('${itemId}', ${pct})`);
          button.title = `Add ${pct}% more to benefits (currently ${progressiveAlloc.allocated}% allocated)`;
        }
      }
    } else {
      console.warn(`⚠️ Item element not found for ${itemId}`);
    }
  }

  resetAllocation(itemId) {
    this.itemAllocations.set(itemId, 100);
    this.saveAllocations();
    this.updateItemDisplay(itemId);
    // Update button text after reset
    this.updateAddButtonText(itemId);
  }

  updateItemDisplay(itemId) {
    // Find and update the specific item's display
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
      const allocation = this.itemAllocations.get(itemId) || 100;
      const item = this.amazonItems.find(i => i.id === itemId);
      if (item) {
        const benefitsAmount = (item.price * allocation) / 100;
        const operationalAmount = item.price - benefitsAmount;

        // Update percentage display
        const percentageDisplay = itemElement.querySelector('.text-success.fw-bold');
        if (percentageDisplay) {
          percentageDisplay.textContent = `${allocation}%`;
        }

        // Update range input
        const rangeInput = itemElement.querySelector('input[type="range"]');
        if (rangeInput) {
          rangeInput.value = allocation;
        }

        // Update percentage text next to slider
        const percentageText = itemElement.querySelector('small.text-muted[style*="min-width"]');
        if (percentageText) {
          percentageText.textContent = `${allocation}%`;
        }

        // Update amounts
        const benefitsText = itemElement.querySelector('.text-success');
        const opsText = itemElement.querySelector('.text-muted');
        if (benefitsText && opsText) {
          benefitsText.textContent = `Benefits: $${benefitsAmount.toFixed(2)}`;
          opsText.textContent = `Ops: $${operationalAmount.toFixed(2)}`;
        }

        // Update button text if item is not selected
        this.updateAddButtonText(itemId);
      }
    }
  }

  filterItems(type, searchTerm) {
    // type expected: 'business' or 'benefits'
    const containerId = type === 'business' ? 'businessSuppliesList' : 'benefitsList';
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = container.querySelectorAll('.col-md-6, .list-group-item');
    const term = (searchTerm || '').toLowerCase().trim();

    items.forEach(item => {
      const name = (item.dataset.itemName || '').toLowerCase();
      // If search term is empty, show all
      const matches = term === '' ? true : name.includes(term);
      item.style.display = matches ? '' : 'none';
    });
  }

  clearSelection() {
    if (confirm('Are you sure you want to clear all selected items and their allocations?')) {
      this.selectedItems.clear();
      this.itemAllocations.clear();
      this.updateModalItems();
      this.saveSelection();
      this.saveAllocations();
    }
  }

  saveSelection() {
    try {
      const selectedArray = Array.from(this.selectedItems);
      localStorage.setItem(this.storageKey, JSON.stringify(selectedArray));
      console.log(`💾 Saved ${selectedArray.length} selected items to localStorage`);
    } catch (error) {
      console.error('❌ Error saving selection:', error);
    }
  }

  saveProgressiveAllocations() {
    try {
      const progressiveObject = Object.fromEntries(this.itemProgressiveAllocations);
      localStorage.setItem(this.progressiveAllocationStorageKey, JSON.stringify(progressiveObject));
      console.log(`💾 Saved ${this.itemProgressiveAllocations.size} progressive allocations to localStorage`);
    } catch (error) {
      console.error('❌ Error saving progressive allocations:', error);
    }
  }

  loadSavedProgressiveAllocations() {
    try {
      const saved = localStorage.getItem(this.progressiveAllocationStorageKey);
      if (saved) {
        const progressiveObject = JSON.parse(saved);
        this.itemProgressiveAllocations = new Map(Object.entries(progressiveObject));
        // Normalize any legacy allocation shapes so rest of the code can assume a single schema
        this.normalizeProgressiveAllocations();
        console.log(`📁 Loaded ${this.itemProgressiveAllocations.size} progressive allocations from localStorage`);
      }
    } catch (error) {
      console.error('❌ Error loading saved progressive allocations:', error);
    }
  }

  // Normalize progressive allocation objects so both old and new shapes work.
  // Expected canonical shape: { benefits: Number, business: Number, total: 100 }
  normalizeProgressiveAllocations() {
    try {
      const normalized = new Map();
      this.itemProgressiveAllocations.forEach((val, key) => {
        // val may be stored as a JSON string-like object or with legacy keys
        const obj = (typeof val === 'string') ? JSON.parse(val) : (val || {});

        let benefits = null;
        let business = null;
        let total = 100;

        // New shape: benefits / business
        if (obj.hasOwnProperty('benefits') || obj.hasOwnProperty('business')) {
          benefits = Number(obj.benefits) || 0;
          business = Number(obj.business);
          // if business is missing, derive from benefits
          if (!Number.isFinite(business)) business = 100 - benefits;
        }

        // Legacy shape: allocated / remaining
        if ((benefits === null) && (obj.hasOwnProperty('allocated') || obj.hasOwnProperty('remaining'))) {
          benefits = Number(obj.allocated) || 0;
          business = Number(obj.remaining);
          if (!Number.isFinite(business)) business = 100 - benefits;
        }

        // Fallback to default
        if (!Number.isFinite(benefits)) benefits = 0;
        if (!Number.isFinite(business)) business = 100 - benefits;

        normalized.set(key, {
          benefits: Math.max(0, Math.min(100, Math.round(benefits))),
          business: Math.max(0, Math.min(100, Math.round(business))),
          total: Number.isFinite(obj.total) ? Number(obj.total) : 100
        });
      });

      this.itemProgressiveAllocations = normalized;
    } catch (err) {
      console.warn('⚠️ Unable to normalize progressive allocations:', err);
    }
  }

  loadSavedSelection() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const selectedArray = JSON.parse(saved);
        this.selectedItems = new Set(selectedArray);
        console.log(`📁 Loaded ${selectedArray.length} selected items from localStorage`);
      }
    } catch (error) {
      console.error('❌ Error loading saved selection:', error);
    }

    // Also load allocations
    this.loadSavedAllocations();
    this.loadSavedProgressiveAllocations();
    
    // Ensure selectedItems set is consistent with progressive allocations
    this.reconcileSelectedItemsWithProgressiveAllocations();
    
    this.updateModalItems();
  }

  reconcileSelectedItemsWithProgressiveAllocations() {
    // Ensure that items with any allocation (> 0%) are in selectedItems
    this.amazonItems.forEach(item => {
      const progressiveAlloc = this.itemProgressiveAllocations.get(item.id) || { allocated: 0, remaining: 100 };
      if (progressiveAlloc.allocated > 0) {
        this.selectedItems.add(item.id);
      }
    });
    
    // Remove items from selectedItems that have 0% allocation
    const itemsToRemove = [];
    this.selectedItems.forEach(itemId => {
      const progressiveAlloc = this.itemProgressiveAllocations.get(itemId) || { allocated: 0, remaining: 100 };
      if (progressiveAlloc.allocated === 0) {
        itemsToRemove.push(itemId);
      }
    });
    
    itemsToRemove.forEach(itemId => {
      this.selectedItems.delete(itemId);
    });
  }

  loadSavedAllocations() {
    try {
      const saved = localStorage.getItem(this.allocationStorageKey);
      if (saved) {
        const allocationsObject = JSON.parse(saved);
        this.itemAllocations = new Map(Object.entries(allocationsObject));
        console.log(`📁 Loaded ${this.itemAllocations.size} item allocations from localStorage`);
      }
    } catch (error) {
      console.error('❌ Error loading saved allocations:', error);
    }
  }

  async generateBenefitsReport() {
    try {
      const selectedIds = Array.from(this.selectedItems);

      if (selectedIds.length === 0) {
        alert('Please select at least one item for the benefits report.');
        return;
      }

      console.log('📊 Generating benefits report for', selectedIds.length, 'items...');

      // Prepare allocation data for selected items using progressive allocations
      const itemAllocations = {};
      selectedIds.forEach(itemId => {
        const progressiveAlloc = this.itemProgressiveAllocations.get(itemId) || { allocated: 0, remaining: 100 };
        itemAllocations[itemId] = progressiveAlloc.allocated;
      });

      const response = await fetch('/api/employee-benefits-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemIds: selectedIds,
          itemAllocations: itemAllocations
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate benefits report');
      }

      const report = await response.json();
      this.displayBenefitsReport(report);

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById(this.modalId));
      modal.hide();

    } catch (error) {
      console.error('❌ Error generating benefits report:', error);
      alert('Error generating benefits report. Please try again.');
    }
  }

  displayBenefitsReport(report) {
    console.log('📋 Benefits Report:', report);

    // Create or update summary display
    let summaryContainer = document.getElementById('summaryContainer');
    if (!summaryContainer) {
      summaryContainer = document.createElement('div');
      summaryContainer.id = 'summaryContainer';
      document.body.appendChild(summaryContainer);
    }

    const summary = report.summary;
    const allocation = report.allocationBreakdown;

    summaryContainer.innerHTML = `
      <div class="card mt-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Benefits Analysis Report</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6 class="text-success">Benefits Summary</h6>
              <div class="list-group list-group-flush">
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  Total Items Selected
                  <span class="badge bg-primary">${summary.itemCount}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  Average Allocation
                  <span class="badge bg-info">${allocation.averageAllocationPercentage}%</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  Benefits Amount
                  <span class="badge bg-success">$${allocation.totalBenefitsAmount.toFixed(2)}</span>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  Operational Amount
                  <span class="badge bg-secondary">$${allocation.totalOperationalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="text-primary">Category Breakdown</h6>
              <div class="list-group list-group-flush">
                ${Object.entries(summary.categories).map(([category, data]) => `
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    ${this.getCategoryLabel(category)}
                    <div class="text-end">
                      <small class="text-muted">${data.count} items</small><br>
                      <small class="text-success">$${data.benefitsAmount?.toFixed(2) || '0.00'}</small>
                      <small class="text-muted">/ $${data.operationalAmount?.toFixed(2) || '0.00'}</small>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="mt-4">
            <h6>Selected Items with Allocations</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th class="text-end">Total Price</th>
                    <th class="text-center">Allocation</th>
                    <th class="text-end">Benefits</th>
                    <th class="text-end">Operational</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td><small>${this.getCategoryLabel(item.category)}</small></td>
                      <td class="text-end">$${item.price.toFixed(2)}</td>
                      <td class="text-center">${item.allocationPercentage}%</td>
                      <td class="text-end text-success">$${item.benefitsAmount.toFixed(2)}</td>
                      <td class="text-end text-muted">$${item.operationalAmount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Scroll to summary
    summaryContainer.scrollIntoView({ behavior: 'smooth' });
  }

  getCategoryLabel(category) {
    const labels = {
      'employee_amenities': 'Employee Amenities',
      'office_supplies': 'Office Supplies',
      'cleaning_supplies': 'Cleaning & Safety',
      'kitchen_equipment': 'Kitchen Equipment',
      'wellness_comfort': 'Wellness & Comfort',
      'employee_tech': 'Employee Technology',
      'safety_security': 'Safety & Security',
      'other': 'Other Items'
    };
    return labels[category] || category;
  }

  showSelectionModal() {
    // Ensure modal exists
    if (!document.getElementById(this.modalId)) {
      this.createSelectionModal();
      this.setupEventListeners();
    }
    
    // Populate items
    this.updateModalItems();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById(this.modalId));
    modal.show();
  }

  // Alternative method name for consistency
  openModal() {
    this.showSelectionModal();
  }

  // Select all available items
  selectAll() {
    this.amazonItems.forEach(item => {
      this.selectedItems.add(item.id);
    });
    this.updateModalItems();
    this.showMessage('Selected all items', 'success');
  }

  // Deselect all items
  deselectAll() {
    this.selectedItems.clear();
    this.updateModalItems();
    this.showMessage('Deselected all items', 'info');
  }

  // Save selection and close modal
  saveAndCloseModal() {
    this.saveSelection();
    const modal = bootstrap.Modal.getInstance(document.getElementById('employeeBenefitsModal'));
    if (modal) {
      modal.hide();
    }
    this.showMessage(`Saved ${this.selectedItems.size} items as benefits`, 'success');
  }

  // Legacy methods for backward compatibility
  populateItemsDropdown() {
    // This method is now replaced by updateModalItems
    console.log('Legacy populateItemsDropdown called - using new modal interface');
  }

  setupEventListeners() {
    // Set up modal event listeners
    const modal = document.getElementById('employeeBenefitsModal');
    if (modal) {
      // Select All button
      const selectAllBtn = document.getElementById('selectAllItems');
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => this.selectAll());
      }
      
      // Deselect All button  
      const deselectAllBtn = document.getElementById('deselectAllItems');
      if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => this.deselectAll());
      }
      
      // Save Selection button
      const saveBtn = document.getElementById('saveSelection');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.saveAndCloseModal());
      }
      
      console.log('✅ Modal event listeners set up');
    } else {
      console.warn('⚠️ Modal not found - event listeners not set up');
    }
  }

  // Legacy method for backward compatibility
  extractAmazonItems(analysisData) {
    console.log('Legacy extractAmazonItems called - data now loaded directly from API');
    return [];
  }

  // Legacy method for backward compatibility  
  loadDemoAmazonItems() {
    console.log('📦 Loading demo Amazon items...');
    // Keep minimal demo functionality for fallback
    
    this.amazonItems = [
      {
        id: 'demo_1',
        name: 'Bounty Paper Towels Quick Size, White, 16 Family Rolls',
        price: '$39.47',
        date: '2025-09-06',
        category: 'office_supplies'
      },
      {
        id: 'demo_2',
        name: 'Tide Free & Gentle Liquid Laundry Detergent, 100 Loads',
        price: '$16.28',
        date: '2025-09-06',
        category: 'office_supplies'
      },
      {
        id: 'demo_3',
        name: 'Pure Life Purified Water Bottles, 24 Pack',
        price: '$8.48',
        date: '2025-09-05',
        category: 'employee_amenities'
      },
      {
        id: 'demo_4',
        name: 'Keurig K-Cup Coffee Pods Variety Pack',
        price: '$42.99',
        date: '2025-09-04',
        category: 'employee_amenities'
      },
      {
        id: 'demo_5',
        name: 'Sterilite Storage Containers with Lids',
        price: '$24.99',
        date: '2025-09-03',
        category: 'office_supplies'
      },
      {
        id: 'demo_6',
        name: 'Lysol Disinfecting Wipes, Multi-Surface',
        price: '$18.75',
        date: '2025-09-02',
        category: 'cleaning_supplies'
      }
    ];
    
    this.updateModalItems();
  }

  // Quick select category method
  quickSelectCategory(category) {
    this.openModal();
    
    // Wait for modal to open and data to load
    setTimeout(() => {
      // First, deselect all items
      this.deselectAll();
      
      // Then select all items in the specified category
      this.selectCategoryItems(category);
      
      // Show feedback message
      const categoryName = this.getCategoryDisplayName(category);
      this.showMessage(`Selected all items in ${categoryName} category`, 'success');
    }, 300);
  }
  
  // Get display name for category
  getCategoryDisplayName(category) {
    const categoryNames = {
      'employee_amenities': 'Employee Amenities',
      'wellness_comfort': 'Wellness & Comfort',
      'kitchen_equipment': 'Kitchen Equipment',
      'office_supplies': 'Office Supplies',
      'employee_tech': 'Employee Technology',
      'cleaning_supplies': 'Cleaning Supplies',
      'safety_security': 'Safety & Security'
    };
    return categoryNames[category] || category;
  }
  
  // Show message to user
  showMessage(text, type = 'info') {
    // Create or update message alert
    let messageDiv = document.getElementById('benefitsMessage');
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = 'benefitsMessage';
      messageDiv.className = 'alert alert-dismissible fade show';
      messageDiv.style.position = 'fixed';
      messageDiv.style.top = '20px';
      messageDiv.style.right = '20px';
      messageDiv.style.zIndex = '9999';
      messageDiv.style.maxWidth = '300px';
      document.body.appendChild(messageDiv);
    }
    
    messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
    messageDiv.innerHTML = `
      ${text}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (messageDiv && messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }

  // Essential legacy methods simplified
  estimateItemPrice(totalPrice, itemCount) {
    if (!totalPrice || !itemCount || itemCount === 0) return 'N/A';
    const numericTotal = typeof totalPrice === 'string' ? 
      parseFloat(totalPrice.replace(/[$,]/g, '')) : totalPrice;
    return `$${(numericTotal / itemCount).toFixed(2)}`;
  }

  loadDemoData() {
    console.log('🎭 Loading demo Amazon items for testing...');
    this.amazonItems = [
      { id: 'demo-1', name: 'Premium Coffee K-Cups', price: '$24.99', category: 'employee_amenities' },
      { id: 'demo-2', name: 'Office Paper - White 8.5x11', price: '$15.49', category: 'office_supplies' },
      { id: 'demo-3', name: 'Ergonomic Office Chair', price: '$199.99', category: 'wellness_comfort' },
      { id: 'demo-4', name: 'Hand Sanitizer Bottles', price: '$12.99', category: 'cleaning_supplies' },
      { id: 'demo-5', name: 'Wireless Keyboard and Mouse', price: '$49.99', category: 'employee_tech' }
    ];
    console.log(`📦 Loaded ${this.amazonItems.length} demo items`);
  }

  suggestCategory(itemName) {
    const name = itemName.toLowerCase();
    if (name.includes('coffee') || name.includes('tea') || name.includes('water')) {
      return 'employee_amenities';
    }
    if (name.includes('paper') || name.includes('office') || name.includes('supplies')) {
      return 'office_supplies';
    }
    return 'other';
  }

  // Edit item functionality
  editItem(itemId) {
    const item = this.amazonItems.find(item => item.id === itemId);
    if (!item) {
      console.error('Item not found:', itemId);
      return;
    }

    // Populate the edit modal with current item data
    document.getElementById('editItemId').value = itemId;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemCategory').value = item.category || 'other';
    document.getElementById('editItemAmount').value = item.price; // price is already a number
    document.getElementById('editItemDescription').value = item.description || '';

    // Show the edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editItemModal'));
    editModal.show();
  }

  async saveItemChanges() {
    const itemId = document.getElementById('editItemId').value;
    const category = document.getElementById('editItemCategory').value;
    const amount = document.getElementById('editItemAmount').value;
    const description = document.getElementById('editItemDescription').value;

    try {
      const response = await fetch(`/api/amazon-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          description
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update the item in our local array
      const item = this.amazonItems.find(item => item.id === itemId);
      if (item) {
        item.category = category;
        item.price = parseFloat(amount);
        item.priceFormatted = `$${amount}`;
        item.description = description;
      }

      // Refresh the display
      this.updateModalItems();

      // Hide the edit modal
      const editModal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
      if (editModal) {
        editModal.hide();
      }

      this.showMessage('Item updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating item:', error);
      this.showMessage('Error updating item. Please try again.', 'error');
    }
  }

  cancelItemEdit() {
    // Hide the edit modal
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
    if (editModal) {
      editModal.hide();
    }
  }

  async showSelectionModal() {
    console.log('🎯 showSelectionModal called');

    // Modal is created during initialization, no need to check here

    // Show the main benefits configuration modal
    const modal = new bootstrap.Modal(document.getElementById(this.modalId));
    modal.show();

    // Load data if not already loaded
    if (this.amazonItems.length === 0) {
      console.log('📊 Loading Amazon items...');
      await this.loadAmazonItems();
    }

    console.log('📊 Amazon items loaded:', this.amazonItems.length);

    // Refresh the display after ensuring data is loaded
    this.updateModalDisplay();

    console.log('🎯 Modal display updated');
  }

  updateModalDisplay() {
    console.log('🔄 Updating modal display with', this.amazonItems.length, 'items');
    
    if (this.amazonItems.length === 0) {
      console.warn('⚠️ No Amazon items loaded yet');
      return;
    }

    // Get containers
    const businessContainer = document.getElementById('businessSuppliesList');
    const benefitsContainer = document.getElementById('benefitsList');
    
    if (!businessContainer || !benefitsContainer) {
      console.error('❌ Modal containers not found');
      return;
    }

    // Clear containers
    businessContainer.innerHTML = '';
    benefitsContainer.innerHTML = '';

    // BUG FIX: Benefits Allocation UI Issue (October 16, 2025)
    // Previously, ALL items were shown in business column regardless of allocation,
    // causing items with 0% business allocation to incorrectly appear in business column.
    // Fixed by filtering items to only show in columns where they have >0% allocation.
    //
    // Before fix: const businessItems = this.amazonItems; // Showed ALL items
    // After fix: Filter based on allocation.business > 0
    const businessItems = [];
    const benefitsItems = [];

    this.amazonItems.forEach(item => {
      const allocation = this.itemProgressiveAllocations.get(item.id) || { benefits: 0, business: 100 };
      
      // Only show item in business column if it has business allocation > 0
      if (allocation.business > 0) {
        businessItems.push(item);
      }
      
      // Only show item in benefits column if it has benefits allocation > 0
      if (allocation.benefits > 0) {
        benefitsItems.push(item);
      }
    });

    // Populate business supplies (show all items with their business allocation)
    businessItems.forEach(item => {
      const card = this.createBusinessCard(item);
      businessContainer.appendChild(card);
    });

    // Populate benefits (only items with benefits allocation > 0)
    if (benefitsItems.length === 0) {
      benefitsContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>No benefits allocated yet. Use the sliders in Business Supplies to allocate portions to benefits.
          </div>
        </div>
      `;
    } else {
      benefitsItems.forEach(item => {
        const card = this.createBenefitsCard(item);
        benefitsContainer.appendChild(card);
      });
    }

    // Update summary stats
    this.updateSummaryStats(businessItems, benefitsItems);

    // Update counts
    const businessCountEl = document.getElementById('businessItemsCount');
    const benefitsCountEl = document.getElementById('benefitsItemsCount');
    
    if (businessCountEl) businessCountEl.textContent = `${businessItems.length} items`;
    if (benefitsCountEl) benefitsCountEl.textContent = `${benefitsItems.length} items`;

    console.log('✅ Modal display updated successfully');
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.EmployeeBenefitsManager = EmployeeBenefitsManager;
}

// SPA / fragment navigation integration
// Ensure the benefits manager initializes when the app navigates via hash
function _initBenefitsIfNeeded() {
  try {
    const statusEl = document.getElementById('selectionStatus');
    // If the status element isn't present on the page, nothing to do
    if (!statusEl) return;

    // If manager already exists, just refresh the status
      if (window.employeeBenefitsManager) {
        // If the existing global is a proper manager (has initialize fn), use it.
        if (typeof window.employeeBenefitsManager.initialize === 'function') {
          if (!window.employeeBenefitsManager.initialized) {
            window.employeeBenefitsManager.initialize().then(() => {
              try { window.employeeBenefitsManager.updateSelectionStatus(); } catch (e) {}
            }).catch(err => console.error('Error initializing benefits manager on SPA navigation:', err));
          } else {
            try { window.employeeBenefitsManager.updateSelectionStatus(); } catch (e) {}
          }
          return;
        }

        // Otherwise the global appears to be a stub or older shape; replace with a real instance
        try {
          console.warn('Replacing stubbed employeeBenefitsManager with real instance');
        } catch (e) {}
        window.employeeBenefitsManager = new EmployeeBenefitsManager();
        window.employeeBenefitsManager.initialize().then(() => {
          try { window.employeeBenefitsManager.updateSelectionStatus(); } catch (e) {}
        }).catch(err => console.error('Error initializing benefits manager on SPA navigation (replaced stub):', err));
        return;
      }

    // Otherwise create and initialize the manager (only when the benefits UI is present)
    window.employeeBenefitsManager = new EmployeeBenefitsManager();
    window.employeeBenefitsManager.initialize().then(() => {
      window.employeeBenefitsManager.updateSelectionStatus();
    }).catch(err => console.error('Error initializing benefits manager on SPA navigation (new):', err));
  } catch (e) {
    console.error('Error in _initBenefitsIfNeeded:', e);
  }
}

// Wire up common SPA navigation signals
if (typeof window !== 'undefined') {
  // Full page load should initialize (already performed by page script that calls updateSelectionStatus),
  // but attaching ensures pages loaded via fragments also initialize.
  window.addEventListener('hashchange', () => {
    // small delay to let the view render
    setTimeout(_initBenefitsIfNeeded, 50);
  }, false);

  // Some apps emit custom events when a section is shown — listen for common names.
  document.addEventListener('section:shown', (ev) => {
    const detail = ev && ev.detail ? ev.detail : '';
    if (typeof detail === 'string' && detail.toLowerCase().includes('benefit')) {
      setTimeout(_initBenefitsIfNeeded, 50);
    }
  }, false);

  document.addEventListener('menu:section:shown', (ev) => {
    const detail = ev && ev.detail ? ev.detail : '';
    if (typeof detail === 'string' && detail.toLowerCase().includes('benefit')) {
      setTimeout(_initBenefitsIfNeeded, 50);
    }
  }, false);

  // Safety: call once shortly after load in case other scripts didn't call the inline initializer
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(_initBenefitsIfNeeded, 200);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(_initBenefitsIfNeeded, 200));
  }
}

// SPA-aware helpers: ensure the benefits manager initializes when the app
// navigates by hash (single-page navigation), not only on full page load.
if (typeof window !== 'undefined') {
  // Avoid clobbering an existing helper
  if (!window.ensureBenefitsInitialized) {
    window.ensureBenefitsInitialized = async function() {
      try {
        // Prefer the page-scoped variable if present
        const globalVar = window.employeeBenefitsManager || window._employeeBenefitsManager || null;
        if (globalVar && globalVar.initialized) {
          // Already initialized — just refresh status
          try { globalVar.updateSelectionStatus(); } catch (e) {}
          return globalVar;
        }

        // Create/use page-scoped variable if available. If an existing global is a stub
        // (for example index page provides a thin shim), replace it with a real manager
        if (!window.employeeBenefitsManager || typeof window.employeeBenefitsManager.initialize !== 'function') {
          window.employeeBenefitsManager = new EmployeeBenefitsManager();
        }

        await window.employeeBenefitsManager.initialize();
        try { window.employeeBenefitsManager.updateSelectionStatus(); } catch (e) {}
        return window.employeeBenefitsManager;
      } catch (err) {
        console.error('ensureBenefitsInitialized failed:', err);
        return null;
      }
    };
  }

  // When SPA hash changes, initialize/update the benefits manager if the
  // benefits section becomes active.
  window.addEventListener('hashchange', () => {
    try {
      const section = window.location.hash ? window.location.hash.replace('#', '') : '';
      if (section === 'benefits-management') {
        // Fire-and-forget initialization (don't block navigation)
        window.ensureBenefitsInitialized().catch(() => {});
      }
    } catch (e) {}
  });

  // Also attempt initialization immediately if the current hash points to benefits
  try {
    const initialSection = window.location.hash ? window.location.hash.replace('#', '') : '';
    if (initialSection === 'benefits-management') {
      // Non-blocking
      window.ensureBenefitsInitialized().catch(() => {});
    }
  } catch (e) {}
}
