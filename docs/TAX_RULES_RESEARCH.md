# US Tax Rules for Expense Allocation

> **Research Purpose**: Understand IRS rules for allocating Amazon orders between Business Expenses and Employee/Owner/Member Benefits (Fringe Benefits) across different entity types.
> 
> **Date**: February 2026  
> **Primary Sources**: IRS Publications 15-B (2026), 463 (2024), S Corporation Compensation Guide

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Entity Type Comparison](#entity-type-comparison)
3. [Fringe Benefits Deep Dive](#fringe-benefits-deep-dive)
4. [Amazon Order Allocation Scenarios](#amazon-order-allocation-scenarios)
5. [Accountable vs Non-Accountable Plans](#accountable-vs-non-accountable-plans)
6. [Key IRS Publications](#key-irs-publications)
7. [App Design Implications](#app-design-implications)

---

## Executive Summary

### The Core Problem Our App Solves

When a business purchases items on Amazon, each purchase must be properly categorized:

| Category | Tax Treatment | Examples |
|----------|--------------|----------|
| **Business Expense** | Deductible by company | Office supplies, equipment, software |
| **Fringe Benefit** | May be taxable to recipient | Personal items, gifts, snacks |

**Critical Insight**: The tax treatment varies dramatically based on:
1. **Entity type** (C Corp, S Corp, LLC, Sole Proprietor)
2. **Recipient's role** (Employee, 2%+ S Corp shareholder, Partner, Owner)
3. **Nature of expense** (Working condition vs. personal benefit)

---

## Entity Type Comparison

### Tax Treatment Summary by Entity

| Entity | Owner Status | Fringe Benefits Tax Treatment |
|--------|-------------|------------------------------|
| **C Corporation** | Owner-employees are treated as regular employees | Most fringe benefits **excludable** from income |
| **S Corporation** | 2%+ shareholders treated as **self-employed** | Most fringe benefits **taxable** as wages |
| **Partnership** | Partners are self-employed | Fringe benefits generally **taxable** |
| **LLC (default)** | Depends on tax election | Follows partnership or disregarded entity rules |
| **LLC (S Corp election)** | Same as S Corp | Same as S Corp |
| **Sole Proprietor** | Self-employed | Cannot provide tax-free fringe benefits to self |

### C Corporation Advantage

**Key Finding**: C Corp owner-employees can receive tax-free fringe benefits that other entity types cannot.

```
C Corp Owner → Employee status → Tax-free benefits possible
S Corp 2%+ Owner → Self-employed status → Benefits taxable as wages
```

### S Corporation Special Rules (IRC §1372)

**Critical Rule**: A 2% or more S Corp shareholder is treated as a **partner** (not employee) for fringe benefit purposes.

> "A 2-percent shareholder-employee is not eligible to participate in a QSEHRA."  
> — IRS S Corporation Compensation Guide

**Cannot exclude from income**:
- Health insurance premiums (must be included in W-2 wages)
- Health Reimbursement Arrangements (HRAs)
- Flexible Spending Arrangements (FSAs)
- Qualified Small Employer HRAs (QSEHRAs)

**2% Shareholder Definition**:
- Owns >2% of outstanding stock, OR
- Owns >2% of total combined voting power

### LLC Tax Classification

LLCs don't have a single default tax classification—they elect one:

| LLC Type | Federal Tax Treatment |
|----------|----------------------|
| Single-member (default) | Disregarded entity (Schedule C) |
| Multi-member (default) | Partnership (Form 1065) |
| S Corp election | S Corporation rules apply |
| C Corp election | C Corporation rules apply |

**Key Form**: Form 8832, Entity Classification Election

---

## Fringe Benefits Deep Dive

### What Are Fringe Benefits?

> "A fringe benefit is a form of pay for the performance of services."  
> — IRS Publication 15-B (2026)

**General Rule**: Fringe benefits are **taxable** unless specifically excluded by law.

### Excludable Fringe Benefits (When Rules Met)

| Benefit Type | 2026 Limits | Key Requirements |
|--------------|-------------|------------------|
| De minimis benefits | Small value only | Infrequent, administratively impractical to account |
| Working condition benefits | No limit | Would be deductible if employee paid |
| Achievement awards | $400-$1,600 | Length of service, safety achievement |
| Qualified transportation | $340/month | Commuting, parking |
| Dependent care | $7,500 | Childcare assistance |
| Health FSA | $3,400 | Salary reduction arrangement |
| HSA contributions | $4,400/$8,750 | High-deductible health plan required |
| Educational assistance | $5,250 | Job-related education |
| Employee discounts | Cost basis | On employer's products/services |
| On-premises athletic facilities | No limit | Substantially all use by employees |

### De Minimis Benefits (Key for Amazon Orders)

**Definition**: Property/service with value so small that accounting is unreasonable.

**Examples of De Minimis** ✅:
- Occasional snacks, coffee, soft drinks
- Occasional meal money for overtime
- Holiday gifts of low value (NOT cash)
- Flowers for illness/special occasions
- Occasional personal use of copier

**NOT De Minimis** ❌:
- Cash or cash equivalents (gift cards)
- Season tickets to events
- Commuting use of employer vehicle (>1 day/month)
- Membership in private country club

### Working Condition Fringe Benefits

**Definition**: Property/services that would be deductible as business expense if employee paid for them.

**Key Test**: "If the employee paid for this, could they deduct it?"

**Examples** ✅:
- Business use of company car
- Professional subscriptions
- Job-related education
- Outplacement services
- Business travel expenses

---

## Amazon Order Allocation Scenarios

### Scenario Matrix

| Item Purchased | Business Expense? | Fringe Benefit? | Notes |
|----------------|-------------------|-----------------|-------|
| **Office Supplies** (pens, paper) | ✅ 100% | ❌ | Ordinary business expense |
| **Computer Equipment** | ✅ Business use % | Taxable if personal use | Must track business vs personal |
| **Coffee/Snacks for Office** | ✅ De minimis | ❌ If occasional | Becomes taxable if regular/excessive |
| **Employee Birthday Gift** | ❌ | ✅ Taxable | Cash/gift cards always taxable |
| **Holiday Turkey/Ham** | ✅ De minimis | ❌ | Traditional, low-value |
| **Software Subscription** | ✅ Business % | Taxable personal % | Allocate by use |
| **Home Office Equipment** | ✅ If accountable plan | Possibly | Must meet reimbursement rules |
| **Personal Items for Owner** | ❌ | ✅ Taxable compensation | Cannot be business expense |
| **Client Gifts** | ✅ Up to $25/person | N/A | Gift limit per recipient |
| **Safety Equipment** | ✅ 100% | ❌ | Required for job |

### The Allocation Challenge

**Why This Matters**: A single Amazon order often contains:
- Business supplies (100% deductible)
- Mixed-use items (must allocate %)
- Personal items (taxable benefit)
- Items for multiple employees (track per person)

**Example Order**:
```
Amazon Order #123-456
├── Printer Paper (100% business)          $30.00
├── USB Drive for employee                 $15.00 ← Working condition if job use
├── Snacks for office                      $25.00 ← De minimis if occasional
├── Birthday card & gift for employee      $50.00 ← Taxable fringe benefit
└── Owner's personal book                  $20.00 ← Taxable compensation
                                          ________
Total: $140.00

Allocation:
├── Business Expense:  $30.00 (21%)
├── Working Condition: $15.00 (11%) ← Excludable if documented
├── De Minimis:        $25.00 (18%) ← Excludable if policy met
└── Taxable Benefits:  $70.00 (50%) ← Must be reported as wages
```

---

## Accountable vs Non-Accountable Plans

### Accountable Plan Requirements (IRS Pub 463)

For expense reimbursements to be **tax-free**, they must meet ALL three rules:

| Rule | Requirement | Timeline |
|------|-------------|----------|
| 1 | **Business Connection** | Expenses must be business-related |
| 2 | **Adequate Accounting** | Substantiate within **60 days** |
| 3 | **Return Excess** | Return excess reimbursement within **120 days** |

### Substantiation Requirements

| Expense Type | Must Prove |
|--------------|-----------|
| Travel | Amount, Date, Place, Business Purpose |
| Meals | Amount, Date, Place, Business Purpose, Attendees |
| Gifts | Amount, Date, Description, Business Purpose, Recipient |
| Transportation | Amount, Date, Destination, Business Purpose |

### Non-Accountable Plan Consequences

If ANY requirement not met:
- Entire reimbursement = **taxable wages**
- Included in employee's W-2 Box 1
- Subject to income tax withholding
- Subject to FICA taxes

---

## Key IRS Publications

### Primary References

| Publication | Title | Key Topics |
|-------------|-------|------------|
| **Pub 15-B (2026)** | Employer's Tax Guide to Fringe Benefits | Fringe benefit rules, exclusions, valuations |
| **Pub 463 (2024)** | Travel, Gift, and Car Expenses | Substantiation, accountable plans |
| **Pub 535 (2022)** | Business Expenses (discontinued) | Deducting business expenses |
| **Pub 334** | Tax Guide for Small Business | Schedule C guidance |
| **Pub 542** | Corporations | C Corp rules |

### Critical IRC Sections

| Section | Topic |
|---------|-------|
| **IRC §1372** | S Corp shareholders treated as partners for fringe benefits |
| **IRC §132** | Fringe benefit exclusions |
| **IRC §162** | Trade or business expenses |
| **IRC §274** | Entertainment, gifts, travel expenses |
| **IRC §105/106** | Health plan exclusions |

---

## App Design Implications

### Target Users (Expanded from Research)

| User Type | Primary Pain Point | How App Helps |
|-----------|-------------------|---------------|
| **S Corp 2%+ Shareholders** | Benefits become taxable wages | Track which benefits hit W-2 |
| **LLC Members** | Rules depend on tax election | Allocation by entity type |
| **Nonprofit Board Members** | Board member benefits vs supplies | Clear separation for 990 |
| **Small Business Owners** | Mixed personal/business purchases | Allocation slider |
| **Accountants/Bookkeepers** | Client expense categorization | Batch processing |

### Feature Recommendations

1. **Entity Type Selector**
   - "What type of business is this for?"
   - Adjusts allocation rules automatically

2. **Recipient Role Tracking**
   - Employee vs. 2%+ Owner vs. Partner
   - Different tax treatment per role

3. **Benefit Category Presets**
   - De minimis (occasional small items)
   - Working condition (business use)
   - Taxable compensation (personal benefit)

4. **Accountable Plan Compliance**
   - Substantiation date tracking
   - 60-day accounting reminder
   - 120-day excess return tracking

5. **Per-Person Gift Tracking**
   - $25 limit per recipient per year
   - Aggregate across orders

### Refined Value Proposition

**Generic (Before)**:
> "Personal finance tracker with bank statement import"

**Specific (After)**:
> "Expense allocation tool for business owners who need to separate **deductible business expenses** from **taxable fringe benefits**—especially valuable for S Corp shareholders whose benefits don't get the same tax treatment as regular employees."

---

## Research Status

| Area | Status | Source |
|------|--------|--------|
| C Corp fringe benefits | ✅ Complete | Pub 15-B (2026) |
| S Corp 2% shareholder rules | ✅ Complete | IRS.gov S Corp guide |
| LLC tax elections | ✅ Complete | IRS.gov LLC page |
| Accountable plan rules | ✅ Complete | Pub 463 (2024) |
| De minimis benefits | ✅ Complete | Pub 15-B (2026) |
| Working condition benefits | ✅ Complete | Pub 15-B (2026) |
| Amazon allocation scenarios | ✅ Complete | Synthesis of rules |

---

## Key Takeaways for App Development

### 1. Entity Type Matters Most

The single most important factor in expense allocation is the business entity type. An S Corp owner buying office snacks has different tax treatment than a C Corp owner buying the same snacks.

### 2. The "2% Rule" is Critical

For S Corporations, 2%+ shareholders lose many fringe benefit exclusions that regular employees receive. This is a major pain point for small S Corps where owners are also employees.

### 3. Documentation is Everything

Accountable plan rules require:
- **60-day substantiation**
- **120-day excess return**
- Business purpose documentation

### 4. Cash and Gift Cards Are Never De Minimis

No matter how small, cash and cash equivalents (gift cards, prepaid cards) are always taxable. This is a common mistake businesses make.

### 5. Mixed Orders Require Allocation

Amazon orders often mix business and personal items. Each line item may need different treatment. This is exactly what our app should solve.

---

*Research compiled from IRS.gov sources, February 2026*
