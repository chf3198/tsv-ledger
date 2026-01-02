/**
 * Import Routes Module
 *
 * Handles all data import related API endpoints for TSV Ledger.
 * Supports CSV, TSV, DAT files and Amazon ZIP archives.
 *
 * @module routes/import
 * @version 2.0.0
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getDataFilePath, getAllExpenditures, addExpenditure } = require("../database");
const { statusTracker, historyManager, csvParser, zipHandler } = require("../import");

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, "../../data", "temp-uploads"),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for zip files
  },
  fileFilter: (req, file, cb) => {
    // Accept zip files and CSV files
    if (
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.mimetype === "text/csv" ||
      file.originalname.endsWith(".zip") ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP and CSV files are allowed"));
    }
  },
});

const router = express.Router();

/**
 * GET /api/import-status
 * Get current import status
 */
router.get("/import-status", (req, res) => {
  res.json(statusTracker.getImportStatus());
});

/**
 * GET /api/import-history
 * Get import history
 */
router.get("/import-history", (req, res) => {
  try {
    const dataFilePath = getDataFilePath();
    const history = historyManager.getImportHistory(dataFilePath);
    res.json(history);
  } catch (error) {
    console.error("Failed to retrieve import history:", error);
    res.status(500).json({ error: "Failed to retrieve import history" });
  }
});

/**
 * POST /api/import-csv
 * Import expenditures from CSV/TSV/DAT file
 */
router.post("/import-csv", async (req, res) => {
  try {
    const csvData = req.body.csvData;
    if (!csvData) {
      return res.status(400).json({
        error: "No data file provided",
        message: "csvData field is required",
      });
    }

    if (typeof csvData !== "string") {
      return res.status(400).json({
        error: "Invalid data format",
        message: "csvData must be a string",
      });
    }

    statusTracker.startImport();
    statusTracker.setImportStep("Parsing CSV data...");

    const parseResult = await csvParser.parseCSVData(csvData, {
      onProgress: (processed, total) => {
        statusTracker.updateImportProgress(processed, total);
      },
      onError: (error) => {
        statusTracker.addImportError(error.message);
      }
    });

    statusTracker.setImportStep("Saving expenditures...");

    const dataFilePath = getDataFilePath();
    let savedCount = 0;

    for (const expenditure of parseResult.expenditures) {
      try {
        addExpenditure(expenditure);
        savedCount++;
        statusTracker.updateImportProgress(savedCount, parseResult.expenditures.length);
      } catch (error) {
        statusTracker.addImportError(`Failed to save expenditure: ${error.message}`);
      }
    }

    // Add to import history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      fileName: req.body.fileName || "CSV Import",
      recordCount: savedCount,
      importType: "csv",
      status: parseResult.errors.length > 0 ? "partial" : "success",
    };
    historyManager.addImportHistoryEntry(dataFilePath, historyEntry);

    statusTracker.completeImport();

    res.json({
      success: true,
      message: `Imported ${savedCount} expenditures from CSV`,
      data: {
        imported: savedCount,
        errors: parseResult.errors,
        skipped: parseResult.skipped,
      }
    });

  } catch (error) {
    statusTracker.addImportError(error.message);
    statusTracker.completeImport();
    console.error("CSV import error:", error);
    res.status(500).json({ error: "Import failed", message: error.message });
  }
});

/**
 * POST /api/validate-amazon-zip
 * Validate Amazon ZIP file before import
 */
router.post(
  "/validate-amazon-zip",
  upload.single("amazonZip"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const validation = await zipHandler.validateZipFile(req.file.path);

      // Cleanup temp file
      zipHandler.cleanupTempFile(req.file.path);

      res.json(validation);
    } catch (error) {
      console.error("ZIP validation error:", error);
      if (req.file) {
        zipHandler.cleanupTempFile(req.file.path);
      }
      res.status(500).json({ error: "Validation failed", message: error.message });
    }
  }
);

/**
 * POST /api/import-amazon-zip
 * Import data from Amazon ZIP file
 */
router.post(
  "/import-amazon-zip",
  upload.single("amazonZip"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      statusTracker.startImport();

      const importResult = await zipHandler.importFromZip(req.file.path, {
        onProgress: (progress) => {
          statusTracker.updateImportProgress(progress, 100);
        },
        onStatus: (status) => {
          statusTracker.setImportStep(status);
        }
      });

      statusTracker.setImportStep("Saving expenditures...");

      const dataFilePath = getDataFilePath();
      let savedCount = 0;

      for (const expenditure of importResult.expenditures) {
        try {
          addExpenditure(expenditure);
          savedCount++;
        } catch (error) {
          statusTracker.addImportError(`Failed to save expenditure: ${error.message}`);
        }
      }

      // Add to import history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        fileName: req.file.originalname,
        recordCount: savedCount,
        importType: "amazon-zip",
        status: "success",
      };
      historyManager.addImportHistoryEntry(dataFilePath, historyEntry);

      // Cleanup temp file
      zipHandler.cleanupTempFile(req.file.path);

      statusTracker.completeImport();

      res.json({
        success: true,
        message: `Imported ${savedCount} expenditures from Amazon ZIP`,
        data: importResult.metadata
      });

    } catch (error) {
      statusTracker.addImportError(error.message);
      statusTracker.completeImport();
      console.error("ZIP import error:", error);
      if (req.file) {
        zipHandler.cleanupTempFile(req.file.path);
      }
      res.status(500).json({ error: "Import failed", message: error.message });
    }
  }
);

module.exports = router;
