#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Amazon Data Format Comparison Analysis');
console.log('==========================================\n');

// Analysis of Amazon Official Data vs Scraped Data
const analysisReport = {
    officialData: {
        pros: [],
        cons: [],
        structure: {},
        files: []
    },
    scrapedData: {
        pros: [],
        cons: [],
        structure: {},
        files: []
    },
    recommendation: ''
};

// Analyze file sizes and structures
function analyzeFileStructure() {
    console.log('📊 FILE STRUCTURE ANALYSIS');
    console.log('==========================\n');
    
    // Check scraped data
    try {
        const scrapedStats = fs.statSync('amazon_order_history.csv');
        console.log('📁 SCRAPED DATA:');
        console.log(`   File: amazon_order_history.csv`);
        console.log(`   Size: ${(scrapedStats.size / 1024).toFixed(1)} KB`);
        
        const scrapedContent = fs.readFileSync('amazon_order_history.csv', 'utf8');
        const scrapedLines = scrapedContent.split('\n').length - 1;
        console.log(`   Records: ~${scrapedLines} orders`);
        
        // Parse header
        const scrapedHeader = scrapedContent.split('\n')[0];
        const scrapedFields = scrapedHeader.split(',').map(f => f.trim());
        console.log(`   Fields (${scrapedFields.length}):`, scrapedFields.slice(0, 5).join(', '), '...');
        
        analysisReport.scrapedData.structure = {
            file: 'amazon_order_history.csv',
            size_kb: (scrapedStats.size / 1024).toFixed(1),
            records: scrapedLines,
            fields: scrapedFields.length,
            sample_fields: scrapedFields.slice(0, 8)
        };
        
    } catch (error) {
        console.log('❌ Could not analyze scraped data:', error.message);
    }
    
    console.log('\n📁 AMAZON OFFICIAL DATA:');
    
    // Analyze official data files
    const officialFiles = [
        'Retail.OrderHistory.1/Retail.OrderHistory.1.csv',
        'Digital-Ordering.1/Digital Orders.csv',
        'Digital-Ordering.1/Digital Items.csv',
        'Retail.CartItems.1/Retail.CartItems.1.csv'
    ];
    
    let totalOfficialRecords = 0;
    let totalOfficialSizeKB = 0;
    
    officialFiles.forEach(file => {
        try {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n').length - 1;
                const sizeKB = (stats.size / 1024).toFixed(1);
                
                console.log(`   ${file}`);
                console.log(`     Size: ${sizeKB} KB, Records: ${lines}`);
                
                // Get field count
                const header = content.split('\n')[0];
                const fields = header.split(',').length;
                console.log(`     Fields: ${fields}`);
                
                totalOfficialRecords += lines;
                totalOfficialSizeKB += parseFloat(sizeKB);
                
                analysisReport.officialData.files.push({
                    name: file,
                    size_kb: sizeKB,
                    records: lines,
                    fields: fields
                });
            }
        } catch (error) {
            console.log(`     ❌ Error reading ${file}:`, error.message);
        }
    });
    
    console.log(`\n📈 TOTALS:`);
    console.log(`   Official Data: ${totalOfficialSizeKB.toFixed(1)} KB, ${totalOfficialRecords} records`);
    
    return { totalOfficialRecords, totalOfficialSizeKB };
}

// Compare data quality and completeness
function compareDataQuality() {
    console.log('\n🎯 DATA QUALITY COMPARISON');
    console.log('===========================\n');
    
    // Scraped data pros/cons
    analysisReport.scrapedData.pros = [
        'Single unified file format',
        'Contains shipping URLs and tracking info',
        'Includes invoice links for easy access',
        'Human-readable delivery status',
        'Already processed and cleaned',
        'Includes refund information'
    ];
    
    analysisReport.scrapedData.cons = [
        'No ASIN (Amazon product identifiers)',
        'Limited product categorization data',
        'No detailed tax breakdowns',
        'Missing carrier tracking numbers',
        'No product condition information',
        'Dependent on web scraping (fragile)',
        'May miss orders or have incomplete data'
    ];
    
    // Official data pros/cons
    analysisReport.officialData.pros = [
        'Complete and authoritative data source',
        'Includes ASINs for product matching',
        'Detailed tax and pricing breakdowns',
        'Product condition information',
        'Carrier names and tracking numbers',
        'Digital orders included separately',
        'Return/refund data in separate files',
        'Guaranteed data completeness',
        'Multiple data perspectives (retail, digital, returns)'
    ];
    
    analysisReport.officialData.cons = [
        'Multiple files to process and merge',
        'More complex data structure',
        'Requires significant data transformation',
        'Less human-readable format',
        'No direct invoice URLs',
        'Manual export process required'
    ];
    
    // Print comparison
    console.log('✅ SCRAPED DATA ADVANTAGES:');
    analysisReport.scrapedData.pros.forEach(pro => console.log(`   • ${pro}`));
    
    console.log('\n❌ SCRAPED DATA LIMITATIONS:');
    analysisReport.scrapedData.cons.forEach(con => console.log(`   • ${con}`));
    
    console.log('\n✅ OFFICIAL DATA ADVANTAGES:');
    analysisReport.officialData.pros.forEach(pro => console.log(`   • ${pro}`));
    
    console.log('\n❌ OFFICIAL DATA LIMITATIONS:');
    analysisReport.officialData.cons.forEach(con => console.log(`   • ${con}`));
}

