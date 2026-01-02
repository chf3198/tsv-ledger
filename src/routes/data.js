/**
 * Data Routes Module
 *
 * Handles basic data operations and menu endpoints for TSV Ledger.
 *
 * @module routes/data
 * @version 1.0.0
 */

const express = require("express");
const { getAllExpenditures, addExpenditure } = require("../database");
const TSVCategorizer = require("../tsv-categorizer");

const router = express.Router();

/**
 * GET /api/menu.json
 * Get navigation menu structure
 */
router.get("/menu.json", (req, res) => {
  try {
    // Use the canonical menu from src/menu.js
    const menu = require("../menu");
    res.json(menu);
  } catch (error) {
    console.error("Failed to retrieve menu:", error);
    res.status(500).json({ error: "Failed to retrieve menu" });
  }
});

/**
 * GET /api/expenditures
 * Get all expenditures with optional filtering
 */
router.get("/expenditures", (req, res) => {
  try {
    const { startDate, endDate, category, source, limit } = req.query;

    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error("Failed to retrieve expenditures:", err);
        return res
          .status(500)
          .json({ error: "Failed to retrieve expenditures" });
      }

      let filtered = expenditures;

      // Apply filters
      if (startDate) {
        filtered = filtered.filter(
          (exp) => new Date(exp.date) >= new Date(startDate)
        );
      }
      if (endDate) {
        filtered = filtered.filter(
          (exp) => new Date(exp.date) <= new Date(endDate)
        );
      }
      if (category) {
        filtered = filtered.filter((exp) => exp.category === category);
      }
      if (source) {
        filtered = filtered.filter((exp) => exp.source === source);
      }

      // Sort by date descending
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply limit
      if (limit) {
        filtered = filtered.slice(0, parseInt(limit));
      }

      res.json({
        expenditures: filtered,
        total: filtered.length,
        filters: { startDate, endDate, category, source, limit },
      });
    });
  } catch (error) {
    console.error("Expenditures retrieval error:", error);
    res.status(500).json({
      error: "Failed to retrieve expenditures",
      message: error.message,
    });
  }
});

/**
 * POST /api/expenditures
 * Add a new expenditure
 */
router.post("/expenditures", (req, res) => {
  try {
    const { date, amount, description, category, source, metadata } = req.body;

    // Validation
    if (!date || !amount || !description) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Date, amount, and description are required",
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
        message: "Amount must be a positive number",
      });
    }

    // Auto-categorize if not provided
    let finalCategory = category;
    if (!finalCategory) {
      const categorizer = new TSVCategorizer();
      finalCategory = categorizer.categorizeExpenditure({
        description: description,
        amount: parseFloat(amount),
      });
    }

    const expenditure = {
      date: date,
      amount: parseFloat(amount),
      description: description,
      category: finalCategory || "Other",
      source: source || "manual",
      metadata: metadata || {},
    };

    addExpenditure(expenditure, (err, result) => {
      if (err) {
        console.error("Failed to add expenditure:", err);
        return res.status(500).json({
          error: "Failed to add expenditure",
          message: err.message,
        });
      }

      res.json({
        success: true,
        message: "Expenditure added successfully",
        expenditure: expenditure,
      });
    });
  } catch (error) {
    console.error("Add expenditure error:", error);
    res.status(500).json({
      error: "Failed to add expenditure",
      message: error.message,
    });
  }
});

module.exports = router;
