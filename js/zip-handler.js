/**
 * ZIP File Handler for Amazon Exports
 * Extracts Retail.OrderHistory CSV from Amazon ZIP
 */

/**
 * Extract and parse Amazon Order History CSV from ZIP export
 * @param {File} zipFile - ZIP file from Amazon export (containing Retail.OrderHistory.*.csv)
 * @param {Function} categorize - Function to categorize expenses (location, description) => category
 * @returns {Promise<{expenses: Array<Object>, skipped: number, filename: string}>} Parsed result with filename
 * @throws {Error} If no Retail.OrderHistory CSV found in ZIP
 */
const importAmazonZip = async (zipFile, categorize) => {
  const zip = await JSZip.loadAsync(zipFile);
  const orderHistoryFile = zip.file(/Retail\.OrderHistory\.\d+\.csv$/i)[0];
  
  if (!orderHistoryFile) {
    throw new Error('No Retail.OrderHistory CSV found in ZIP');
  }
  
  const text = await orderHistoryFile.async('text');
  const result = parseAmazonCSV(text, categorize);
  
  return {
    ...result,
    filename: orderHistoryFile.name
  };
};
