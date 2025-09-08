/**
 * Employee Benefits Demo Script
 * Demonstrates the new Amazon item filtering and employee benefits categorization
 */

async function demoEmployeeBenefits() {
  console.log('\n🎯 Employee Benefits Demo Starting...');
  console.log('=' .repeat(60));

  try {
    // 1. Test Amazon Items API
    console.log('\n📦 1. Testing Amazon Items API...');
    const itemsResponse = await fetch('http://localhost:3000/api/amazon-items');
    
    if (!itemsResponse.ok) {
      throw new Error(`Items API failed: ${itemsResponse.status}`);
    }
    
    const amazonItems = await itemsResponse.json();
    console.log(`✅ Found ${amazonItems.length} Amazon items available for filtering`);
    
    // Show first few items as examples
    console.log('\n📋 Sample Amazon Items:');
    amazonItems.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name.substring(0, 50)}...`);
      console.log(`      Price: ${item.price} | Date: ${item.date} | Category: ${item.category}`);
    });

    // 2. Demonstrate Employee Benefits Filtering
    console.log('\n🏢 2. Testing Employee Benefits Filter...');
    
    // Select items that could be employee benefits
    const employeeBenefitItems = amazonItems.filter(item => {
      const name = item.name.toLowerCase();
      return name.includes('water') || 
             name.includes('coffee') || 
             name.includes('paper') || 
             name.includes('clean') ||
             name.includes('towel') ||
             item.category === 'employee_amenities' ||
             item.category === 'office_supplies' ||
             item.category === 'cleaning_supplies';
    });

    const selectedItemIds = employeeBenefitItems.slice(0, 8).map(item => item.id);
    
    console.log(`🎯 Selected ${selectedItemIds.length} items for employee benefits filter:`);
    employeeBenefitItems.slice(0, 8).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name.substring(0, 40)}... (${item.price})`);
    });

    // 3. Apply the filter
    console.log('\n🔍 3. Applying Employee Benefits Filter...');
    
    const filterResponse = await fetch('http://localhost:3000/api/employee-benefits-filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemIds: selectedItemIds
      })
    });

    if (!filterResponse.ok) {
      throw new Error(`Filter API failed: ${filterResponse.status}`);
    }

    const filterResult = await filterResponse.json();
    
    console.log('✅ Employee Benefits Filter Applied Successfully!');
    console.log('\n📊 Benefits Summary:');
    console.log(`   💰 Total Benefits Value: $${filterResult.summary.totalAmount.toFixed(2)}`);
    console.log(`   📦 Items Included: ${filterResult.summary.itemCount}`);
    console.log(`   🛒 Orders Included: ${filterResult.summary.orderCount}`);
    console.log(`   📈 Average Item Value: $${filterResult.summary.averageOrderValue.toFixed(2)}`);

    // 4. Show monthly breakdown
    console.log('\n📅 Monthly Breakdown:');
    filterResult.summary.monthlyBreakdown.forEach(month => {
      console.log(`   ${month.month}: $${month.amount.toFixed(2)} (${month.items} items)`);
    });

    // 5. Show category breakdown
    console.log('\n🏷️ Category Breakdown:');
    Object.keys(filterResult.summary.categories).forEach(category => {
      const cat = filterResult.summary.categories[category];
      console.log(`   ${category}: $${cat.amount.toFixed(2)} (${cat.count} items)`);
    });

    // 6. Business Impact Analysis
    console.log('\n💼 Business Impact Analysis:');
    const monthlyAverage = filterResult.summary.totalAmount / filterResult.summary.monthlyBreakdown.length;
    const annualProjection = monthlyAverage * 12;
    
    console.log(`   📊 Monthly Average: $${monthlyAverage.toFixed(2)}`);
    console.log(`   📈 Annual Projection: $${annualProjection.toFixed(2)}`);
    console.log(`   🏆 Tax Deduction Potential: $${(annualProjection * 0.25).toFixed(2)} (25% rate)`);

    // 7. Recommendations
    console.log('\n💡 Recommendations:');
    if (filterResult.summary.totalAmount > 500) {
      console.log('   ✓ Consider bulk purchasing for frequently ordered items');
    }
    if (filterResult.summary.categories.employee_amenities) {
      console.log('   ✓ Employee amenities may qualify for business tax deductions');
    }
    if (filterResult.summary.itemCount > 15) {
      console.log('   ✓ Consider setting up recurring orders for frequently purchased items');
    }
    console.log('   ✓ Track employee benefits separately for accurate expense reporting');
    console.log('   ✓ Use this data for budget planning and employee satisfaction metrics');

    // 8. UX Features Demo
    console.log('\n🎨 User Experience Features:');
    console.log('   ✓ Multi-select dropdown with category grouping');
    console.log('   ✓ Real-time filtering and summary calculations');
    console.log('   ✓ Visual category indicators and price sorting');
    console.log('   ✓ Persistent selections using localStorage');
    console.log('   ✓ Export functionality for reporting');
    console.log('   ✓ Integration with existing AI analysis');

    console.log('\n🎉 Employee Benefits Demo Complete!');
    console.log('=' .repeat(60));
    
    return {
      success: true,
      itemsFound: amazonItems.length,
      benefitsTotal: filterResult.summary.totalAmount,
      itemsFiltered: filterResult.summary.itemCount,
      monthlyAverage: monthlyAverage,
      annualProjection: annualProjection,
      categories: Object.keys(filterResult.summary.categories)
    };

  } catch (error) {
    console.error('❌ Demo Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Advanced UX Features Demo
function demoAdvancedUXFeatures() {
  console.log('\n🚀 Advanced UX Features Demo:');
  console.log('=' .repeat(60));

  const features = [
    {
      name: 'Navigation Menu System',
      description: 'Sidebar navigation with organized sections',
      benefits: ['No scrolling required', 'Quick access to features', 'Breadcrumb navigation']
    },
    {
      name: 'Amazon Item Multi-Select',
      description: 'Advanced dropdown with search and category grouping',
      benefits: ['Category organization', 'Search functionality', 'Visual price indicators']
    },
    {
      name: 'Employee Benefits Filter',
      description: 'Intelligent categorization of Amazon purchases',
      benefits: ['Tax deduction tracking', 'Budget planning', 'Expense reporting']
    },
    {
      name: 'Real-Time Analytics',
      description: 'Instant calculations and summaries',
      benefits: ['Monthly breakdowns', 'Category analysis', 'Trend visualization']
    },
    {
      name: 'Responsive Design',
      description: 'Mobile-friendly interface with collapsible sidebar',
      benefits: ['Mobile accessibility', 'Tablet optimization', 'Desktop efficiency']
    },
    {
      name: 'Data Persistence',
      description: 'Saves user selections and preferences',
      benefits: ['Session continuity', 'User preferences', 'Quick reapplication']
    }
  ];

  features.forEach((feature, index) => {
    console.log(`\n${index + 1}. ${feature.name}`);
    console.log(`   📝 ${feature.description}`);
    console.log(`   💡 Benefits:`);
    feature.benefits.forEach(benefit => {
      console.log(`      ✓ ${benefit}`);
    });
  });

  console.log('\n🎯 Overall UX Improvements:');
  console.log('   📱 Mobile-first responsive design');
  console.log('   🎨 Modern Bootstrap 5 styling with custom themes');
  console.log('   ⚡ Fast, intuitive navigation without page reloads');
  console.log('   📊 Comprehensive data visualization and filtering');
  console.log('   🤖 Seamless integration with AI analysis features');
  console.log('   💾 Persistent user preferences and selections');
}

// Run the demo
if (typeof window === 'undefined') {
  // Node.js environment
  const http = require('http');
  
  // Test server connectivity first
  const testConnection = () => {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Connection timeout')));
    });
  };

  testConnection()
    .then(() => {
      console.log('✅ Server connection verified');
      demoAdvancedUXFeatures();
      return demoEmployeeBenefits();
    })
    .then(result => {
      if (result.success) {
        console.log('\n🎊 Demo completed successfully!');
        console.log(`📈 Found ${result.itemsFound} Amazon items`);
        console.log(`💰 Benefits total: $${result.benefitsTotal}`);
        console.log(`📦 Items filtered: ${result.itemsFiltered}`);
        console.log(`📊 Monthly average: $${result.monthlyAverage.toFixed(2)}`);
        console.log(`🎯 Annual projection: $${result.annualProjection.toFixed(2)}`);
      }
    })
    .catch(error => {
      console.error('❌ Demo failed:', error.message);
      console.log('\n💡 Make sure the server is running with: node server.js');
    });
} else {
  // Browser environment
  console.log('🌐 Employee Benefits Demo available in browser console');
  window.demoEmployeeBenefits = demoEmployeeBenefits;
  window.demoAdvancedUXFeatures = demoAdvancedUXFeatures;
}

module.exports = { demoEmployeeBenefits, demoAdvancedUXFeatures };
