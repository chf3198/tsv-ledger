/**
 * Amazon ZIP Validation Unit Tests
 *
 * Tests ZIP file validation for Amazon data imports.
 * Ensures validation properly handles file types, extensions,
 * and returns correct response structure for frontend.
 *
 * @module tests/unit/amazon-zip-validation.test
 */

const path = require('path');
const fs = require('fs');

describe('Amazon ZIP Validation', () => {
  const dataDir = path.join(__dirname, '../../data');
  const ordersZipPath = path.join(dataDir, 'Your Orders.zip');
  const subscriptionsZipPath = path.join(dataDir, 'Subscriptions.zip');

  describe('AmazonZipDetector', () => {
    let AmazonZipDetector;

    beforeAll(() => {
      AmazonZipDetector = require('../../src/amazon-zip-detector');
    });

    test('should validate existing Orders ZIP file', async () => {
      if (!fs.existsSync(ordersZipPath)) {
        console.log('Skipping test: Your Orders.zip not found');
        return;
      }

      const detector = new AmazonZipDetector();
      const result = await detector.analyzeZipFile(ordersZipPath, {
        originalName: 'Your Orders.zip'
      });

      expect(result.isValid).toBe(true);
      expect(result.detected).toBe(true);
      expect(result.type).toBe('orders');
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.zipInfo).toBeDefined();
      expect(result.fileStats).toBeDefined();
      expect(result.contents).toBeDefined();
    });

    test('should validate existing Subscriptions ZIP file', async () => {
      if (!fs.existsSync(subscriptionsZipPath)) {
        console.log('Skipping test: Subscriptions.zip not found');
        return;
      }

      const detector = new AmazonZipDetector();
      const result = await detector.analyzeZipFile(subscriptionsZipPath, {
        originalName: 'Subscriptions.zip'
      });

      expect(result.isValid).toBe(true);
      expect(result.detected).toBe(true);
      expect(result.type).toBe('subscriptions');
    });

    test('should reject non-ZIP file extension', async () => {
      const detector = new AmazonZipDetector();
      // Create a temp file to test
      const tempFile = path.join(dataDir, 'temp-uploads', 'test-file');

      // Only run if temp-uploads dir exists
      if (fs.existsSync(path.dirname(tempFile))) {
        fs.writeFileSync(tempFile, 'test content');

        const result = await detector.analyzeZipFile(tempFile, {
          originalName: 'test.txt'
        });

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid file type');

        fs.unlinkSync(tempFile);
      }
    });

    test('should accept ZIP extension from originalName even if temp file has no extension', async () => {
      const detector = new AmazonZipDetector();

      if (fs.existsSync(ordersZipPath)) {
        // Simulate multer behavior: temp file without extension
        const result = await detector.analyzeZipFile(ordersZipPath, {
          originalName: 'Your Orders.zip'
        });

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });
  });

  describe('zip-handler validateZipFile', () => {
    let zipHandler;

    beforeAll(() => {
      zipHandler = require('../../src/import/zip-handler');
    });

    test('should return success:true for valid ZIP file', async () => {
      if (!fs.existsSync(ordersZipPath)) {
        console.log('Skipping test: Your Orders.zip not found');
        return;
      }

      const result = await zipHandler.validateZipFile(ordersZipPath, 'Your Orders.zip');

      // Verify response structure expected by frontend
      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.zipInfo).toBeDefined();
      expect(result.analysis.confidence).toBeDefined();
      expect(result.analysis.fileStats).toBeDefined();
      expect(result.analysis.contents).toBeDefined();
      expect(result.analysis.recommendations).toBeDefined();
    });

    test('should return success:false for non-ZIP file', async () => {
      const tempFile = path.join(dataDir, 'temp-uploads', 'test-validation-file');

      if (fs.existsSync(path.dirname(tempFile))) {
        fs.writeFileSync(tempFile, 'test content');

        const result = await zipHandler.validateZipFile(tempFile, 'document.pdf');

        expect(result.success).toBe(false);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.message).toBeDefined();

        fs.unlinkSync(tempFile);
      }
    });

    test('should handle missing file gracefully', async () => {
      const result = await zipHandler.validateZipFile('/nonexistent/file.zip', 'missing.zip');

      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('response structure matches frontend expectations', async () => {
      if (!fs.existsSync(ordersZipPath)) {
        console.log('Skipping test: Your Orders.zip not found');
        return;
      }

      const result = await zipHandler.validateZipFile(ordersZipPath, 'Your Orders.zip');

      // Frontend checks: response.ok && result.success
      expect(result.success).toBe(true);

      // Frontend expects: result.analysis.zipInfo, confidence, fileStats, contents, recommendations
      expect(result.analysis.zipInfo.name).toBeDefined();
      expect(result.analysis.zipInfo.icon).toBeDefined();
      expect(result.analysis.zipInfo.color).toBeDefined();
      expect(result.analysis.confidence).toBeGreaterThan(0);
      expect(result.analysis.fileStats.fileName).toBe('Your Orders.zip');
      expect(result.analysis.fileStats.fileSize).toBeDefined();
      expect(result.analysis.contents.totalFiles).toBeGreaterThan(0);
      expect(Array.isArray(result.analysis.recommendations)).toBe(true);
    });
  });

  describe('Extension handling edge cases', () => {
    let AmazonZipDetector;

    beforeAll(() => {
      AmazonZipDetector = require('../../src/amazon-zip-detector');
    });

    test('should handle filename with spaces', async () => {
      if (!fs.existsSync(ordersZipPath)) {
        return;
      }

      const detector = new AmazonZipDetector();
      const result = await detector.analyzeZipFile(ordersZipPath, {
        originalName: 'My Amazon Orders.zip'
      });

      expect(result.isValid).toBe(true);
    });

    test('should handle uppercase extension', async () => {
      if (!fs.existsSync(ordersZipPath)) {
        return;
      }

      const detector = new AmazonZipDetector();
      const result = await detector.analyzeZipFile(ordersZipPath, {
        originalName: 'orders.ZIP'
      });

      expect(result.isValid).toBe(true);
    });

    test('should reject .zip.txt extension', async () => {
      const detector = new AmazonZipDetector();
      const tempFile = path.join(dataDir, 'temp-uploads', 'fake-zip');

      if (fs.existsSync(path.dirname(tempFile))) {
        fs.writeFileSync(tempFile, 'fake content');

        const result = await detector.analyzeZipFile(tempFile, {
          originalName: 'archive.zip.txt'
        });

        expect(result.isValid).toBe(false);

        fs.unlinkSync(tempFile);
      }
    });
  });
});
