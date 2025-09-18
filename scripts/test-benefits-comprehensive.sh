#!/bin/bash

# Benefits Configuration Tool - Comprehensive CLI Unit Tests
# Tests API endpoints, JavaScript functionality, and data integrity

set -euo pipefail

# Ensure script works regardless of where it's invoked from
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Temporary server PID if we start it
SERVER_PID=""

# Ensure we clean up any started server on exit
cleanup() {
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo "🧪 Benefits Configuration Tool - CLI Unit Tests"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit="$3"

    echo -n "🔍 $test_name... "
    TESTS_RUN=$((TESTS_RUN + 1))

    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_exit" = "0" ] || [ "$expected_exit" = "success" ]; then
            echo -e "${GREEN}✅ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ FAILED${NC} (expected failure, got success)"
        fi
    else
        if [ "$expected_exit" = "1" ] || [ "$expected_exit" = "failure" ]; then
            echo -e "${GREEN}✅ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ FAILED${NC} (expected success, got failure)"
        fi
    fi
}

# Function to check server status
check_server() {
    if curl --max-time 2 -s "http://localhost:3000" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local description="$2"

    echo -n "🔍 Testing $description... "
    TESTS_RUN=$((TESTS_RUN + 1))

    if curl -s "http://localhost:3000$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
}

# Function to test API response content
test_api_response() {
    local endpoint="$1"
    local expected_content="$2"
    local description="$3"

    echo -n "🔍 Testing $description... "
    TESTS_RUN=$((TESTS_RUN + 1))

    local response
    response=$(curl -s "http://localhost:3000$endpoint" 2>/dev/null)

    if echo "$response" | grep -q "$expected_content"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (expected '$expected_content' not found)"
    fi
}

# Function to test JavaScript file syntax
test_js_syntax() {
    local file="$1"
    local description="$2"

    echo -n "🔍 Testing $description... "
    TESTS_RUN=$((TESTS_RUN + 1))

    # Use Node to parse the file without executing it by creating a Function wrapper
    if node -e "const fs=require('fs'); try { new Function(fs.readFileSync('$file','utf8')); console.log('ok'); } catch(e) { console.error(e); process.exit(2); }" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (syntax error)"
    fi
}

# Function to test HTML file structure
test_html_structure() {
    local file="$1"
    local element="$2"
    local description="$3"

    echo -n "🔍 Testing $description... "
    TESTS_RUN=$((TESTS_RUN + 1))

    if grep -q "$element" "$file"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (element '$element' not found)"
    fi
}

echo ""
echo "📋 Test Setup"
echo "============="

# Check if server is running
if ! check_server; then
        echo -e "${YELLOW}⚠️  Server not running. Starting server...${NC}"
        cd "$REPO_ROOT"
        node server.js > "$REPO_ROOT/.test-server.log" 2>&1 &
        SERVER_PID=$!

        # Wait up to 15 seconds for server to be ready
        for i in {1..15}; do
            if check_server; then
                break
            fi
            sleep 1
        done

        if ! check_server; then
                echo -e "${RED}❌ Cannot start server. See $REPO_ROOT/.test-server.log for details. Aborting tests.${NC}"
                exit 1
        fi

        echo -e "${GREEN}✅ Server started (PID: $SERVER_PID)${NC}"
else
        echo -e "${GREEN}✅ Server already running${NC}"
fi

echo ""
echo "🧪 API Tests"
echo "============"

# Test basic server response
test_api_endpoint "/" "Server root endpoint"

# Test Amazon items API
test_api_endpoint "/api/amazon-items?businessCard=true" "Amazon items API endpoint"

# Test API response contains expected data
test_api_response "/api/amazon-items?businessCard=true" '"id"' "API returns item IDs"
test_api_response "/api/amazon-items?businessCard=true" '"name"' "API returns item names"
test_api_response "/api/amazon-items?businessCard=true" '"price"' "API returns item prices"

# Test API returns array (without jq)
run_test "API returns JSON array" "curl -s 'http://localhost:3000/api/amazon-items?businessCard=true' | grep -q '^\['" "success"

echo ""
echo "📄 File Structure Tests"
echo "======================="

JS_FILE_PATH="$REPO_ROOT/public/js/employee-benefits.js"
HTML_FILE_PATH="$REPO_ROOT/public/employee-benefits.html"

# Test JavaScript syntax
test_js_syntax "$JS_FILE_PATH" "Employee benefits JavaScript syntax"

# Test HTML structure
test_html_structure "$HTML_FILE_PATH" "employeeBenefitsModal" "Modal exists in HTML"
test_html_structure "$HTML_FILE_PATH" "totalItemsCount" "Total items counter exists"
test_html_structure "$HTML_FILE_PATH" "businessSuppliesValue" "Business supplies value element exists"
test_html_structure "$HTML_FILE_PATH" "benefitsValue" "Benefits value element exists"
test_html_structure "$HTML_FILE_PATH" "benefitsPercentage" "Benefits percentage element exists"

