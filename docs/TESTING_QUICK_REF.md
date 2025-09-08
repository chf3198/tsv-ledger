# TSV Ledger - Quick CLI Testing Reference

## 🚀 One-Command Testing (Recommended)

```bash
# Quick tests with automatic server management
./smart-test.sh test quick

# Full test suite with automatic server management  
npm run test-full

# NPM shortcuts
npm run test-backend    # Quick smart tests
npm run test-cli        # Comprehensive CLI tests
```

## 🔧 Server Management

```bash
./smart-test.sh start   # Start server
./smart-test.sh stop    # Stop server
./smart-test.sh status  # Check status
```

## 📊 Testing Options

| Command | Description | Server Management |
|---------|-------------|------------------|
| `./smart-test.sh test quick` | Fast endpoint tests | ✅ Automatic |
| `npm run test-full` | Complete test suite | ✅ Automatic |
| `./test-backend.sh` | Legacy shell tests | ❌ Manual |
| `node cli-test.js full` | Legacy CLI tests | ❌ Manual |

## 🎯 Problem Solved

✅ **No more CLI blocking** - Server runs in background  
✅ **Automatic cleanup** - Server properly started/stopped  
✅ **No manual management** - Scripts handle everything  
✅ **Multiple test options** - Choose what fits your workflow  

## 💡 Quick Start

```bash
# Test everything with one command
./smart-test.sh test quick

# That's it! The script will:
# 1. Start the server automatically
# 2. Run all tests  
# 3. Stop the server
# 4. Show results
```

See **CLI_TESTING.md** for complete documentation.
