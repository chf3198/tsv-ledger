# TSV Ledger — Feature Roadmap

> **Product Position**: Amazon Expense Allocation for Tax Prep
>
> **Target User**: Accountants (including business owners acting as their own accountant)
>
> **Primary Market**: For-profit C Corporations, S Corporations, LLCs

---

## 📋 Roadmap Overview

| Phase       | Focus                             | Status      |
| ----------- | --------------------------------- | ----------- |
| **Phase 0** | Security & Legal Foundation       | 🔴 Priority |
| **Phase 1** | Core Allocation Intelligence      | 🟡 Next     |
| **Phase 2** | Professional Export & Integration | ⚪ Planned  |
| **Phase 3** | AI-Assisted Categorization        | ⚪ Planned  |
| **Phase 4** | Platform Expansion                | ⚪ Future   |

---

## Phase 0: Security & Legal Foundation 🔴

**Goal**: Protect users and indemnify the company from liability.

### 0.1 Terms of Service & Disclaimer

- [ ] Create comprehensive Terms of Service page
- [ ] Add "Not Tax Advice" disclaimer prominently in UI
- [ ] Require acceptance of terms before first use
- [ ] Add disclaimer to all exports

**Key Language**:

> This tool provides expense allocation assistance only. It does not constitute tax, legal, or accounting advice. Users are solely responsible for verifying all allocations with a qualified tax professional. The developers assume no liability for tax positions taken based on this tool's output.

### 0.2 Data Security

- [ ] Document data handling practices (local-first)
- [ ] Add data retention/deletion controls
- [ ] Implement secure export (no PII in filenames)
- [ ] Add session timeout for authenticated users
- [ ] Security audit of OAuth implementation

### 0.3 Privacy Policy

- [ ] Create Privacy Policy page
- [ ] Document what data is collected (minimal)
- [ ] Document what data is NOT collected
- [ ] CCPA/GDPR compliance statement

---

## Phase 1: Core Allocation Intelligence 🟡

**Goal**: Transform research knowledge into actionable product features.

### 1.1 Fringe Benefit Sub-Categories

Replace binary "Benefits" with tax-meaningful categories:

```
Board Member Benefits (current)
    ↓
├── Taxable Compensation (W-2 reportable)
├── De Minimis Benefits (excludable, small value)
├── Working Condition Fringe (excludable, business use)
├── IRC §119 Meals/Lodging (excludable if requirements met)
└── Requires Review (default for ambiguous items)
```

- [ ] Add sub-category data model
- [ ] Update UI to show sub-category selection
- [ ] Add help text explaining each category
- [ ] Update export to include sub-categories

### 1.2 Entity Type Configuration

- [ ] Add entity type selector in Settings
  - C Corporation
  - S Corporation (with 2%+ shareholder warning)
  - LLC (with tax election sub-options)
  - Partnership
  - Sole Proprietorship
- [ ] Display entity-specific warnings (e.g., "S Corp 2%+ shareholders cannot exclude this benefit")
- [ ] Adjust default allocations based on entity type

### 1.3 Gift Recipient Tracking

- [ ] Add recipient field for gift-type expenses
- [ ] Track $25/person/year IRS limit
- [ ] Alert when approaching/exceeding limit
- [ ] Aggregate view of gifts per recipient

### 1.4 Business Purpose Documentation

- [ ] Add free-text "Business Purpose" field per expense
- [ ] Suggest common purposes based on description
- [ ] Include in export for audit trail

---

## Phase 2: Professional Export & Integration 🟡

**Goal**: Make output directly usable by accounting software.

### 2.1 Enhanced Export Formats

- [ ] Calculated amounts export (not just percentages)
  - Business Amount = Amount × Business%
  - Benefits Amount = Amount × (100 - Business%)
- [ ] QuickBooks IIF format export
- [ ] Xero CSV format export
- [ ] Generic chart of accounts mapping

### 2.2 Date/Period Filtering

- [ ] Tax year filtering (calendar year default)
- [ ] Fiscal year configuration option
- [ ] Quarter quick-filters (Q1, Q2, Q3, Q4)
- [ ] Custom date range picker

### 2.3 Report Generation

- [ ] Summary report by category
- [ ] Summary report by payment method
- [ ] Year-over-year comparison
- [ ] PDF export for client delivery

---

## Phase 3: AI-Assisted Categorization ⚪

**Goal**: Reduce manual categorization effort with intelligent suggestions.

### 3.1 LLM Integration (OpenRouter.ai)

- [ ] Integrate OpenRouter.ai API for free LLM access
- [ ] Auto-suggest category based on description
- [ ] Confidence score display
- [ ] User confirmation required (AI never auto-allocates)

### 3.2 Smart Defaults

- [ ] Learn from user's previous allocations
- [ ] "Apply to similar items" bulk action
- [ ] Vendor-based default rules
- [ ] Category rules editor

### 3.3 Receipt Processing

- [ ] Photo/PDF upload for receipts
- [ ] OCR extraction via free APIs
- [ ] Link receipts to expenses
- [ ] Receipt storage (local or cloud)

---

## Phase 4: Platform Expansion ⚪

**Goal**: Extend beyond Amazon to comprehensive business expense management.

### 4.1 Additional E-Commerce Platforms

- [ ] Costco Business import
- [ ] Staples/Office Depot import
- [ ] Walmart Business import
- [ ] Generic e-commerce CSV template

### 4.2 Additional Bank Formats

- [ ] Chase Business import
- [ ] Wells Fargo Business import
- [ ] Capital One Business import
- [ ] Generic bank CSV template

### 4.3 Credit Card Statement Import

- [ ] American Express Business
- [ ] Chase Ink
- [ ] Capital One Spark
- [ ] Generic credit card CSV

### 4.4 Multi-Client Mode (for Accountants)

- [ ] Workspace/client separation
- [ ] Client switching UI
- [ ] Per-client entity configuration
- [ ] Batch export across clients

---

## Phase 5: Nonprofit & Specialized Markets ⚪

**Goal**: Expand to nonprofit organizations and specialized use cases.

### 5.1 Nonprofit Features

- [ ] Form 990 category mapping
- [ ] Functional expense allocation
- [ ] Grant/fund tracking
- [ ] Board expense policies

### 5.2 Industry-Specific Templates

- [ ] Vacation rental management
- [ ] Consulting/professional services
- [ ] E-commerce/retail
- [ ] Construction/trades

---

## Implementation Notes

### Technology Choices

| Feature            | Planned Technology                     |
| ------------------ | -------------------------------------- |
| LLM Integration    | OpenRouter.ai (free tier)              |
| OCR                | Tesseract.js (client-side) or free API |
| PDF Generation     | jsPDF (client-side)                    |
| Additional Parsing | Custom parsers per platform            |

### Constraints

- Maintain ≤100 lines per file
- Test-first development
- Local-first architecture (cloud sync optional)
- Free/low-cost infrastructure only

---

## Version Targets

| Version | Milestone                                  |
| ------- | ------------------------------------------ |
| v3.3.0  | Phase 0 complete (Legal/Security)          |
| v4.0.0  | Phase 1 complete (Allocation Intelligence) |
| v4.5.0  | Phase 2 complete (Professional Export)     |
| v5.0.0  | Phase 3 complete (AI Features)             |
| v6.0.0  | Phase 4 complete (Platform Expansion)      |

---

_Last Updated: February 2026_
