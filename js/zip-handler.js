/**
 * ZIP File Handler for Amazon Exports
 * Extracts Retail.OrderHistory CSV from Amazon ZIP
 */

// Pure: (File, fn) -> Promise<{ expenses, skipped, filename }>
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
