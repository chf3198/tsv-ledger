#!/bin/bash

# TSV Ledger Backend Testing Script
# Quick and easy backend testing without browser

echo "🚀 TSV Ledger Backend Test Runner"
echo "=================================="

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Server not running on port 3000"
    echo "💡 Start server with: node server.js"
    exit 1
fi

echo "✅ Server is running"

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo ""
    echo "🧪 Testing $name..."
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:3000$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "http://localhost:3000$endpoint")
    fi
    
    body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    if [ "$status" -eq 200 ] || [ "$status" -eq 201 ]; then
        echo "✅ $name - Status: $status"
        
        # Show relevant data for each endpoint
        case "$endpoint" in
            "/api/expenditures")
                count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "0")
                echo "   📊 Expenditures found: $count"
                ;;
            "/api/analysis")
                total=$(echo "$body" | jq '.overview.totalTransactions' 2>/dev/null || echo "0")
                amount=$(echo "$body" | jq '.overview.totalAmount' 2>/dev/null || echo "0")
                echo "   📈 Total transactions: $total"
                echo "   💰 Total amount: \$$amount"
                ;;
            "/api/amazon-items")
                items=$(echo "$body" | jq '. | length' 2>/dev/null || echo "0")
                echo "   🛒 Amazon items found: $items"
                ;;
            "/api/premium-status")
                premium=$(echo "$body" | jq '.premiumFeaturesAvailable' 2>/dev/null || echo "false")
                echo "   ⭐ Premium features: $premium"
                ;;
        esac
    else
        echo "❌ $name - Status: $status"
        if [ ${#body} -lt 200 ]; then
            echo "   Response: $body"
        fi
    fi
}

# Test all major endpoints
test_endpoint "Health Check" "/"
test_endpoint "Expenditures API" "/api/expenditures"
test_endpoint "Analysis API" "/api/analysis"
test_endpoint "Amazon Items API" "/api/amazon-items"
test_endpoint "Amazon Items (Business Card)" "/api/amazon-items?businessCard=true"
test_endpoint "Premium Status" "/api/premium-status"

# Test AI Analysis (might take longer)
echo ""
echo "🤖 Testing AI Analysis (may take a moment)..."
ai_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:3000/api/ai-analysis")
ai_status=$(echo "$ai_response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$ai_status" -eq 200 ]; then
    echo "✅ AI Analysis - Status: $ai_status"
    ai_body=$(echo "$ai_response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    confidence=$(echo "$ai_body" | jq '.performance.aiConfidence * 100' 2>/dev/null || echo "0")
    echo "   🎯 AI Confidence: $confidence%"
else
    echo "❌ AI Analysis - Status: $ai_status"
fi

# Test POST endpoints
echo ""
echo "🧪 Testing POST Endpoints..."

# Test adding expenditure
test_data='{"date":"2025-09-07","amount":-19.99,"description":"CLI Test Transaction","category":"Testing"}'
test_endpoint "Add Expenditure" "/api/expenditures" "POST" "$test_data"

# Test employee benefits filter (if we have items)
items_response=$(curl -s "http://localhost:3000/api/amazon-items")
if echo "$items_response" | jq '.[]' > /dev/null 2>&1; then
    # Get first few item IDs
    item_ids=$(echo "$items_response" | jq -r '.[0:3] | map(.id) | @json' 2>/dev/null)
    if [ "$item_ids" != "null" ] && [ "$item_ids" != "" ]; then
        filter_data="{\"itemIds\":$item_ids}"
        test_endpoint "Employee Benefits Filter" "/api/employee-benefits-filter" "POST" "$filter_data"
    fi
fi

echo ""
echo "🎉 Backend testing complete!"
echo ""
echo "💡 For more detailed testing, use:"
echo "   node cli-test.js full        # Complete test suite"
echo "   node cli-test.js test health # Individual tests"
echo "   node cli-test.js help        # Show all options"
