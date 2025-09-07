const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'expenditures.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

// Function to read expenditures from file
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
