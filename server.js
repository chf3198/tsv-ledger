/**
 * TSV Ledger - Main Express Server
 *
 * @fileoverview Main server application for Texas Sunset Venues expense tracking
 *               and business intelligence platform. Provides REST API endpoints
 *               for data import, analysis, and comprehensive business insights.
 *               Features complete Amazon order management, AI-powered analysis,
 *               and premium business intelligence capabilities.
 *
 * @version 2.2.3
 * @author GitHub Copilot (Claude Sonnet 3.5)
 * @since 2025-09-05
 * @updated 2025-11-12
 *
 * @requires express Express.js web framework
 * @requires ./src/routes/* Modular route handlers
 *
 * @features
 * - Modular API endpoints for different functionalities
 * - Amazon order import and CRUD operations
 * - AI-powered expense categorization
 * - Premium business intelligence analytics
 * - Employee benefits filtering
 * - Subscribe & Save detection
 * - Comprehensive testing API endpoints
 * - Real-time data analysis
 *
 * @example
 * // Start the server
 * node server.js
 * // Access at http://localhost:3000
 *
 * @example
 * // Development with auto-reload
 * npm run dev
 */

const express = require("express");
const path = require("path");
const fs = require("fs");

// Import route modules
const importRoutes = require("./src/routes/import");
const dataRoutes = require("./src/routes/data");
const analyticsRoutes = require("./src/routes/analytics");
const amazonRoutes = require("./src/routes/amazon");
const employeeBenefitsRoutes = require("./src/routes/employee-benefits");
const subscriptionRoutes = require("./src/routes/subscription");
const geographicRoutes = require("./src/routes/geographic");

const app = express();
const port = 3000;

// Small helper to escape text for safe HTML embedding
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function (s) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[s];
  });
}

// Middleware for parsing JSON and URL-encoded data (with increased limits for CSV files)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from the 'public' directory
// Middleware: inject client-side shell initializer into HTML pages that lack the sidebar
app.use((req, res, next) => {
  try {
    // Only consider GET requests for HTML files
    if (req.method !== "GET") return next();

    let reqPath = req.path;
    if (reqPath === "/") reqPath = "/index.html";
    if (!reqPath.endsWith(".html")) return next();

    const filePath = path.join(
      __dirname,
      "public",
      decodeURIComponent(reqPath)
    );
    if (!fs.existsSync(filePath)) return next();

    const content = fs.readFileSync(filePath, "utf8");

    // If the page already references the init-shell script or marker, serve as-is
    if (
      /\/js\/init-shell\.js/i.test(content) ||
      /id=["']?tsv-shell-injected["']?/i.test(content)
    ) {
      return res.send(content);
    }

    // Use shared menu module
    const serverMenu = require("./src/menu");

    // Helper to render menu to HTML string. Accept current request path so we can mark the active link.
    function renderMenuHtml(menu, currentPath) {
      const header = `\n  <div class="sidebar-header">\n    <h4><i class="fas fa-chart-line me-2"></i>TSV Ledger</h4>\n    <small class="text-muted">Financial Intelligence Platform</small>\n  </div>`;
      const items = menu
        .map((item) => {
          const ds = item.dataSection
            ? ` data-section="${item.dataSection}"`
            : "";
          // Determine active link based on current request path. Normalize trailing slashes.
          const normalize = (p) =>
            String(p || "")
              .replace(/\/index\.html$/i, "/")
              .replace(/\/+$/, "") || "/";
          const cur = normalize(currentPath);
          const hrefNorm = normalize(item.href);
          const isActive = cur === hrefNorm;
          const activeCls = isActive ? " active" : "";
          return `<li class="nav-item"><a class="nav-link${activeCls}" href="${item.href}"${ds}><i class="${item.icon} me-2"></i>${item.text}</a></li>`;
        })
        .join("\n  ");
      return `<ul class="navbar-nav flex-column">\n  ${header}\n  ${items}\n  </ul>`;
    }

    // Inject the shell HTML into the page
    const shellHtml = `
<!-- TSV Shell Injected Content -->
<div id="tsv-shell-injected" class="d-none">
  <nav id="sidebar" class="sidebar">
    <div class="sidebar-content">
      ${renderMenuHtml(serverMenu, reqPath)}
    </div>
  </nav>
  <div id="main-content" class="main-content">
    <button id="sidebar-toggle" class="btn btn-outline-secondary sidebar-toggle">
      <i class="fas fa-bars"></i>
    </button>
  </div>
</div>
<script src="/js/init-shell.js"></script>
<!-- End TSV Shell Injected Content -->
`;

    // Insert the shell HTML before the closing </body> tag
    const modifiedContent = content.replace(
      /<\/body>/i,
      shellHtml + "\n</body>"
    );

    res.send(modifiedContent);
  } catch (error) {
    console.error("Shell injection error:", error);
    next();
  }
});

// Mount route modules
app.use("/api", importRoutes);
app.use("/api", dataRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", amazonRoutes);
app.use("/api", employeeBenefitsRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api", geographicRoutes);

// Menu API endpoint
app.get("/api/menu.json", (req, res) => {
  try {
    const menu = require("./src/menu");
    res.json(menu);
  } catch (error) {
    console.error("Error serving menu:", error);
    res.status(500).json({ error: "Failed to load menu" });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Main page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: "2.2.3",
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 TSV Ledger server running on http://localhost:${port}`);
  console.log(`📊 Version 2.2.3 - Professional Business Intelligence Platform`);
  console.log(`🔧 Development mode: ${process.env.NODE_ENV || "production"}`);
});
