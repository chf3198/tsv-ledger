/**
 * Subscribe & Save Detection Component Tests
 *
 * Tests for the Subscribe & Save detection component
 */

const BaseComponentTester = require("./base-component-tester");

/**
 * Subscribe & Save detection component tests
 */
class SubscribeAndSaveTests extends BaseComponentTester {
  /**
   * Test Subscribe & Save detection component
   * @returns {Object} Test results
   */
  testSubscribeAndSaveDetection() {
    console.log("\n🔄 Testing Subscribe & Save Detection Component...");

    const results = {
      tested: 0,
      detected: 0,
      highConfidence: 0,
      lowConfidence: 0,
      falsePositives: [],
      missed: [],
      details: [],
    };

    // Known Subscribe & Save indicators for validation
    const knownSSIndicators = [
      "subscribe & save",
      "subscription",
      "recurring",
      "auto-delivery",
      "monthly delivery",
      "subscribe",
      "recurring delivery",
    ];

    this.sampleData.forEach((order) => {
      const analysis = this.categorizer.analyzeAmazonOrder(order);
      const ssResult = analysis.subscribeAndSave;

      results.tested++;

      // Check if order contains obvious S&S indicators
      const hasObviousIndicators = knownSSIndicators.some((indicator) =>
        order.items.toLowerCase().includes(indicator.toLowerCase())
      );

      if (ssResult.isSubscribeAndSave) {
        results.detected++;

        if (ssResult.confidence > 0.8) {
          results.highConfidence++;
        } else {
          results.lowConfidence++;
        }

        // Check for potential false positives
        if (!hasObviousIndicators && ssResult.confidence < 0.7) {
          results.falsePositives.push({
            orderId: order.orderId,
            items: order.items,
            confidence: ssResult.confidence,
            indicators: ssResult.indicators || [],
          });
        }
      } else if (hasObviousIndicators) {
        // Potential missed detection
        results.missed.push({
          orderId: order.orderId,
          items: order.items,
          expectedIndicators: knownSSIndicators.filter((ind) =>
            order.items.toLowerCase().includes(ind.toLowerCase())
          ),
        });
      }

      results.details.push({
        orderId: order.orderId,
        items: order.items.substring(0, 50) + "...",
        isDetected: ssResult.isSubscribeAndSave,
        confidence: ssResult.confidence,
        hasObviousIndicators,
      });
    });

    // Calculate metrics
    results.detectionRate = ((results.detected / results.tested) * 100).toFixed(
      1
    );
    results.accuracyRate = (
      ((results.detected - results.falsePositives.length) / results.tested) *
      100
    ).toFixed(1);

    console.log(`\n📊 Subscribe & Save Detection Results:`);
    console.log(`   Tested Orders: ${results.tested}`);
    console.log(
      `   Detected S&S: ${results.detected} (${results.detectionRate}%)`
    );
    console.log(`   High Confidence: ${results.highConfidence}`);
    console.log(`   Low Confidence: ${results.lowConfidence}`);
    console.log(
      `   Potential False Positives: ${results.falsePositives.length}`
    );
    console.log(`   Potentially Missed: ${results.missed.length}`);
    console.log(`   Estimated Accuracy: ${results.accuracyRate}%`);

    if (results.falsePositives.length > 0) {
      console.log(`\n⚠️  Potential False Positives:`);
      results.falsePositives.slice(0, 3).forEach((fp) => {
        console.log(
          `   • ${fp.items.substring(0, 40)}... (confidence: ${(
            fp.confidence * 100
          ).toFixed(1)}%)`
        );
      });
    }

    if (results.missed.length > 0) {
      console.log(`\n❌ Potentially Missed Detections:`);
      results.missed.slice(0, 3).forEach((missed) => {
        console.log(
          `   • ${missed.items.substring(
            0,
            40
          )}... (indicators: ${missed.expectedIndicators.join(", ")})`
        );
      });
    }

    this.testResults.set("subscribeAndSave", results);
    return results;
  }

  /**
   * Run all Subscribe & Save tests
   * @returns {Promise<void>}
   */
  async runAllTests() {
    await this.loadSampleData();
    this.testSubscribeAndSaveDetection();
    this.generateSummary();
  }
}

module.exports = SubscribeAndSaveTests;
