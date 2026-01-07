/**
 * CLI Testing Utilities
 *
 * @fileoverview Utilities for testing command-line interfaces and scripts
 */

const { spawn } = require('child_process');
const path = require('path');

class CLITestHelpers {
  /**
   * Execute a CLI command and capture output
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {object} options - Execution options
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  static async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: options.timeout || 30000
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code
        });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Send input if provided
      if (options.input) {
        child.stdin.write(options.input);
        child.stdin.end();
      }
    });
  }

  /**
   * Execute a shell script
   * @param {string} scriptPath - Path to script
   * @param {string[]} args - Script arguments
   * @param {object} options - Execution options
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  static async executeScript(scriptPath, args = [], options = {}) {
    const fullPath = path.resolve(scriptPath);
    return this.executeCommand('bash', [fullPath, ...args], options);
  }

  /**
   * Test script execution with timeout
   * @param {string} scriptPath - Path to script
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<boolean>} - True if script completes within timeout
   */
  static async testScriptTimeout(scriptPath, timeoutMs = 5000) {
    try {
      const result = await this.executeScript(scriptPath, [], { timeout: timeoutMs });
      return result.exitCode === 0;
    } catch (error) {
      return false; // Timeout or error occurred
    }
  }

  /**
   * Parse CLI output for structured data
   * @param {string} output - CLI output
   * @param {string} format - Expected format ('json', 'table', 'list')
   * @returns {any} - Parsed data
   */
  static parseCLIOutput(output, format = 'text') {
    switch (format) {
    case 'json':
      try {
        return JSON.parse(output);
      } catch (error) {
        throw new Error(`Invalid JSON output: ${output}`);
      }

    case 'table':
      // Parse table-like output
      const lines = output.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return [];
      }

      const headers = lines[0].split(/\s+/);
      return lines.slice(1).map(line => {
        const values = line.split(/\s+/);
        const obj = {};
        headers.forEach((header, index) => {
          obj[header.toLowerCase()] = values[index] || '';
        });
        return obj;
      });

    case 'list':
      // Parse list output (key: value format)
      const result = {};
      output.split('\n').forEach(line => {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          result[match[1].trim()] = match[2].trim();
        }
      });
      return result;

    default:
      return output;
    }
  }

  /**
   * Validate script output against expectations
   * @param {object} result - Execution result
   * @param {object} expectations - Expected outcomes
   */
  static validateScriptOutput(result, expectations = {}) {
    const { exitCode, stdout, stderr } = result;
    const errors = [];

    // Check exit code
    if (expectations.exitCode !== undefined && exitCode !== expectations.exitCode) {
      errors.push(`Expected exit code ${expectations.exitCode}, got ${exitCode}`);
    }

    // Check stdout content
    if (expectations.stdoutContains) {
      expectations.stdoutContains.forEach(text => {
        if (!stdout.includes(text)) {
          errors.push(`Expected stdout to contain "${text}"`);
        }
      });
    }

    // Check stderr content
    if (expectations.stderrContains) {
      expectations.stderrContains.forEach(text => {
        if (!stderr.includes(text)) {
          errors.push(`Expected stderr to contain "${text}"`);
        }
      });
    }

    // Check stdout exclusions
    if (expectations.stdoutNotContains) {
      expectations.stdoutNotContains.forEach(text => {
        if (stdout.includes(text)) {
          errors.push(`Expected stdout to not contain "${text}"`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(`Script validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Test script with multiple scenarios
   * @param {string} scriptPath - Path to script
   * @param {object[]} scenarios - Test scenarios
   * @returns {Promise<object[]>} - Test results
   */
  static async testScriptScenarios(scriptPath, scenarios) {
    const results = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.executeScript(scriptPath, scenario.args || [], scenario.options || {});
        this.validateScriptOutput(result, scenario.expectations || {});
        results.push({
          scenario: scenario.name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Create temporary test script
   * @param {string} content - Script content
   * @param {string} extension - File extension
   * @returns {string} - Path to temporary script
   */
  static createTempScript(content, extension = 'sh') {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const tempDir = os.tmpdir();
    const filename = `test-script-${Date.now()}.${extension}`;
    const filepath = path.join(tempDir, filename);

    fs.writeFileSync(filepath, content);
    fs.chmodSync(filepath, '755'); // Make executable

    return filepath;
  }

  /**
   * Clean up temporary script
   * @param {string} filepath - Path to script to remove
   */
  static cleanupTempScript(filepath) {
    const fs = require('fs');
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

module.exports = {
  CLITestHelpers
};
