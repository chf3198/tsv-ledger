/**
 * CLI Testing Suite
 *
 * @fileoverview Comprehensive tests for command-line interfaces and scripts
 */

const { CLITestHelpers } = require('./cli-test-helpers');
const path = require('path');

describe('CLI Testing Suite', () => {
  const scriptsDir = path.join(__dirname, '..', '..', 'scripts');
  const rootDir = path.join(__dirname, '..', '..');

  describe('Smart Test Script', () => {
    const smartTestScript = path.join(scriptsDir, 'smart-test.sh');

    test('should execute quick test successfully', async () => {
      const result = await CLITestHelpers.executeScript(smartTestScript, ['test', 'quick']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Starting quick test'],
        stderrNotContains: ['ERROR', 'FAILED']
      });
    }, 30000);

    test('should execute CLI test successfully', async () => {
      const result = await CLITestHelpers.executeScript(smartTestScript, ['test', 'cli']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['CLI test'],
        stderrNotContains: ['ERROR', 'FAILED']
      });
    }, 30000);

    test('should handle server start/stop', async () => {
      // Start server
      const startResult = await CLITestHelpers.executeScript(smartTestScript, ['start']);
      expect(startResult.exitCode).toBe(0);

      // Check server status
      const statusResult = await CLITestHelpers.executeScript(smartTestScript, ['status']);
      expect(statusResult.exitCode).toBe(0);
      expect(statusResult.stdout).toContain('running');

      // Stop server
      const stopResult = await CLITestHelpers.executeScript(smartTestScript, ['stop']);
      expect(stopResult.exitCode).toBe(0);
    }, 60000);

    test('should handle invalid commands gracefully', async () => {
      const result = await CLITestHelpers.executeScript(smartTestScript, ['invalid-command']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 1,
        stderrContains: ['Unknown command', 'invalid-command']
      });
    });
  });

  describe('Test All Script', () => {
    const testAllScript = path.join(scriptsDir, 'test-all.sh');

    test('should execute comprehensive test suite', async () => {
      const result = await CLITestHelpers.executeScript(testAllScript);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Starting comprehensive test suite'],
        stderrNotContains: ['CRITICAL ERROR']
      });
    }, 120000); // 2 minute timeout for comprehensive tests

    test('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await CLITestHelpers.executeScript(testAllScript);
      const duration = Date.now() - startTime;

      // Should complete within 90 seconds
      expect(duration).toBeLessThan(90000);
    });
  });

  describe('Backend Test Script', () => {
    const backendTestScript = path.join(scriptsDir, 'test-backend.sh');

    test('should test backend functionality', async () => {
      const result = await CLITestHelpers.executeScript(backendTestScript);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Backend tests'],
        stderrNotContains: ['FAILED', 'ERROR']
      });
    }, 30000);

    test('should validate server endpoints', async () => {
      const result = await CLITestHelpers.executeScript(backendTestScript, ['endpoints']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['API endpoints', 'validated']
      });
    });
  });

  describe('Benefits Test Scripts', () => {
    const benefitsTestScript = path.join(scriptsDir, 'test-benefits.sh');
    const benefitsComprehensiveScript = path.join(scriptsDir, 'test-benefits-comprehensive.sh');

    test('should test benefits functionality', async () => {
      const result = await CLITestHelpers.executeScript(benefitsTestScript);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Benefits'],
        stderrNotContains: ['FAILED']
      });
    }, 30000);

    test('should run comprehensive benefits tests', async () => {
      const result = await CLITestHelpers.executeScript(benefitsComprehensiveScript);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Comprehensive benefits tests'],
        stderrNotContains: ['CRITICAL']
      });
    }, 60000);
  });

  describe('Project Initialization Script', () => {
    const initScript = path.join(scriptsDir, 'init-new-project.sh');

    test('should validate project structure', async () => {
      const result = await CLITestHelpers.executeScript(initScript, ['validate']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Project structure', 'valid']
      });
    });

    test('should handle dry run mode', async () => {
      const result = await CLITestHelpers.executeScript(initScript, ['--dry-run']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['DRY RUN'],
        stderrNotContains: ['ERROR']
      });
    });
  });

  describe('Protocol Validation Script', () => {
    const validateScript = path.join(scriptsDir, 'validate-protocols.sh');

    test('should validate communication protocols', async () => {
      const result = await CLITestHelpers.executeScript(validateScript);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Protocols', 'validated'],
        stderrNotContains: ['FAILED']
      });
    }, 30000);

    test('should check protocol compliance', async () => {
      const result = await CLITestHelpers.executeScript(validateScript, ['compliance']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Compliance', 'check']
      });
    });
  });

  describe('Sync Protocols Script', () => {
    const syncScript = path.join(scriptsDir, 'sync-protocols.sh');

    test('should synchronize protocols', async () => {
      const result = await CLITestHelpers.executeScript(syncScript);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Sync', 'protocols'],
        stderrNotContains: ['ERROR']
      });
    }, 30000);

    test('should handle force sync', async () => {
      const result = await CLITestHelpers.executeScript(syncScript, ['--force']);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Force sync']
      });
    });
  });

  describe('Demo Scripts', () => {
    const benefitsDemoScript = path.join(scriptsDir, 'demo-benefits-percentage.sh');

    test('should run benefits percentage demo', async () => {
      const result = await CLITestHelpers.executeScript(benefitsDemoScript);

      CLITestHelpers.validateScriptOutput(result, {
        exitCode: 0,
        stdoutContains: ['Benefits', 'percentage'],
        stderrNotContains: ['ERROR']
      });
    }, 30000);
  });

  describe('Script Error Handling', () => {
    test('should handle missing script files', async () => {
      const nonExistentScript = path.join(scriptsDir, 'non-existent-script.sh');

      await expect(CLITestHelpers.executeScript(nonExistentScript))
        .rejects
        .toThrow();
    });

    test('should handle script timeouts', async () => {
      const slowScript = CLITestHelpers.createTempScript(`
        #!/bin/bash
        echo "Starting slow operation..."
        sleep 10
        echo "Completed"
      `);

      try {
        const isFast = await CLITestHelpers.testScriptTimeout(slowScript, 2000);
        expect(isFast).toBe(false);
      } finally {
        CLITestHelpers.cleanupTempScript(slowScript);
      }
    });

    test('should handle script failures gracefully', async () => {
      const failingScript = CLITestHelpers.createTempScript(`
        #!/bin/bash
        echo "Starting operation..."
        exit 1
      `);

      try {
        const result = await CLITestHelpers.executeScript(failingScript);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('exit 1');
      } finally {
        CLITestHelpers.cleanupTempScript(failingScript);
      }
    });
  });

  describe('Script Output Parsing', () => {
    test('should parse JSON output', () => {
      const jsonOutput = '{"status": "success", "data": [1, 2, 3]}';
      const parsed = CLITestHelpers.parseCLIOutput(jsonOutput, 'json');

      expect(parsed.status).toBe('success');
      expect(parsed.data).toEqual([1, 2, 3]);
    });

    test('should parse table output', () => {
      const tableOutput = `Name    Status    Count
                        Test1   Active    5
                        Test2   Inactive  3`;
      const parsed = CLITestHelpers.parseCLIOutput(tableOutput, 'table');

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Test1');
      expect(parsed[0].status).toBe('Active');
      expect(parsed[0].count).toBe('5');
    });

    test('should parse list output', () => {
      const listOutput = `Status: Active
                        Count: 42
                        Name: Test Script`;
      const parsed = CLITestHelpers.parseCLIOutput(listOutput, 'list');

      expect(parsed.Status).toBe('Active');
      expect(parsed.Count).toBe('42');
      expect(parsed.Name).toBe('Test Script');
    });
  });

  describe('Multi-Scenario Testing', () => {
    test('should test script with multiple scenarios', async () => {
      const testScript = CLITestHelpers.createTempScript(`
        #!/bin/bash
        case "$1" in
          "success")
            echo "Operation successful"
            exit 0
            ;;
          "warning")
            echo "Warning: Something happened" >&2
            echo "Operation completed with warning"
            exit 0
            ;;
          "error")
            echo "Error occurred" >&2
            exit 1
            ;;
          *)
            echo "Usage: $0 {success|warning|error}"
            exit 1
            ;;
        esac
      `);

      try {
        const scenarios = [
          {
            name: 'Success scenario',
            args: ['success'],
            expectations: {
              exitCode: 0,
              stdoutContains: ['successful']
            }
          },
          {
            name: 'Warning scenario',
            args: ['warning'],
            expectations: {
              exitCode: 0,
              stdoutContains: ['completed'],
              stderrContains: ['Warning']
            }
          },
          {
            name: 'Error scenario',
            args: ['error'],
            expectations: {
              exitCode: 1,
              stderrContains: ['Error']
            }
          }
        ];

        const results = await CLITestHelpers.testScriptScenarios(testScript, scenarios);

        expect(results).toHaveLength(3);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(true);
        expect(results[2].success).toBe(true);
      } finally {
        CLITestHelpers.cleanupTempScript(testScript);
      }
    });
  });

  describe('Performance Testing', () => {
    test('should measure script execution time', async () => {
      const testScript = CLITestHelpers.createTempScript(`
        #!/bin/bash
        echo "Starting performance test..."
        sleep 0.1
        echo "Performance test completed"
      `);

      try {
        const startTime = Date.now();
        const result = await CLITestHelpers.executeScript(testScript);
        const duration = Date.now() - startTime;

        expect(result.exitCode).toBe(0);
        expect(duration).toBeGreaterThan(100); // At least 100ms due to sleep
        expect(duration).toBeLessThan(500); // Should complete quickly
      } finally {
        CLITestHelpers.cleanupTempScript(testScript);
      }
    });

    test('should handle concurrent script execution', async () => {
      const testScript = CLITestHelpers.createTempScript(`
        #!/bin/bash
        echo "Concurrent test $1"
        sleep 0.05
        echo "Completed $1"
      `);

      try {
        const promises = [];
        for (let i = 1; i <= 5; i++) {
          promises.push(CLITestHelpers.executeScript(testScript, [i.toString()]));
        }

        const results = await Promise.all(promises);

        results.forEach((result, index) => {
          expect(result.exitCode).toBe(0);
          expect(result.stdout).toContain(`Concurrent test ${index + 1}`);
          expect(result.stdout).toContain(`Completed ${index + 1}`);
        });
      } finally {
        CLITestHelpers.cleanupTempScript(testScript);
      }
    });
  });
});

