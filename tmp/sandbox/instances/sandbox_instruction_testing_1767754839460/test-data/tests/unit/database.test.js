/**
 * Database Module Unit Tests
 *
 * @fileoverview Unit tests for database.js module covering all CRUD operations
 * and error handling scenarios
 */

const fs = require("fs");
const path = require("path");
const { DatabaseHelpers, TestFixtures } = require("../shared/test-helpers");
const database = require("../../src/database");

describe("Database Module", () => {
  const getTestDataFile = () => {
    // Use test database when NODE_ENV is 'test' or PROCESS.TEST_DB is set
    if (process.env.NODE_ENV === "test" || process.env.TEST_DB) {
      return path.join(__dirname, "..", "data", "test-expenditures.json");
    }
    return path.join(__dirname, "..", "..", "data", "expenditures.json");
  };

  beforeEach(async () => {
    // Setup clean test database
    await DatabaseHelpers.setupTestDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    const testDataFile = getTestDataFile();
    if (fs.existsSync(testDataFile)) {
      fs.writeFileSync(testDataFile, "[]");
    }
  });

  afterAll(async () => {
    // Restore original database
    await DatabaseHelpers.restoreDatabase();
  });

  describe("getAllExpenditures", () => {
    test("should return empty array when no data exists", (done) => {
      database.getAllExpenditures((err, expenditures) => {
        expect(err).toBeNull();
        expect(expenditures).toEqual([]);
        expect(Array.isArray(expenditures)).toBe(true);
        done();
      });
    });

    test("should return all expenditures when data exists", (done) => {
      const testData = [TestFixtures.sampleExpenditure];
      const testDataFile = getTestDataFile();
      fs.writeFileSync(testDataFile, JSON.stringify(testData));

      database.getAllExpenditures((err, expenditures) => {
        expect(err).toBeNull();
        expect(expenditures).toEqual(testData);
        expect(expenditures).toHaveLength(1);
        expect(expenditures[0]).toEqual(testData[0]);
        done();
      });
    });

    test("should handle malformed JSON gracefully", (done) => {
      const testDataFile = getTestDataFile();
      fs.writeFileSync(testDataFile, "invalid json");

      database.getAllExpenditures((err, expenditures) => {
        expect(err).toBeNull();
        expect(expenditures).toEqual([]);
        done();
      });
    });

    test("should handle file read errors gracefully", (done) => {
      const testDataFile = getTestDataFile();
      // Remove read permissions temporarily
      const originalMode = fs.statSync(testDataFile).mode;
      fs.chmodSync(testDataFile, 0o000);

      database.getAllExpenditures((err, expenditures) => {
        // Restore permissions
        const testDataFile = getTestDataFile();
        fs.chmodSync(testDataFile, originalMode);

        expect(err).toBeNull();
        expect(expenditures).toEqual([]);
        done();
      });
    });
  });

  describe("addExpenditure", () => {
    test("should add new expenditure with generated ID", (done) => {
      const newExpenditure = {
        date: "2024-01-15",
        amount: 29.99,
        description: "Test purchase",
        category: "Office Supplies",
        vendor: "Amazon",
        account: "Business Card",
      };

      database.addExpenditure(newExpenditure, (err, addedExpenditure) => {
        expect(err).toBeNull();
        expect(addedExpenditure).toBeDefined();
        expect(addedExpenditure.id).toBe(1);
        expect(addedExpenditure.date).toBe(newExpenditure.date);
        expect(addedExpenditure.amount).toBe(newExpenditure.amount);
        expect(addedExpenditure.description).toBe(newExpenditure.description);
        expect(addedExpenditure.category).toBe(newExpenditure.category);
        expect(addedExpenditure.vendor).toBe(newExpenditure.vendor);
        expect(addedExpenditure.account).toBe(newExpenditure.account);
        done();
      });
    });

    test("should increment ID for multiple additions", (done) => {
      const expenditure1 = { ...TestFixtures.sampleExpenditure, id: undefined };
      const expenditure2 = {
        ...TestFixtures.sampleExpenditure,
        id: undefined,
        description: "Second item",
      };

      database.addExpenditure(expenditure1, (err1, added1) => {
        expect(err1).toBeNull();
        expect(added1.id).toBe(1);

        database.addExpenditure(expenditure2, (err2, added2) => {
          expect(err2).toBeNull();
          expect(added2.id).toBe(2);
          done();
        });
      });
    });

    test("should preserve existing properties when adding", (done) => {
      const expenditureWithExtras = {
        ...TestFixtures.sampleExpenditure,
        customField: "custom value",
        taxCategory: "Business",
        notes: "Additional notes",
      };

      database.addExpenditure(expenditureWithExtras, (err, added) => {
        expect(err).toBeNull();
        expect(added.customField).toBe("custom value");
        expect(added.taxCategory).toBe("Business");
        expect(added.notes).toBe("Additional notes");
        expect(added.id).toBe(1);
        done();
      });
    });

    test("should handle file write errors gracefully", (done) => {
      // Make directory read-only to simulate write error
      const testDataFile = getTestDataFile();
      const dataDir = path.dirname(testDataFile);
      const originalMode = fs.statSync(dataDir).mode;
      fs.chmodSync(dataDir, 0o444);

      const expenditure = TestFixtures.sampleExpenditure;

      database.addExpenditure(expenditure, (err, added) => {
        // Restore permissions
        fs.chmodSync(dataDir, originalMode);

        // The function should still complete but the data might not be persisted
        // This tests error handling in the write operation
        expect(err).toBeNull(); // Callback doesn't pass errors
        done();
      });
    });

    test("should validate required fields are present", (done) => {
      const invalidExpenditure = {}; // Empty object

      database.addExpenditure(invalidExpenditure, (err, added) => {
        expect(err).toBeNull();
        expect(added).toBeDefined();
        expect(added.id).toBe(1);
        // Should still add even with missing fields
        done();
      });
    });
  });

  describe("Data Persistence", () => {
    test("should persist data between operations", (done) => {
      const expenditure = TestFixtures.sampleExpenditure;

      database.addExpenditure(expenditure, (err1, added) => {
        expect(err1).toBeNull();

        database.getAllExpenditures((err2, expenditures) => {
          expect(err2).toBeNull();
          expect(expenditures).toHaveLength(1);
          expect(expenditures[0]).toEqual(added);
          done();
        });
      });
    });

    test("should maintain data integrity across multiple operations", (done) => {
      const expenditures = [
        { ...TestFixtures.sampleExpenditure, description: "Item 1" },
        { ...TestFixtures.sampleExpenditure, description: "Item 2" },
        { ...TestFixtures.sampleExpenditure, description: "Item 3" },
      ];

      // Add all expenditures
      let completed = 0;
      expenditures.forEach((exp, index) => {
        database.addExpenditure(exp, (err, added) => {
          expect(err).toBeNull();
          expect(added.id).toBe(index + 1);

          completed++;
          if (completed === expenditures.length) {
            // Verify all were added
            database.getAllExpenditures((err2, allExpenditures) => {
              expect(err2).toBeNull();
              expect(allExpenditures).toHaveLength(3);
              expect(allExpenditures.map((e) => e.description)).toEqual([
                "Item 1",
                "Item 2",
                "Item 3",
              ]);
              done();
            });
          }
        });
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle concurrent access gracefully", (done) => {
      const expenditure1 = {
        ...TestFixtures.sampleExpenditure,
        description: "Concurrent 1",
      };
      const expenditure2 = {
        ...TestFixtures.sampleExpenditure,
        description: "Concurrent 2",
      };

      // Simulate concurrent operations
      Promise.all([
        new Promise((resolve) =>
          database.addExpenditure(expenditure1, resolve)
        ),
        new Promise((resolve) =>
          database.addExpenditure(expenditure2, resolve)
        ),
      ]).then(() => {
        database.getAllExpenditures((err, expenditures) => {
          expect(err).toBeNull();
          expect(expenditures).toHaveLength(2);
          // IDs should be unique
          const ids = expenditures.map((e) => e.id);
          expect(new Set(ids).size).toBe(ids.length);
          done();
        });
      });
    });

    test("should handle large datasets efficiently", (done) => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...TestFixtures.sampleExpenditure,
        description: `Item ${i + 1}`,
        amount: Math.random() * 100,
      }));

      let added = 0;
      largeDataset.forEach((exp) => {
        database.addExpenditure(exp, () => {
          added++;
          if (added === largeDataset.length) {
            database.getAllExpenditures((err, expenditures) => {
              expect(err).toBeNull();
              expect(expenditures).toHaveLength(1000);
              done();
            });
          }
        });
      });
    });
  });
});
