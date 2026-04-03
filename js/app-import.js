/** File import and parsing methods (ADR-026 - methods extraction) */
const appImport = {
  handleDrop(e) {
    this.dragover = false;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    (ext === 'csv' || ext === 'dat' || ext === 'zip') ? this.importFile(file) : this.setError('Please drop a CSV, DAT, or ZIP file');
  },
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) this.importFile(file);
  },
  setError(msg) {
    this.importStatus = msg;
    this.importError = true;
    this.importComplete = false;
  },
  async importFile(file) {
    this.importStatus = 'Importing...';
    this.importError = false;
    this.importComplete = false;
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let result;
      if (ext === 'zip') {
        result = await importAmazonZip(file, guessCategory);
      } else if (ext === 'csv') {
        const text = await file.text();
        result = text.includes('Order ID') && text.includes('Product Name')
          ? parseAmazonCSV(text, guessCategory)
          : await parseCSVFile(file, guessCategory);
      } else if (ext === 'dat') {
        result = parseBOAStatement(await file.text(), guessCategory);
      } else {
        throw new Error('Unsupported file type');
      }

      const existingIds = new Set(this.expenses.map(e => e.id));
      const newExpenses = result.expenses.filter(e => !existingIds.has(e.id));
      const duplicatesCount = result.expenses.length - newExpenses.length;
      this.expenses = [...this.expenses, ...newExpenses];
      await this.save();
      addImportRecord(createImportRecord({ ext, result, filename: file.name, newCount: newExpenses.length, dupCount: duplicatesCount }));
      this.importHistory = loadImportHistory();

      this.importStatus = [
        `✓ ${newExpenses.length} new`,
        duplicatesCount > 0 ? `${duplicatesCount} duplicates` : '',
        result.skipped ? `${result.skipped} skipped` : ''
      ].filter(Boolean).join(', ');
      this.importComplete = true;

      if (this.storageMode === 'cloud' && this.auth.authenticated) {
        await this.syncToCloud();
      }
    } catch (e) { this.setError(e.message); }
  }
};