describe('Employee Benefits CLI Tests', () => {
  const testScript = path.join(scriptsDir, 'test-benefits.sh');

  test('should test employee benefits API endpoints', async () => {
    const result = await CLITestHelpers.executeScript(testScript, ['api']);

    CLITestHelpers.validateScriptOutput(result, {
      exitCode: 0,
      stdoutContains: ['API Health Check', 'Benefits Filter API'],
      stderrNotContains: ['FAILED', 'ERROR']
    });
  }, 30000);

  test('should validate benefits data loading', async () => {
    const result = await CLITestHelpers.executeScript(testScript, ['server']);

    CLITestHelpers.validateScriptOutput(result, {
      exitCode: 0,
      stdoutContains: ['Server Check'],
      stderrNotContains: ['FAILED', 'ERROR']
    });
  }, 30000);

  test('should test benefits allocation logic', async () => {
    const result = await CLITestHelpers.executeScript(testScript, ['allocation']);

    CLITestHelpers.validateScriptOutput(result, {
      exitCode: 0,
      stdoutContains: ['Percentage Allocation', 'Cost Calculation'],
      stderrNotContains: ['FAILED', 'ERROR']
    });
  }, 30000);

  test('should validate benefits status updates', async () => {
    const result = await CLITestHelpers.executeScript(testScript, ['status']);

    CLITestHelpers.validateScriptOutput(result, {
      exitCode: 0,
      stdoutContains: ['Status Loading', 'API responded'],
      stderrNotContains: ['FAILED', 'ERROR']
    });
  }, 30000);
});