echo ""
echo "🔧 JavaScript Method Tests"
echo "=========================="

# Test that key methods exist in the JavaScript file
JS_FILE="$REPO_ROOT/public/js/employee-benefits.js"
run_test "updateModalDisplay method exists" "grep -q 'updateModalDisplay()' '$JS_FILE'" "success"
run_test "updateSummaryStats method exists" "grep -q 'updateSummaryStats(' '$JS_FILE'" "success"
run_test "createBusinessCard method exists" "grep -q 'createBusinessCard(' '$JS_FILE'" "success"
run_test "createBenefitsCard method exists" "grep -q 'createBenefitsCard(' '$JS_FILE'" "success"
run_test "showSelectionModal method exists" "grep -q 'showSelectionModal()' '$JS_FILE'" "success"

echo ""
echo "📊 Data Validation Tests"
echo "========================"

# Test that API returns reasonable number of items
ITEM_COUNT=$(curl -s "http://localhost:3000/api/amazon-items?businessCard=true" | grep -o '"id"' | wc -l)
echo -n "🔍 Testing item count reasonableness... "
TESTS_RUN=$((TESTS_RUN + 1))

if [ "$ITEM_COUNT" -gt 0 ] && [ "$ITEM_COUNT" -lt 1000 ]; then
    echo -e "${GREEN}✅ PASSED${NC} ($ITEM_COUNT items)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} ($ITEM_COUNT items - unreasonable count)"
fi

# Test that items have required properties
echo -n "🔍 Testing item data structure... "
TESTS_RUN=$((TESTS_RUN + 1))

# Fetch the first item with fallback parsing if jq/python are missing
API_JSON=$(curl -s "http://localhost:3000/api/amazon-items?businessCard=true")
FIRST_ITEM=""
if command -v jq >/dev/null 2>&1; then
    FIRST_ITEM=$(echo "$API_JSON" | jq -c '.[0]')
elif command -v python3 >/dev/null 2>&1; then
    FIRST_ITEM=$(echo "$API_JSON" | python3 -c 'import sys,json; obj=json.load(sys.stdin); print(json.dumps(obj[0]))')
elif command -v node >/dev/null 2>&1; then
    FIRST_ITEM=$(echo "$API_JSON" | node -e "const s=fs=require('fs').readFileSync(0,'utf8'); const a=JSON.parse(s); console.log(JSON.stringify(a[0]));")
else
    # Fallback: attempt to extract first object using sed (best effort)
    FIRST_ITEM=$(echo "$API_JSON" | sed 's/^\[//' | sed 's/,.*$//' | sed 's/}.*$/}/')
fi

# Now check fields exist using node if available, else python, else grep fallbacks
if command -v node >/dev/null 2>&1; then
    echo "$FIRST_ITEM" | node -e "try{const s=require('fs').readFileSync(0,'utf8'); const o=JSON.parse(s); const ok = o && o.id && o.name && (typeof o.price==='number' || typeof o.price==='string'); process.exit(ok?0:1);}catch(e){process.exit(1);}"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (missing required properties)"
    fi
elif command -v python3 >/dev/null 2>&1; then
    echo "$FIRST_ITEM" | python3 - <<'PY'
import sys, json
try:
    obj = json.loads(sys.stdin.read())
    ok = all(k in obj for k in ('id','name','price'))
except Exception:
    ok = False
print(ok)
sys.exit(0 if ok else 1)
PY
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (missing required properties)"
    fi
else
    if echo "$FIRST_ITEM" | grep -q '"id"' && echo "$FIRST_ITEM" | grep -q '"name"' && echo "$FIRST_ITEM" | grep -q '"price"'; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (missing required properties)"
    fi
fi

echo ""
echo "📈 Test Results"
echo "==============="
echo -e "Tests Run: $TESTS_RUN"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$((TESTS_RUN - TESTS_PASSED))${NC}"

if [ "$TESTS_PASSED" -eq "$TESTS_RUN" ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_RUN))
    echo -e "${YELLOW}⚠️  $SUCCESS_RATE% success rate${NC}"
fi

echo ""
echo "🧹 Cleanup"
echo "=========="

# Stop server if we started it
if [ -n "$SERVER_PID" ]; then
    echo -n "Stopping test server... "
    kill $SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Done${NC}"
fi

echo ""
echo "📋 Next Steps"
echo "============="
echo "1. If API tests failed, check server logs"
echo "2. If JavaScript tests failed, check browser console"
echo "3. If HTML tests failed, verify modal structure"
echo "4. Run browser tests to verify UX functionality"

exit $((TESTS_RUN - TESTS_PASSED))