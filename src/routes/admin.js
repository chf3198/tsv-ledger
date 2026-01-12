/**
 * Admin Routes - Data Management API
 *
 * Provides administrative endpoints for managing application data.
 * Includes data clearing, backup, and system maintenance functions.
 *
 * @module routes/admin
 * @author TSV Ledger Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const database = require('../database');

// Data directory path
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

/**
 * GET /api/admin/status
 * Get current data status and statistics
 */
router.get('/admin/status', async (req, res) => {
  try {
    const stats = await getDataStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting admin status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/clear-expenditures
 * Clear all expenditure data
 */
router.post('/admin/clear-expenditures', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { confirm: "DELETE_ALL_DATA" }'
      });
    }

    // Create backup before clearing
    const backup = await createBackup('expenditures');

    // Clear expenditures
    database.writeExpenditures([]);

    res.json({
      success: true,
      message: 'All expenditure data cleared',
      backup
    });
  } catch (error) {
    console.error('Error clearing expenditures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/clear-import-history
 * Clear import history data
 */
router.post('/admin/clear-import-history', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { confirm: "DELETE_ALL_DATA" }'
      });
    }

    const historyFile = path.join(DATA_DIR, 'import-history.json');

    // Create backup before clearing
    const backup = await createBackup('import-history');

    // Clear import history
    if (fs.existsSync(historyFile)) {
      fs.writeFileSync(historyFile, JSON.stringify([], null, 2));
    }

    res.json({
      success: true,
      message: 'Import history cleared',
      backup
    });
  } catch (error) {
    console.error('Error clearing import history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/clear-amazon-data
 * Clear Amazon-related data (edits, order history)
 */
router.post('/admin/clear-amazon-data', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { confirm: "DELETE_ALL_DATA" }'
      });
    }

    const amazonFiles = [
      'amazon_item_edits.json',
      'amazon_order_history.csv'
    ];

    // Create backups and clear
    const backups = [];
    for (const file of amazonFiles) {
      const filePath = path.join(DATA_DIR, file);
      if (fs.existsSync(filePath)) {
        const backup = await createBackup(file.replace('.json', '').replace('.csv', ''));
        backups.push(backup);

        // Clear the file (write empty array for JSON, empty string for CSV)
        if (file.endsWith('.json')) {
          fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        } else {
          fs.writeFileSync(filePath, '');
        }
      }
    }

    res.json({
      success: true,
      message: 'Amazon data cleared',
      backups
    });
  } catch (error) {
    console.error('Error clearing Amazon data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/clear-all
 * Clear all application data (expenditures, import history, Amazon data)
 */
router.post('/admin/clear-all', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { confirm: "DELETE_ALL_DATA" }'
      });
    }

    // Create full backup before clearing
    const backup = await createFullBackup();

    // Clear expenditures
    database.writeExpenditures([]);

    // Clear import history
    const historyFile = path.join(DATA_DIR, 'import-history.json');
    if (fs.existsSync(historyFile)) {
      fs.writeFileSync(historyFile, JSON.stringify([], null, 2));
    }

    // Clear Amazon data files
    const amazonFiles = ['amazon_item_edits.json', 'amazon_order_history.csv'];
    for (const file of amazonFiles) {
      const filePath = path.join(DATA_DIR, file);
      if (fs.existsSync(filePath)) {
        if (file.endsWith('.json')) {
          fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        } else {
          fs.writeFileSync(filePath, '');
        }
      }
    }

    // Clean up temp directories
    await cleanupTempDirectories();

    res.json({
      success: true,
      message: 'All application data cleared',
      backup
    });
  } catch (error) {
    console.error('Error clearing all data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/backups
 * List available backups
 */
router.get('/admin/backups', async (req, res) => {
  try {
    const backupDir = path.join(DATA_DIR, 'backups');

    if (!fs.existsSync(backupDir)) {
      return res.json({
        success: true,
        backups: []
      });
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          filename: f,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({
      success: true,
      backups
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper Functions

/**
 * Get statistics about current data
 */
async function getDataStats() {
  const stats = {
    expenditures: { count: 0, lastModified: null },
    importHistory: { count: 0, lastModified: null },
    amazonEdits: { count: 0, lastModified: null },
    tempDirectories: { count: 0 }
  };

  // Expenditures
  return new Promise((resolve) => {
    database.getAllExpenditures((err, expenditures) => {
      stats.expenditures.count = expenditures ? expenditures.length : 0;

      const expFile = database.getDataFilePath();
      if (fs.existsSync(expFile)) {
        stats.expenditures.lastModified = fs.statSync(expFile).mtime;
      }

      // Import history
      const historyFile = path.join(DATA_DIR, 'import-history.json');
      if (fs.existsSync(historyFile)) {
        try {
          const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
          stats.importHistory.count = Array.isArray(history) ? history.length : 0;
          stats.importHistory.lastModified = fs.statSync(historyFile).mtime;
        } catch (e) {
          stats.importHistory.count = 0;
        }
      }

      // Amazon edits
      const amazonEditsFile = path.join(DATA_DIR, 'amazon_item_edits.json');
      if (fs.existsSync(amazonEditsFile)) {
        try {
          const edits = JSON.parse(fs.readFileSync(amazonEditsFile, 'utf8'));
          stats.amazonEdits.count = Array.isArray(edits) ? edits.length : 0;
          stats.amazonEdits.lastModified = fs.statSync(amazonEditsFile).mtime;
        } catch (e) {
          stats.amazonEdits.count = 0;
        }
      }

      // Temp directories
      const tempDirs = fs.readdirSync(DATA_DIR).filter(f =>
        f.startsWith('temp-') && fs.statSync(path.join(DATA_DIR, f)).isDirectory()
      );
      stats.tempDirectories.count = tempDirs.length;

      resolve(stats);
    });
  });
}

/**
 * Create a backup of a specific data file
 */
async function createBackup(type) {
  const backupDir = path.join(DATA_DIR, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `${type}-backup-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);

  let sourceFile;
  switch (type) {
  case 'expenditures':
    sourceFile = database.getDataFilePath();
    break;
  case 'import-history':
    sourceFile = path.join(DATA_DIR, 'import-history.json');
    break;
  case 'amazon_item_edits':
    sourceFile = path.join(DATA_DIR, 'amazon_item_edits.json');
    break;
  default:
    sourceFile = path.join(DATA_DIR, `${type}.json`);
  }

  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, backupPath);
    return backupFilename;
  }

  return null;
}

/**
 * Create a full backup of all data
 */
async function createFullBackup() {
  const backupDir = path.join(DATA_DIR, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `full-backup-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);

  const backupData = {
    timestamp: new Date().toISOString(),
    expenditures: [],
    importHistory: [],
    amazonEdits: []
  };

  // Backup expenditures
  const expFile = database.getDataFilePath();
  if (fs.existsSync(expFile)) {
    backupData.expenditures = JSON.parse(fs.readFileSync(expFile, 'utf8'));
  }

  // Backup import history
  const historyFile = path.join(DATA_DIR, 'import-history.json');
  if (fs.existsSync(historyFile)) {
    backupData.importHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }

  // Backup Amazon edits
  const amazonEditsFile = path.join(DATA_DIR, 'amazon_item_edits.json');
  if (fs.existsSync(amazonEditsFile)) {
    backupData.amazonEdits = JSON.parse(fs.readFileSync(amazonEditsFile, 'utf8'));
  }

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

  return backupFilename;
}

/**
 * Clean up temporary directories
 */
async function cleanupTempDirectories() {
  const tempDirs = fs.readdirSync(DATA_DIR).filter(f =>
    f.startsWith('temp-') && fs.statSync(path.join(DATA_DIR, f)).isDirectory()
  );

  for (const dir of tempDirs) {
    const dirPath = path.join(DATA_DIR, dir);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }

  return tempDirs.length;
}

module.exports = router;
