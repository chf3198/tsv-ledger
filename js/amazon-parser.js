/**
 * Amazon Order History CSV Parser
 * Format: "Order Date","Product Name","Total Owed","Shipping Address",...
 */

/**
 * Parse a single Amazon CSV row into an Expense object
 * @param {string} line - CSV line with quoted fields
 * @param {Function} categorize - Function to categorize expenses (location, description) => category
 * @param {number} idx - Row index for unique ID generation
 * @returns {Object|null} Expense object or null if invalid/zero amount
 */
const parseAmazonRow = (line, categorize, idx) => {
  // Handle quoted CSV fields with embedded commas
  const fields = [];
  let current = '', inQuotes = false;
  
  for (const c of line) {
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      fields.push(current.replace(/^"|"$/g, ''));
      current = '';
    } else current += c;
  }
  fields.push(current.replace(/^"|"$/g, ''));

  // Amazon CSV columns (from test-data/amazon-sample.csv):
  // 0:Website, 1:OrderID, 2:OrderDate, 3:PO#, 4:Currency, 5:UnitPrice,
  // 6:Tax, 7:Shipping, 8:Discounts, 9:TotalOwed, 10:Subtotal, 11:SubtotalTax,
  // 12:ASIN, 13:Condition, 14:Qty, 15:Payment, 16:OrderStatus, 17:ShipStatus,
  // 18:ShipDate, 19:ShippingOption, 20:ShipAddress, 21:BillAddress, 22:Tracking,
  // 23:ProductName, 24-27: Gift fields, 28: SerialNumber
  
  const amount = parseFloat((fields[9] || '0').replace(/[^0-9.-]/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Extract location from shipping address (e.g., "Curtis 305 OCEAN BLVD FREEPORT TX")
  const address = fields[20] || '';
  const locationMatch = address.match(/(FREEPORT|SMITHVILLE|AUSTIN)/i);
  const location = locationMatch ? locationMatch[1] : 'Unknown';

  // Parse ISO date to YYYY-MM-DD
  const dateStr = fields[2] || '';
  const date = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    id: `amazon-${fields[1]}-${idx}`, // OrderID + index
    date,
    description: fields[23] || 'Amazon Order',
    location,
    amount,
    category: categorize('', fields[23] || ''),
    businessPercent: 100 // Default: all business
  };
};

/**
 * Parse complete Amazon Order History CSV export
 * @param {string} text - Full CSV text content
 * @param {Function} categorize - Function to categorize expenses (location, description) => category
 * @returns {{expenses: Array<Object>, skipped: number}} Parsed expenses and count of invalid rows
 */
const parseAmazonCSV = (text, categorize) => {
  const lines = text.trim().split('\n').slice(1); // Skip header
  const parsed = lines.map((line, i) => parseAmazonRow(line, categorize, i));
  return {
    expenses: parsed.filter(Boolean),
    skipped: parsed.filter(e => !e).length
  };
};
