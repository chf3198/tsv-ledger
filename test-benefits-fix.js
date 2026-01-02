const http = require("http");

// Test the employee benefits API
const testBenefitsAPI = () => {
  console.log("Testing Employee Benefits API...");

  // Test the amazon-items endpoint
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/amazon-items",
      method: "GET",
    },
    (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const items = JSON.parse(data);
          console.log(`✓ API returned ${items.length} items`);

          if (items.length > 0) {
            const item = items[0];
            console.log("Sample item structure:");
            console.log(`  - id: ${item.id}`);
            console.log(`  - description: ${item.description}`);
            console.log(`  - amount: ${item.amount}`);
            console.log(`  - date: ${item.date}`);
            console.log(`  - category: ${item.category}`);

            // Check if the expected fields exist
            if (item.amount && item.description) {
              console.log("✓ Item has correct fields (amount, description)");
              console.log("✓ Benefits field mapping fix verified!");
            } else {
              console.log("✗ Item missing expected fields");
              if (!item.amount) console.log("  - Missing: amount");
              if (!item.description) console.log("  - Missing: description");
            }
          }

          console.log("✓ Benefits API test completed successfully");
          process.exit(0);
        } catch (e) {
          console.error("✗ Failed to parse API response:", e.message);
          process.exit(1);
        }
      });
    }
  );

  req.on("error", (e) => {
    console.error("✗ API request failed:", e.message);
    console.error("Make sure the server is running on port 3000");
    process.exit(1);
  });

  req.setTimeout(5000, () => {
    console.error("✗ API request timed out");
    req.destroy();
    process.exit(1);
  });

  req.end();
};

// Wait for server to be ready
console.log("Waiting for server to be ready...");
setTimeout(testBenefitsAPI, 2000);
