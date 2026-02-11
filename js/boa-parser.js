/**
 * Bank of America Statement Parser
 * Format: Date|Description|Amount|Balance (pipe-delimited)
 */

// Pure: string -> Expense|null
const parseBOARow = (line, categorize, idx) => {
  // Split by pipe, handle optional quotes
  const fields = line.split('|').map(f => f.trim().replace(/^"|"$/g, ''));

  // Skip balance-only lines
  if (fields.length < 3) return null;
  if (fields[1].includes('Beginning balance')) return null;

  // BOA format: 0:Date, 1:Description, 2:Amount, 3:Balance
  const amountStr = fields[2] || '0';
  const amount = Math.abs(parseFloat(amountStr.replace(/[^0-9.-]/g, '')));
  
  if (isNaN(amount) || amount <= 0) return null;

  // Parse date MM/DD/YYYY to YYYY-MM-DD
  const dateParts = (fields[0] || '').split('/');
  const date = dateParts.length === 3 
    ? `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`
    : new Date().toISOString().split('T')[0];

  const description = fields[1] || 'Bank Transaction';

  // Extract location from description if present
  const locationMatch = description.match(/(FREEPORT|SMITHVILLE|AUSTIN)/i);
  const location = locationMatch ? locationMatch[1] : 'Unknown';

  return {
    id: `boa-${date}-${idx}`,
    date,
    description: description.substring(0, 100), // Truncate long descriptions
    location,
    amount,
    category: categorize('', description),
    businessPercent: 100
  };
};

// Pure: (string, fn) -> { expenses: Expense[], skipped: number }
const parseBOAStatement = (text, categorize) => {
  const lines = text.trim().split('\n');
  const parsed = lines.map((line, i) => parseBOARow(line, categorize, i));
  return {
    expenses: parsed.filter(Boolean),
    skipped: parsed.filter(e => !e).length
  };
};
