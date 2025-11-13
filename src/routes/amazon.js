/**
 * Amazon Routes Module
 *
 * Handles Amazon-specific operations including item management and CRUD operations.
 *
 * @module routes/amazon
 * @version 1.0.0
 */

const express = require('express');
const { getAllExpenditures } = require('../database');

const router = express.Router();

/**
 * GET /api/amazon-items
 * Get all Amazon items with optional filtering
 */
router.get('/amazon-items', (req, res) => {
  try {
    const { startDate, endDate, category, limit, search } = req.query;

    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve Amazon items:', err);
        return res.status(500).json({ error: 'Failed to retrieve Amazon items' });
      }

      // Filter for Amazon items only
      let amazonItems = expenditures.filter(exp =>
        exp.source === 'amazon-official' ||
        exp.source === 'amazon-chrome' ||
        exp.category === 'Amazon'
      );

      // Apply additional filters
      if (startDate) {
        amazonItems = amazonItems.filter(item => new Date(item.date) >= new Date(startDate));
      }
      if (endDate) {
        amazonItems = amazonItems.filter(item => new Date(item.date) <= new Date(endDate));
      }
      if (category && category !== 'all') {
        amazonItems = amazonItems.filter(item => item.category === category);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        amazonItems = amazonItems.filter(item =>
          item.description.toLowerCase().includes(searchLower) ||
          (item.metadata && item.metadata.asin && item.metadata.asin.toLowerCase().includes(searchLower))
        );
      }

      // Sort by date descending
      amazonItems.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply limit
      if (limit) {
        amazonItems = amazonItems.slice(0, parseInt(limit));
      }

      // Calculate summary statistics
      const totalSpent = amazonItems.reduce((sum, item) => sum + item.amount, 0);
      const avgOrderValue = amazonItems.length > 0 ? totalSpent / amazonItems.length : 0;

      // Category breakdown for Amazon items
      const categoryBreakdown = {};
      amazonItems.forEach(item => {
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + item.amount;
      });

      res.json({
        items: amazonItems,
        total: amazonItems.length,
        summary: {
          totalSpent: totalSpent,
          averageOrderValue: avgOrderValue,
          categoryBreakdown: categoryBreakdown
        },
        filters: { startDate, endDate, category, limit, search }
      });
    });
  } catch (error) {
    console.error('Amazon items retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve Amazon items',
      message: error.message
    });
  }
});

/**
 * PUT /api/amazon-items/:id
 * Update an Amazon item
 */
router.put('/amazon-items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate required fields
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Request body must contain fields to update'
      });
    }

    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for update:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Find the item to update
      const itemIndex = expenditures.findIndex(exp => exp.id === id);
      if (itemIndex === -1) {
        return res.status(404).json({
          error: 'Item not found',
          message: `Amazon item with ID ${id} not found`
        });
      }

      const item = expenditures[itemIndex];

      // Validate that it's an Amazon item
      if (item.source !== 'amazon-official' &&
          item.source !== 'amazon-chrome' &&
          item.category !== 'Amazon') {
        return res.status(400).json({
          error: 'Invalid item type',
          message: 'This endpoint only supports Amazon items'
        });
      }

      // Apply updates
      const updatedItem = { ...item, ...updates };

      // Validate amount if provided
      if (updates.amount !== undefined) {
        const amount = parseFloat(updates.amount);
        if (isNaN(amount) || amount <= 0) {
          return res.status(400).json({
            error: 'Invalid amount',
            message: 'Amount must be a positive number'
          });
        }
        updatedItem.amount = amount;
      }

      // Update the item in the array
      expenditures[itemIndex] = updatedItem;

      // Save back to file
      const fs = require('fs');
      const path = require('path');
      const dataFile = path.join(__dirname, '../../expenditures.json');

      fs.writeFile(dataFile, JSON.stringify(expenditures, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Failed to save updated Amazon item:', writeErr);
          return res.status(500).json({
            error: 'Failed to save changes',
            message: writeErr.message
          });
        }

        res.json({
          success: true,
          message: 'Amazon item updated successfully',
          item: updatedItem
        });
      });
    });
  } catch (error) {
    console.error('Update Amazon item error:', error);
    res.status(500).json({
      error: 'Failed to update Amazon item',
      message: error.message
    });
  }
});

module.exports = router;