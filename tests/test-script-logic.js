// Test the benefits allocation fix logic
const { JSDOM } = require('jsdom');

// Mock the manager
const mockManager = {
  itemProgressiveAllocations: {
    'test-item-1': { business: 0, benefits: 100 },
    'test-item-2': { business: 100, benefits: 0 },
    'test-item-3': { business: 50, benefits: 50 }
  }
};

// Create mock DOM
const dom = new JSDOM(`
    <div id="employeeBenefitsModal">
        <div id="businessSuppliesList">
            <div data-item-id="test-item-1">Item 1 (should be removed from business)</div>
            <div data-item-id="test-item-2">Item 2 (should stay in business)</div>
            <div data-item-id="test-item-3">Item 3 (should stay in business)</div>
        </div>
        <div id="benefitsList">
            <div data-item-id="test-item-1">Item 1 (should stay in benefits)</div>
            <div data-item-id="test-item-2">Item 2 (should be removed from benefits)</div>
            <div data-item-id="test-item-3">Item 3 (should stay in benefits)</div>
        </div>
    </div>
`);

global.window = dom.window;
global.document = dom.window.document;
global.employeeBenefitsManager = mockManager;

// Test the moveFullyAllocatedItems function
function moveFullyAllocatedItems() {
  try {
    const mgr = (typeof employeeBenefitsManager !== 'undefined') ? employeeBenefitsManager : (window.employeeBenefitsManager || null);
    if (!mgr || !mgr.itemProgressiveAllocations) {
      console.log('Benefits fix: manager or allocations not ready');
      return;
    }
    const allocations = mgr.itemProgressiveAllocations;
    const getAlloc = id => {
      if (!allocations) {
        return null;
      }
      if (typeof allocations.get === 'function') {
        return allocations.get(id) || null;
      }
      return allocations[id] || null;
    };
    const benefitsList = document.getElementById('benefitsList');
    const businessList = document.getElementById('businessSuppliesList');
    if (!benefitsList || !businessList) {
      console.log('Benefits fix: lists not found');
      return;
    }
    let removed = 0;
    // Remove items from business column if business allocation is 0%
    Array.from(businessList.querySelectorAll('[data-item-id]')).forEach(el => {
      const id = el.dataset.itemId;
      const prog = getAlloc(id) || {};
      const business = Number(prog.business || 0);
      if (business === 0) {
        el.remove();
        removed++;
        console.log('Benefits fix: removed', id, 'from business (business=0)');
      }
    });
    // Remove items from benefits column if benefits allocation is 0%
    Array.from(benefitsList.querySelectorAll('[data-item-id]')).forEach(el => {
      const id = el.dataset.itemId;
      const prog = getAlloc(id) || {};
      const benefits = Number(prog.benefits || 0);
      if (benefits === 0) {
        el.remove();
        removed++;
        console.log('Benefits fix: removed', id, 'from benefits (benefits=0)');
      }
    });
    if (removed > 0) {
      console.log('Benefits fix: removed', removed, 'items with 0% allocation');
    }
  } catch (e) {
    console.warn('Benefits allocation fix failed', e);
  }
}

console.log('=== BEFORE CLEANUP ===');
console.log('Business list:', document.getElementById('businessSuppliesList').innerHTML);
console.log('Benefits list:', document.getElementById('benefitsList').innerHTML);

moveFullyAllocatedItems();

console.log('=== AFTER CLEANUP ===');
console.log('Business list:', document.getElementById('businessSuppliesList').innerHTML);
console.log('Benefits list:', document.getElementById('benefitsList').innerHTML);
