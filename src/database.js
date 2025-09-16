/**
 * Database Module - JSON File Operations
 * 
 * Handles all data persistence operations for the TSV Ledger application.
 * Manages expenditure data storage and retrieval using JSON files.
 * 
 * @module database
 * @author TSV Ledger Team
 * @version 2.2.2
 */

const fs = require('fs');
const path = require('path');

// Data file path - look in data directory
const dataFile = path.join(__dirname, '..', 'data', 'expenditures.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

/**
 * Reads expenditures from the JSON data file
 * 
 * @returns {Array} Array of expenditure objects
 * @throws {Error} Returns empty array if file read fails
 */
function readExpenditures() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading expenditures file:', err);
    return [];
  }
}

// Function to write expenditures to file
function writeExpenditures(expenditures) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(expenditures, null, 2));
  } catch (err) {
    console.error('Error writing expenditures file:', err);
  }
}

// Function to get all expenditures
function getAllExpenditures(callback) {
  const expenditures = readExpenditures();
  callback(null, expenditures);
}

// Function to add a new expenditure
function addExpenditure(expenditure, callback) {
  const expenditures = readExpenditures();
  const newExpenditure = {
    id: expenditures.length + 1,
    ...expenditure
  };
  expenditures.push(newExpenditure);
  writeExpenditures(expenditures);
  callback(null, newExpenditure);
}

// Export the functions
module.exports = {
  getAllExpenditures,
  addExpenditure
};