// Make recommendation
function makeRecommendation() {
    console.log('\n🎯 RECOMMENDATION ANALYSIS');
    console.log('===========================\n');
    
    let recommendation = '';
    let reasoning = [];
    
    // Factors to consider
    const factors = {
        dataCompleteness: 'official', // Official data is more complete
        dataAccuracy: 'official',     // Official data is authoritative
        easeOfProcessing: 'scraped',  // Scraped data is easier to process
        developmentEffort: 'scraped', // Less work to continue with scraped
        dataRichness: 'official',     // Official has more fields
        reliability: 'official',      // Official won't break like scraping
        maintenance: 'official'       // Official requires less maintenance
    };
    
    const officialScore = Object.values(factors).filter(v => v === 'official').length;
    const scrapedScore = Object.values(factors).filter(v => v === 'scraped').length;
    
    console.log('🏆 SCORING:');
    console.log(`   Official Data: ${officialScore}/7 factors`);
    console.log(`   Scraped Data: ${scrapedScore}/7 factors`);
    
    if (officialScore > scrapedScore) {
        recommendation = 'SWITCH TO OFFICIAL AMAZON DATA';
        reasoning = [
            'More complete and authoritative data source',
            'Includes ASINs enabling better product categorization',
            'Provides detailed tax and pricing breakdowns',
            'More reliable than web scraping',
            'Supports better business intelligence analytics',
            'Future-proof against Amazon website changes'
        ];
    } else {
        recommendation = 'CONTINUE WITH SCRAPED DATA';
        reasoning = [
            'Current data processing pipeline already works',
            'Less development effort required',
            'Simpler data structure to work with'
        ];
    }
    
    analysisReport.recommendation = recommendation;
    
    console.log(`\n🎯 RECOMMENDATION: ${recommendation}\n`);
    console.log('📋 REASONING:');
    reasoning.forEach(reason => console.log(`   • ${reason}`));
    
    // Implementation strategy
    if (recommendation.includes('OFFICIAL')) {
        console.log('\n🚀 IMPLEMENTATION STRATEGY:');
        console.log('   1. Create a new parser for official Amazon CSV files');
        console.log('   2. Develop a unified data model combining retail + digital orders');
        console.log('   3. Build migration script to convert existing scraped data');
        console.log('   4. Update Benefits categorization to use ASINs');
        console.log('   5. Enhance analytics with new data fields (tax, carrier info)');
        console.log('   6. Create periodic data refresh workflow');
    } else {
        console.log('\n🔧 OPTIMIZATION STRATEGY:');
        console.log('   1. Improve scraped data parser reliability');
        console.log('   2. Add error handling for missing fields');
        console.log('   3. Consider hybrid approach using official data for validation');
    }
}

// Sample data comparison
function showSampleDataComparison() {
    console.log('\n📝 SAMPLE DATA COMPARISON');
    console.log('==========================\n');
    
    try {
        // Show scraped sample
        const scrapedContent = fs.readFileSync('amazon_order_history.csv', 'utf8');
        const scrapedLines = scrapedContent.split('\n');
        console.log('🔍 SCRAPED DATA SAMPLE:');
        console.log('Headers:', scrapedLines[0].split(',').slice(0, 4).join(', '), '...');
        if (scrapedLines[1]) {
            const values = scrapedLines[1].split(',');
            console.log('Sample Record:');
            console.log(`   Order ID: ${values[0]}`);
            console.log(`   Date: ${values[4]}`);
            console.log(`   Total: ${values[5]}`);
            console.log(`   Items: ${values[2]?.substring(0, 50)}...`);
        }
        
        console.log('\n🔍 OFFICIAL DATA SAMPLE:');
        const officialContent = fs.readFileSync('Retail.OrderHistory.1/Retail.OrderHistory.1.csv', 'utf8');
        const officialLines = officialContent.split('\n');
        const headers = officialLines[0].split(',');
        console.log('Headers:', headers.slice(0, 6).join(', '), '...');
        if (officialLines[1]) {
            const values = officialLines[1].split(',');
            console.log('Sample Record:');
            console.log(`   Order ID: ${values[1]}`);
            console.log(`   Date: ${values[2]}`);
            console.log(`   Total: ${values[9]}`);
            console.log(`   ASIN: ${values[12]}`);
            console.log(`   Product: ${values[23]?.substring(0, 50)}...`);
        }
        
    } catch (error) {
        console.log('❌ Error reading sample data:', error.message);
    }
}

// Main execution
function main() {
    const stats = analyzeFileStructure();
    compareDataQuality();
    showSampleDataComparison();
    makeRecommendation();
    
    console.log('\n📊 ANALYSIS COMPLETE');
    console.log('====================');
    console.log('This analysis can guide your decision on whether to migrate');
    console.log('to Amazon\'s official export data or continue with scraped data.\n');
    
    // Save analysis report
    fs.writeFileSync('amazon-data-analysis-report.json', JSON.stringify(analysisReport, null, 2));
    console.log('📄 Full analysis saved to: amazon-data-analysis-report.json');
}

if (require.main === module) {
    main();
}

module.exports = { analyzeFileStructure, compareDataQuality, makeRecommendation };
