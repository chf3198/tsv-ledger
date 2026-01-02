# Codebase Reorganization Plan for AI-Optimized Development

## Overview
This document tracks the discussion, analysis, and implementation of reorganizing the TSV Ledger codebase into independent feature apps. The goal is to enhance modularity, maintainability, and AI agent effectiveness by subdividing the app, emphasizing functional design, and keeping files optimally sized for Copilot models (~6,000 characters context window).

## Discussion
- **User Input (Nov 17, 2025)**: Concern about monolithic structures; propose subdividing into independent feature apps. Emphasize functional design at low-level (module) and mid-level (feature integration). Keep files small for optimal Copilot consumption.
- **AI Analysis**: Current structure is modular but could benefit from further subdivision. Copilot thrives on focused, small files with clear context. Functional programming principles align with AI-friendly patterns.

## Decisions
- Adopt micro-feature architecture: Each feature as a semi-independent app/module.
- Functional-first: Pure functions, immutability, composition over inheritance.
- - File size target: <300 lines or <6,000 chars per file for core logic, to account for multiple open files in editor context.
- Documentation: Track in this file; update BestPractices accordingly.

## Current Structure Analysis
- **src/**: Core logic (5 modules) - Good, but some files may be large.
- **tests/**: 20+ files - Well-separated.
- **docs/**: Extensive - Supports AI context.
- **utils/**: 11 tools - Modular.
- Potential Issues: Large files in src/ or servers/ may exceed optimal size.

## Proposed Reorganization
1. **Feature Identification**:
   - Dashboard
   - Manual Entry
   - CSV Import
   - Bank Integration
   - Amazon Integration
   - Reports
   - Export
   - Automation (Email parsing, subscriptions)

2. **Subdivision Plan**:
   - Create feature folders under src/ (e.g., src/dashboard/, src/amazon-integration/).
   - Each feature: Independent module with its own logic, tests, utils.
   - Shared: Common utils in src/shared/.

3. **Functional Design**:
   - Low-level: Pure functions for data processing.
   - Mid-level: Compose functions for feature integration.

## Progress
- **Started**: Nov 17, 2025 - Document created.
- **Next**: Analyze current files.
- **Update Nov 17, 2025**: Analyzed src/ file sizes. Files >500 lines: amazon-zip-parser.js (625), bank-reconciliation-engine.js (620), geographic-analysis-engine.js (613). Total src/ lines: 3672. Need to refactor these for AI optimization.
- **Update Nov 17, 2025**: Created src/amazon-integration/ folder. Split amazon-zip-parser.js into amazon-zip-extractor.js (extraction logic) and amazon-zip-processor.js (processing logic). Reduced main file size.

## Progress
- **Started**: Nov 17, 2025 - Document created.
- **Next**: Analyze current files.
- **Update Nov 17, 2025**: Analyzed src/ file sizes. Files >500 lines: amazon-zip-parser.js (625), bank-reconciliation-engine.js (620), geographic-analysis-engine.js (613). Total src/ lines: 3672. Need to refactor these for AI optimization.
- **Update Nov 17, 2025**: Created src/amazon-integration/ folder. Split amazon-zip-parser.js into amazon-zip-extractor.js (extraction logic) and amazon-zip-processor.js (processing logic). Reduced main file size.
- **Update Nov 17, 2025**: Implemented processOrderHistoryCSV and helper functions in amazon-zip-processor.js. File now ~300 lines.

## Progress
- **Started**: Nov 17, 2025 - Document created.
- **Next**: Analyze current files.
- **Update Nov 17, 2025**: Analyzed src/ file sizes. Files >500 lines: amazon-zip-parser.js (625), bank-reconciliation-engine.js (620), geographic-analysis-engine.js (613). Total src/ lines: 3672. Need to refactor these for AI optimization.
- **Update Nov 17, 2025**: Created src/amazon-integration/ folder. Split amazon-zip-parser.js into amazon-zip-extractor.js (extraction logic) and amazon-zip-processor.js (processing logic). Reduced main file size.
- **Update Nov 17, 2025**: Implemented processOrderHistoryCSV and helper functions in amazon-zip-processor.js. File now ~300 lines.
- **Update Nov 17, 2025**: Implemented processSubscriptionsJSON and transformSubscriptionRecord.
- **Update Nov 17, 2025**: Reduced max file size to <300 lines in copilot-instructions.md. Further split amazon-zip-processor.js into amazon-zip-processor.js (main logic, 117 lines) and amazon-zip-parsers.js (parser functions, 344 lines) to stay under limit.
- **Update Nov 17, 2025**: Created new modular amazon-zip-parser.js (187 lines) that integrates all components. Original backed up as amazon-zip-parser-original.js. Basic instantiation test passed.
- **Update Nov 17, 2025**: Further split parsers into individual modules: order-parser.js (273 lines), subscription-parser.js (139 lines), cart-parser.js (201 lines), returns-parser.js (211 lines). All files now under 300 lines. Final integration test passed.
- **Update Nov 17, 2025**: **Started UX Modular Refactoring** - Created modular dashboard component architecture. Extracted overview section into pure functional modules: `overview-section.js` (297 lines), `api-client.js` (89 lines), `dom-utils.js` (108 lines). Created modular HTML (`dashboard.html`) and CSS (`dashboard.css`). All modules tested and working. File sizes: overview-section.js (297 lines), api-client.js (89 lines), dom-utils.js (108 lines).
- **Update Nov 17, 2025**: **Completed Analysis Section Extraction** - Extracted massive `displayAnalysis` function from monolithic `app.js` into modular `analysis-section.js` (181 lines) with pure functions for data quality, insights, categories, locations, and monthly trends. Updated dashboard orchestrator to compose overview + analysis sections. All components tested and working.
- **Update Nov 17, 2025**: Completed documentation updates. Updated README.md with new modular architecture description and API_DOCUMENTATION.md with ZIP import capabilities and modular parser APIs.

## Tasks
- [x] Analyze file sizes in src/ and identify large files (>500 lines).
- [x] Define feature boundaries and dependencies.
- [x] Create feature folder structure.
- [x] Refactor large files into smaller, functional modules.
- [x] Implement processOrderHistoryCSV and helpers.
- [x] Implement processSubscriptionsJSON.
- [x] Implement remaining parsers (processCartHistoryCSV, processReturnsCSV).
- [x] Create new main amazon-zip-parser.js using modules.
- [x] Update original file or deprecate it.
- [x] Run tests to ensure no breakage. (Basic instantiation test passed)
- [x] Update documentation (README, API docs).
- [ ] Test AI effectiveness post-reorg.
- [ ] **Start UX Modular Refactoring** - Extract dashboard overview into functional components
- [x] **Complete dashboard modularization** - Extract analysis, import sections
- [ ] Apply pattern to employee-benefits feature
- [ ] Refactor navigation system into functional modules
- [ ] Update main index.html to use modular components
- [ ] Update documentation (README, API docs).
- [ ] Test AI effectiveness post-reorg.

## Progress
- **Started**: Nov 17, 2025 - Document created.
- **Next**: Analyze current files.
- **Update Nov 17, 2025**: Analyzed src/ file sizes. Files >500 lines: amazon-zip-parser.js (625), bank-reconciliation-engine.js (620), geographic-analysis-engine.js (613). Total src/ lines: 3672. Need to refactor these for AI optimization.

## Risks & Mitigations
- Breaking changes: Incremental refactoring with tests.
- AI disruption: Monitor Copilot suggestions during changes.

## References
- Copilot context: ~6,000 chars; focus on open, relevant files.
- Industry: Modular, functional codebases improve AI accuracy.</content>
<parameter name="filePath">/mnt/chromeos/removable/Drive/repos/tsv-ledger/BestPractices/ProjectSpecific/REORGANIZATION_PLAN.md