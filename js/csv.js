/**
 * CSV Parser - Pure functional parsing
 * @module csv
 */

// Pure: string -> string[]
const parseCSVLine = (line) => {
  let result = [], current = '', inQuotes = false;
  for (const c of line) {
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += c;
  }
  return [...result, current.trim()];
};

// Pure: string -> HeaderMap
const parseCSVHeaders = (headerLine) => {
  const h = headerLine.toLowerCase().split(',').map(s => s.trim().replace(/"/g, ''));
  const find = (patterns) => h.findIndex(col => patterns.some(p => col.includes(p)));
  return {
    date: find(['order date', 'date', 'ship date']), 
    description: find(['product name', 'desc', 'item', 'name']),
    location: find(['location', 'venue', 'site']), 
    category: find(['category', 'type']),
    amount: find(['total owed', 'amount', 'total', 'price', 'cost'])
  };
};

// Pure: (string[], HeaderMap, fn, number) -> Expense|null
const rowToExpense = (values, map, categorize, idx) => {
  const amount = parseFloat((values[map.amount] || '0').replace(/[$,]/g, ''));
  if (isNaN(amount) || amount <= 0 || values.length < 2) return null;
  return {
    id: Date.now() + idx, amount,
    date: values[map.date] || new Date().toISOString().split('T')[0],
    description: values[map.description] || 'Imported item',
    location: values[map.location] || 'Unknown',
    category: categorize(values[map.category], values[map.description])
  };
};

// Pure: (string, fn) -> { expenses: Expense[], skipped: number }
const parseCSVContent = (text, categorize) => {
  const lines = text.trim().split('\n');
  const map = parseCSVHeaders(lines[0]);
  const parsed = lines.slice(1).map((line, i) => rowToExpense(parseCSVLine(line), map, categorize, i));
  return { expenses: parsed.filter(Boolean), skipped: parsed.filter(e => !e).length };
};

// Effect: (File, fn) -> Promise<{ expenses, skipped }>
const parseCSVFile = async (file, categorize) => parseCSVContent(await file.text(), categorize);
