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
    this.importStatus = 'Processing...';
    this.importError = false;
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let result = [];
      if (ext === 'zip') {
        result = await window.parseZip(file);
      } else if (ext === 'csv') {
        result = window.parseAmazonCSV(await file.text());
      } else if (ext === 'dat') {
        result = window.parseBOADAT(await file.text());
      }
      const newExpenses = result.filter(e => !isDuplicate(e, this.expenses, this.importHistory));
      const duplicatesCount = result.length - newExpenses.length;
      this.expenses = [...this.expenses, ...newExpenses];
      this.save();
      addImportRecord(createImportRecord({ ext, result, filename: file.name, newCount: newExpenses.length, dupCount: duplicatesCount }));
      this.importStatus = `Imported ${newExpenses.length} items (${duplicatesCount} duplicates skipped)`;
      this.importComplete = true;
    } catch (e) { this.setError(e.message); }
  }
};
