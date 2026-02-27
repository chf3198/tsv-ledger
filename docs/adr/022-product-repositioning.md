# ADR 022: Product Repositioning and Legal Framework

**Status**: Accepted
**Date**: 2025-02-11
**Version**: 3.3.0

## Context

TSV Ledger was initially positioned as a "personal finance tracker" for
nonprofit board members. Analysis revealed:

1. **Unique value**: Percentage-based allocation via slider is not
   offered by any competitor (QuickBooks, Xero, Expensify, Bench, etc.)

2. **Market opportunity**: Accountants doing expense allocation for
   businesses (especially C Corps with on-site benefits) need this tool

3. **Liability risk**: Users making tax decisions based on tool output
   creates legal exposure for developers

## Decision

### 1. Repositioning

Change from "Personal finance tracker" to:
**"Amazon Expense Allocation for Tax Prep"**

Target user: **Accountants** (including business owners acting as own
accountant) working with **C Corporations** primarily.

### 2. Legal Framework

Add comprehensive legal protections:

- Terms of Service with liability disclaimers
- Privacy Policy documenting local-first architecture
- UI footer with "Not Tax Advice" notice
- Export includes disclaimer text

### 3. Feature Roadmap

Create formal roadmap document (ROADMAP.md) with phases:

- Phase 0: Security & Legal Foundation
- Phase 1: Core Allocation Intelligence
- Phase 2: Professional Export & Integration
- Phase 3: AI-Assisted Categorization
- Phase 4: Platform Expansion

## Consequences

### Positive

- Clear product positioning for marketing
- Legal protection via explicit disclaimers
- Documented path from research to product features
- Accountant-focused features differentiate from consumer tools

### Negative

- Narrower initial target market
- Legal language may feel heavy for casual users
- More complex UI with additional benefit sub-categories

### Risks Mitigated

- Liability from tax advice interpretation
- Feature creep without structured roadmap
- Unclear value proposition

## References

- [ROADMAP.md](../ROADMAP.md) - Feature phases
- [TERMS_OF_SERVICE.md](../TERMS_OF_SERVICE.md) - Legal disclaimers
- [PRIVACY_POLICY.md](../PRIVACY_POLICY.md) - Data handling
- [TAX_RULES_RESEARCH.md](../TAX_RULES_RESEARCH.md) - Research basis
