#!/bin/bash

# TSV Ledger Smart Test Runner
# Automatically manages server lifecycle for testing

SERVER_PORT=3000
SERVER_PID_FILE="/tmp/tsv-ledger-server.pid"
SERVER_LOG_FILE="/tmp/tsv-ledger-server.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TSV Ledger Smart Test Runner${NC}"
echo "================================="

# Function to check if server is running
check_server() {
    if curl -s "http://localhost:$SERVER_PORT" > /dev/null 2>&1; then
        return 0  # Server is running
    else
        return 1  # Server is not running
    fi
}

# Function to start server
start_server() {
    echo -e "${YELLOW}🔧 Starting server...${NC}"
    
    # Kill any existing server processes
    pkill -f "node server.js" 2>/dev/null
    sleep 1
    
    # Start server in background and capture PID
    nohup node server.js > "$SERVER_LOG_FILE" 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > "$SERVER_PID_FILE"
    
    # Wait for server to start
    echo -n "   Waiting for server to start"
    for i in {1..10}; do
        if check_server; then
            echo -e "\n✅ Server started successfully (PID: $SERVER_PID)"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    
    echo -e "\n❌ Server failed to start within 10 seconds"
    return 1
}

# Function to stop server
stop_server() {
    if [ -f "$SERVER_PID_FILE" ]; then
        SERVER_PID=$(cat "$SERVER_PID_FILE")
        echo -e "${YELLOW}🛑 Stopping server (PID: $SERVER_PID)...${NC}"
        kill $SERVER_PID 2>/dev/null
        rm -f "$SERVER_PID_FILE"
        sleep 2
    fi
    
    # Ensure all server processes are killed
    pkill -f "node server.js" 2>/dev/null
    echo -e "✅ Server stopped"
}

# Function to run tests
run_tests() {
    local test_type="$1"
    
    echo -e "\n${BLUE}🧪 Running tests...${NC}"
    
    case "$test_type" in
        "quick")
            echo "Running quick shell tests..."
            # Simple curl-based tests
            test_endpoint "Health Check" "/"
            test_endpoint "Expenditures" "/api/expenditures"
            test_endpoint "Analysis" "/api/analysis"
            test_endpoint "Amazon Items" "/api/amazon-items"
            ;;
        "cli")
            echo "Running comprehensive CLI tests..."
            node cli-test.js full
            ;;
        "specific")
            echo "Running specific test: $2"
            node cli-test.js test "$2"
            ;;
        *)
            echo "Running default tests..."
            test_endpoint "Health Check" "/"
            test_endpoint "Expenditures" "/api/expenditures"
            test_endpoint "Amazon Items" "/api/amazon-items"
            ;;
    esac
}

# Function to test individual endpoint
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    
    echo -n "   Testing $name... "
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:$SERVER_PORT$endpoint")
    status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    if [ "$status" -eq 200 ] || [ "$status" -eq 201 ]; then
        echo -e "${GREEN}✅ Pass (${status})${NC}"
        
        # Show relevant metrics
        body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
        case "$endpoint" in
            "/api/expenditures")
                count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "?")
                echo "      📊 Found $count expenditures"
                ;;
            "/api/analysis")
                total=$(echo "$body" | jq '.overview.totalTransactions' 2>/dev/null || echo "?")
                echo "      📈 Analyzed $total transactions"
                ;;
            "/api/amazon-items")
                items=$(echo "$body" | jq '. | length' 2>/dev/null || echo "?")
                echo "      🛒 Found $items Amazon items"
                ;;
        esac
    else
        echo -e "${RED}❌ Fail (${status})${NC}"
    fi
}

# Function to show server logs
show_logs() {
    if [ -f "$SERVER_LOG_FILE" ]; then
        echo -e "\n${BLUE}📋 Recent server logs:${NC}"
        tail -10 "$SERVER_LOG_FILE"
    else
        echo -e "${YELLOW}⚠️ No server logs found${NC}"
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    stop_server
    rm -f "$SERVER_LOG_FILE"
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Parse command line arguments
COMMAND="${1:-test}"
TEST_TYPE="${2:-quick}"
SPECIFIC_TEST="$3"

case "$COMMAND" in
    "start")
        start_server
        echo -e "\n${GREEN}🎉 Server is running at http://localhost:$SERVER_PORT${NC}"
        echo -e "Use ${BLUE}./smart-test.sh stop${NC} to stop the server"
        trap - EXIT INT TERM  # Don't cleanup on exit for start command
        ;;
    
    "stop")
        stop_server
        ;;
    
    "test")
        # Check if server is already running
        if check_server; then
            echo -e "✅ Server is already running"
        else
            start_server || exit 1
        fi
        
        run_tests "$TEST_TYPE" "$SPECIFIC_TEST"
        ;;
    
    "logs")
        show_logs
        ;;
    
    "status")
        if check_server; then
            echo -e "${GREEN}✅ Server is running at http://localhost:$SERVER_PORT${NC}"
            if [ -f "$SERVER_PID_FILE" ]; then
                PID=$(cat "$SERVER_PID_FILE")
                echo -e "   PID: $PID"
            fi
        else
            echo -e "${RED}❌ Server is not running${NC}"
        fi
        ;;
    
    "help")
        echo "TSV Ledger Smart Test Runner"
        echo ""
        echo "Usage: ./smart-test.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  start                    Start server and keep running"
        echo "  stop                     Stop the server"
        echo "  test [type]              Run tests (auto-manages server)"
        echo "  status                   Check server status"
        echo "  logs                     Show recent server logs"
        echo "  help                     Show this help"
        echo ""
        echo "Test Types:"
        echo "  quick                    Fast endpoint tests (default)"
        echo "  cli                      Full CLI test suite"
        echo "  specific <test-name>     Run specific test"
        echo ""
        echo "Examples:"
        echo "  ./smart-test.sh test                    # Quick tests"
        echo "  ./smart-test.sh test cli                # Full CLI tests"
        echo "  ./smart-test.sh test specific health    # Just health check"
        echo "  ./smart-test.sh start                   # Start server only"
        echo "  ./smart-test.sh stop                    # Stop server only"
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo "Use './smart-test.sh help' for usage information"
        exit 1
        ;;
esac
