# ZIP File Processing

## Extraction System

The ZIP file processing system handles secure extraction of Amazon data archives with comprehensive error handling and validation.

## Implementation

### Core Extractor Class

```javascript
// src/amazon-integration/extractor.js
const unzipper = require('unzipper');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AmazonZipExtractor {
  constructor() {
    this.tempDir = null;
    this.extractedFiles = [];
  }

  async extract(zipFilePath, options = {}) {
    try {
      // Validate input file
      await this.validateZipFile(zipFilePath);

      // Create secure temporary directory
      this.tempDir = await this.createTempDirectory();

      // Extract files
      await this.performExtraction(zipFilePath);

      // Validate extracted content
      await this.validateExtractedFiles();

      // Catalog extracted files
      this.extractedFiles = await this.catalogFiles();

      return {
        success: true,
        tempDir: this.tempDir,
        files: this.extractedFiles,
        summary: this.generateSummary()
      };

    } catch (error) {
      await this.cleanup();
      throw new Error(`ZIP extraction failed: ${error.message}`);
    }
  }
}
```

### File Validation

```javascript
async validateZipFile(filePath) {
  const stats = await fs.stat(filePath);

  // Check file size (max 100MB)
  if (stats.size > 100 * 1024 * 1024) {
    throw new Error('ZIP file too large (max 100MB)');
  }

  // Basic file type check
  const buffer = await fs.readFile(filePath, null, 0, 4);
  const magicNumber = buffer.readUInt32LE(0);
  if (magicNumber !== 0x04034b50) { // ZIP magic number
    throw new Error('Invalid ZIP file format');
  }
}
```

### Secure Directory Creation

```javascript
async createTempDirectory() {
  const tempBase = path.join(__dirname, '..', '..', 'data', 'temp-extract');
  const sessionId = crypto.randomBytes(16).toString('hex');
  const tempDir = path.join(tempBase, `extract-${Date.now()}-${sessionId}`);

  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}
```

### Extraction Process

```javascript
async performExtraction(zipFilePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: this.tempDir }))
      .on('close', resolve)
      .on('error', reject);
  });
}
```

### Content Validation

```javascript
async validateExtractedFiles() {
  const files = await fs.readdir(this.tempDir);

  if (files.length === 0) {
    throw new Error('ZIP file contains no files');
  }

  // Check for expected Amazon file patterns
  const hasOrderFiles = files.some(file =>
    file.includes('Order') || file.includes('Item')
  );

  if (!hasOrderFiles) {
    throw new Error('ZIP file does not contain expected Amazon order files');
  }
}
```

### File Cataloging

```javascript
async catalogFiles() {
  const files = [];

  const walkDir = async (dir) => {
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await walkDir(fullPath);
      } else {
        files.push({
          name: item,
          path: fullPath,
          relativePath: path.relative(this.tempDir, fullPath),
          size: stat.size,
          type: this.identifyFileType(item),
          lastModified: stat.mtime
        });
      }
    }
  };

  await walkDir(this.tempDir);
  return files;
}

identifyFileType(filename) {
  const lowerName = filename.toLowerCase();

  if (lowerName.includes('order') && lowerName.includes('history')) {
    return 'order_history';
  }
  if (lowerName.includes('item')) {
    return 'item_details';
  }
  if (lowerName.includes('return')) {
    return 'returns';
  }
  if (lowerName.includes('digital')) {
    return 'digital_orders';
  }
  if (lowerName.includes('subscription')) {
    return 'subscriptions';
  }

  return 'unknown';
}
```

### Summary Generation

```javascript
generateSummary() {
  const summary = {
    totalFiles: this.extractedFiles.length,
    totalSize: this.extractedFiles.reduce((sum, file) => sum + file.size, 0),
    fileTypes: {}
  };

  this.extractedFiles.forEach(file => {
    summary.fileTypes[file.type] = (summary.fileTypes[file.type] || 0) + 1;
  });

  return summary;
}
```

### Cleanup Operations

```javascript
async cleanup() {
  if (this.tempDir) {
    try {
      await fs.rmdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  }
}
```

## Security Considerations

### File Validation
- **Integrity checks**: Verify ZIP file structure before extraction
- **Size limits**: Prevent processing of excessively large archives (100MB max)
- **Type verification**: Validate ZIP magic numbers and file headers

### Path Security
- **Traversal protection**: Sanitize all file paths to prevent directory traversal attacks
- **Secure directories**: Use cryptographically secure random directory names
- **Access control**: Limit file system access to designated temporary areas

### Resource Management
- **Memory monitoring**: Track memory usage during extraction operations
- **Disk space**: Monitor available disk space before extraction
- **Cleanup**: Ensure temporary files are removed after processing

## Error Handling

### Common Error Scenarios
- **Corrupted ZIP files**: Invalid or damaged archives
- **Missing files**: ZIP archives without expected Amazon data files
- **Permission issues**: Insufficient file system permissions
- **Disk space**: Insufficient space for extraction
- **Memory limits**: Large files exceeding memory constraints

### Recovery Strategies
- **Graceful degradation**: Continue processing with available files when possible
- **Detailed logging**: Comprehensive error reporting for troubleshooting
- **Automatic cleanup**: Remove temporary files on any failure
- **Retry logic**: Configurable retry attempts for transient failures