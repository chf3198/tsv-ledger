# TSV Ledger Command Line Testing Guide

The TSV Ledger application is now **fully executable and testable via command line**, allowing you to test all backend functionality without needing a browser. **The testing framework automatically manages the server lifecycle**, eliminating CLI conflicts.

## 🚀 Quick Start

### Automated Testing (Recommended)
```bash
# Smart test runner - automatically manages server
./smart-test.sh test quick         # Quick tests with auto server management
./smart-test.sh test cli           # Full CLI tests with auto server management

# Standalone tester - manages server in background
node standalone-test.js full       # Complete test suite
node standalone-test.js quick      # Quick test (requires running server)

# NPM shortcuts
npm run test-backend              # Quick smart tests
npm run test-full                 # Full standalone tests
```

### Manual Server Management
```bash
# Start server manually
./smart-test.sh start             # Start and keep running
npm run server-start

# Test with running server
./test-backend.sh                 # Original shell tests
node cli-test.js full             # Original CLI tests

# Stop server
./smart-test.sh stop              # Stop server
npm run server-stop
```

## 🧪 Testing Solutions for CLI/Server Conflicts

### Problem Solution: Smart Test Runner
The **smart-test.sh** script solves the CLI blocking issue by:
- ✅ Automatically starting server in background with PID tracking
- ✅ Running tests while server runs separately
- ✅ Automatically stopping server after tests complete
- ✅ Proper cleanup on script exit or interruption

### Problem Solution: Standalone Tester
The **standalone-test.js** script provides:
- ✅ Programmatic server lifecycle management
- ✅ Node.js process spawning for isolated server
- ✅ Automatic cleanup and error handling
- ✅ No terminal blocking or output conflicts

## 📋 Available Testing Methods

### 1. Smart Test Runner (Recommended)
```bash
./smart-test.sh test quick         # Fast endpoint validation
./smart-test.sh test cli           # Comprehensive CLI tests
./smart-test.sh test specific health  # Individual test
./smart-test.sh start              # Start server only
./smart-test.sh stop               # Stop server only
./smart-test.sh status             # Check server status
./smart-test.sh logs               # View server logs
```

### 2. Standalone Tester
```bash
node standalone-test.js full       # Full suite with auto server management
node standalone-test.js quick      # Quick test (server must be running)
node standalone-test.js --verbose  # Detailed output
```

### 3. NPM Scripts (Convenience)
```bash
npm run test-backend              # Smart quick tests
npm run test-cli                  # Smart CLI tests  
npm run test-full                 # Standalone full tests
npm run test-standalone           # Standalone quick tests
npm run server-start              # Start server
npm run server-stop               # Stop server
npm run server-status             # Check server status
```

### 4. Legacy Methods (Manual Server)
```bash
# Start server manually first
node server.js &

# Then run tests
./test-backend.sh                 # Shell-based tests
node cli-test.js full             # Node.js CLI tests
```

## 🔍 What Gets Tested

### Core APIs
- **GET /api/expenditures** - Retrieve all expenditures
- **POST /api/expenditures** - Add new expenditure  
- **GET /api/analysis** - Complete financial analysis
- **GET /api/ai-analysis** - AI-powered insights
- **GET /api/amazon-items** - Amazon order items
- **POST /api/employee-benefits-filter** - Benefits filtering
- **GET /api/premium-status** - Premium feature status
- **POST /api/import-csv** - CSV data import

### Functionality Tests
- ✅ Server health and responsiveness
- ✅ Data retrieval and processing
- ✅ Error handling and edge cases
- ✅ API response validation
- ✅ Business logic accuracy
- ✅ Performance metrics

## 📊 Sample Output

### Smart Test Runner
```
🚀 TSV Ledger Smart Test Runner
=================================
🔧 Starting server...
   Waiting for server to start.
✅ Server started successfully (PID: 12345)

🧪 Running tests...
Running quick shell tests...
   Testing Health Check... ✅ Pass (200)
   Testing Expenditures... ✅ Pass (200)
      📊 Found 1462 expenditures
   Testing Analysis... ✅ Pass (200)
      📈 Analyzed 280 transactions

🧹 Cleaning up...
� Stopping server (PID: 12345)...
✅ Server stopped
```

### Standalone Tester
```
🚀 TSV Ledger Standalone Testing Framework
==================================================
� Starting server...
✅ Server started successfully

🧪 Testing Server Health...
✅ PASS

🧪 Testing Expenditures API...
   📊 Found 1462 expenditures
✅ PASS

📋 Test Summary
==============================
✅ Server Health
✅ Expenditures API
✅ Analysis API

🎯 Results: 6/6 tests passed (100.0%)
🎉 All tests passed! Backend is fully functional.
🛑 Stopping server...
✅ Server stopped
```

## 🛠️ Advanced Usage

### Server Management
```bash
# Check if server is running
./smart-test.sh status

# Start server and keep it running
./smart-test.sh start

# View server logs
./smart-test.sh logs

# Stop server
./smart-test.sh stop
```

### Custom Testing
```bash
# Test specific functionality
./smart-test.sh test specific health
./smart-test.sh test specific amazon

# Verbose output
node standalone-test.js full --verbose

# Test with different port (if configured)
PORT=3001 ./smart-test.sh test quick
```

### Integration with CI/CD
```bash
# Exit code 0 on success, 1 on failure
./smart-test.sh test quick && echo "Tests passed" || echo "Tests failed"
node standalone-test.js full && echo "All good" || echo "Issues found"
```

## 🔧 Troubleshooting

### Server Conflicts
```
Error: EADDRINUSE :::3000
Solution: Use smart-test.sh which handles this automatically
```

### Permission Issues
```bash
# Make scripts executable
chmod +x smart-test.sh
chmod +x standalone-test.js
chmod +x test-backend.sh
```

### Dependencies
```bash
# Install required packages
npm install
```

## 📁 Testing Files

- **`smart-test.sh`** - Smart test runner with auto server management ⭐
- **`standalone-test.js`** - Node.js standalone tester ⭐
- **`cli-test.js`** - Original comprehensive CLI testing framework
- **`test-backend.sh`** - Original shell script testing
- **`test-analysis-unit.js`** - Unit testing framework

## 🎯 Recommended Workflow

```bash
# 1. Quick validation during development
./smart-test.sh test quick

# 2. Comprehensive testing before commits
npm run test-full

# 3. Check specific functionality
./smart-test.sh test specific benefits

# 4. Server management as needed
./smart-test.sh start    # For manual testing
./smart-test.sh stop     # When done
```

## ✨ Key Benefits

1. **No CLI Blocking** - Server runs in background, tests run in foreground
2. **Automatic Cleanup** - Servers are properly started and stopped
3. **No Manual Management** - Scripts handle server lifecycle automatically
4. **Multiple Options** - Choose the testing method that fits your workflow
5. **Error Handling** - Proper cleanup even on interruption or failure
6. **Process Isolation** - No interference between server and test processes

The TSV Ledger application now provides **multiple robust command-line testing solutions** that completely eliminate the CLI/server conflict issue!
