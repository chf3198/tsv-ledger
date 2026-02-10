/**
 * TSV Expenses - Minimal Business Expense Tracker
 * Alpine.js application for expense management
 *
 * Features:
 * - CSV import with drag & drop
 * - Office Supplies vs Employee Benefits categorization
 * - Location-based filtering
 * - Local storage persistence (upgradeable to CloudFlare D1)
 *
 * @version 3.0.0
 */

function expenseApp() {
  return {
    // State
    expenses: [],
    filteredExpenses: [],
    locations: [],
    dragover: false,
    importStatus: "",
    importError: false,

    // Filters
    filters: {
      location: "",
      category: "",
      startDate: "",
      endDate: "",
    },

    // New expense form
    newExpense: {
      date: new Date().toISOString().split("T")[0],
      description: "",
      location: "",
      category: "",
      amount: null,
    },

    // Computed totals
    get totals() {
      return {
        supplies: this.expenses
          .filter((e) => e.category === "Office Supplies")
          .reduce((sum, e) => sum + e.amount, 0),
        benefits: this.expenses
          .filter((e) => e.category === "Employee Benefits")
          .reduce((sum, e) => sum + e.amount, 0),
      };
    },

    get counts() {
      return {
        supplies: this.expenses.filter((e) => e.category === "Office Supplies")
          .length,
        benefits: this.expenses.filter(
          (e) => e.category === "Employee Benefits"
        ).length,
      };
    },

    get filteredTotal() {
      return this.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    },

    // Lifecycle
    init() {
      this.loadFromStorage();
      this.applyFilters();
    },

    // Storage
    loadFromStorage() {
      const stored = localStorage.getItem("tsv-expenses");
      if (stored) {
        this.expenses = JSON.parse(stored);
        this.updateLocations();
      }
    },

    saveToStorage() {
      localStorage.setItem("tsv-expenses", JSON.stringify(this.expenses));
      this.updateLocations();
    },

    updateLocations() {
      this.locations = [
        ...new Set(this.expenses.map((e) => e.location).filter(Boolean)),
      ].sort();
    },

    // Import
    handleDrop(event) {
      this.dragover = false;
      const file = event.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        this.parseCSV(file);
      } else {
        this.importStatus = "Please drop a CSV file";
        this.importError = true;
      }
    },

    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) this.parseCSV(file);
    },

    async parseCSV(file) {
      this.importStatus = "Importing...";
      this.importError = false;

      try {
        const text = await file.text();
        const lines = text.trim().split("\n");
        const headers = lines[0]
          .toLowerCase()
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));

        // Map common header variations
        const headerMap = {
          date: headers.findIndex((h) => h.includes("date")),
          description: headers.findIndex(
            (h) =>
              h.includes("desc") || h.includes("item") || h.includes("name")
          ),
          location: headers.findIndex(
            (h) =>
              h.includes("location") ||
              h.includes("venue") ||
              h.includes("site")
          ),
          category: headers.findIndex(
            (h) => h.includes("category") || h.includes("type")
          ),
          amount: headers.findIndex(
            (h) =>
              h.includes("amount") ||
              h.includes("total") ||
              h.includes("price") ||
              h.includes("cost")
          ),
        };

        let imported = 0;
        let skipped = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = this.parseCSVLine(lines[i]);
          if (values.length < 2) continue;

          const amount = parseFloat(
            (values[headerMap.amount] || "0").replace(/[$,]/g, "")
          );
          if (isNaN(amount) || amount === 0) {
            skipped++;
            continue;
          }

          const expense = {
            id: Date.now() + i,
            date:
              values[headerMap.date] || new Date().toISOString().split("T")[0],
            description: values[headerMap.description] || "Imported item",
            location: values[headerMap.location] || "Unknown",
            category: this.guessCategory(
              values[headerMap.category],
              values[headerMap.description]
            ),
            amount: amount,
          };

          this.expenses.push(expense);
          imported++;
        }

        this.saveToStorage();
        this.applyFilters();
        this.importStatus =
          `✓ Imported ${imported} expenses` +
          (skipped ? `, skipped ${skipped}` : "");
      } catch (err) {
        this.importStatus = "Import failed: " + err.message;
        this.importError = true;
      }
    },

    parseCSVLine(line) {
      const result = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    },

    guessCategory(explicit, description) {
      if (explicit) {
        const lower = explicit.toLowerCase();
        if (lower.includes("benefit") || lower.includes("employee"))
          return "Employee Benefits";
        if (
          lower.includes("supply") ||
          lower.includes("supplies") ||
          lower.includes("office")
        )
          return "Office Supplies";
      }

      // AI categorization placeholder - for now use simple keyword matching
      const desc = (description || "").toLowerCase();
      const benefitKeywords = [
        "benefit",
        "health",
        "insurance",
        "dental",
        "401k",
        "retirement",
        "wellness",
        "gym",
        "meal",
        "lunch",
      ];
      const supplyKeywords = [
        "paper",
        "printer",
        "ink",
        "staple",
        "pen",
        "folder",
        "desk",
        "chair",
        "computer",
        "software",
      ];

      if (benefitKeywords.some((k) => desc.includes(k)))
        return "Employee Benefits";
      if (supplyKeywords.some((k) => desc.includes(k)))
        return "Office Supplies";

      return "Office Supplies"; // Default
    },

    // CRUD
    addExpense() {
      if (!this.newExpense.description || !this.newExpense.amount) return;

      this.expenses.push({
        ...this.newExpense,
        id: Date.now(),
        amount: parseFloat(this.newExpense.amount),
      });

      this.saveToStorage();
      this.applyFilters();

      // Reset form
      this.newExpense = {
        date: new Date().toISOString().split("T")[0],
        description: "",
        location: "",
        category: "",
        amount: null,
      };
    },

    updateExpense(expense) {
      this.saveToStorage();
    },

    deleteExpense(id) {
      if (confirm("Delete this expense?")) {
        this.expenses = this.expenses.filter((e) => e.id !== id);
        this.saveToStorage();
        this.applyFilters();
      }
    },

    clearAll() {
      if (confirm("Delete ALL expenses? This cannot be undone.")) {
        this.expenses = [];
        this.saveToStorage();
        this.applyFilters();
      }
    },

    // Filters
    applyFilters() {
      this.filteredExpenses = this.expenses
        .filter((e) => {
          if (this.filters.location && e.location !== this.filters.location)
            return false;
          if (this.filters.category && e.category !== this.filters.category)
            return false;
          if (this.filters.startDate && e.date < this.filters.startDate)
            return false;
          if (this.filters.endDate && e.date > this.filters.endDate)
            return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    },

    clearFilters() {
      this.filters = { location: "", category: "", startDate: "", endDate: "" };
      this.applyFilters();
    },

    // Export
    exportCSV() {
      const headers = ["Date", "Description", "Location", "Category", "Amount"];
      const rows = this.filteredExpenses.map((e) => [
        e.date,
        `"${e.description.replace(/"/g, '""')}"`,
        e.location,
        e.category,
        e.amount.toFixed(2),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `tsv-expenses-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },

    // Utility
    formatCurrency(amount) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount || 0);
    },
  };
}
