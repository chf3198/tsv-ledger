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
8. [Board Member / Director Benefits](#board-member--director-benefits-c-corp-specific)
9. [C Corp On-Site Benefits: Deep Dive](#c-corp-on-site-benefits-deep-dive)
10. [Key Takeaways for App Development](#key-takeaways-for-app-development)

---

## Executive Summary

### The Core Problem Our App Solves

When a business purchases items on Amazon, each purchase must be properly categorized:

| Category             | Tax Treatment               | Examples                             |
| -------------------- | --------------------------- | ------------------------------------ |
| **Business Expense** | Deductible by company       | Office supplies, equipment, software |
| **Fringe Benefit**   | May be taxable to recipient | Personal items, gifts, snacks        |

**Critical Insight**: The tax treatment varies dramatically based on:

1. **Entity type** (C Corp, S Corp, LLC, Sole Proprietor)
2. **Recipient's role** (Employee, 2%+ S Corp shareholder, Partner, Owner)
3. **Nature of expense** (Working condition vs. personal benefit)

---

## Entity Type Comparison

### Tax Treatment Summary by Entity

| Entity                    | Owner Status                                     | Fringe Benefits Tax Treatment                   |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| **C Corporation**         | Owner-employees are treated as regular employees | Most fringe benefits **excludable** from income |
| **S Corporation**         | 2%+ shareholders treated as **self-employed**    | Most fringe benefits **taxable** as wages       |
| **Partnership**           | Partners are self-employed                       | Fringe benefits generally **taxable**           |
| **LLC (default)**         | Depends on tax election                          | Follows partnership or disregarded entity rules |
| **LLC (S Corp election)** | Same as S Corp                                   | Same as S Corp                                  |
| **Sole Proprietor**       | Self-employed                                    | Cannot provide tax-free fringe benefits to self |

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

| LLC Type                | Federal Tax Treatment           |
| ----------------------- | ------------------------------- |
| Single-member (default) | Disregarded entity (Schedule C) |
| Multi-member (default)  | Partnership (Form 1065)         |
| S Corp election         | S Corporation rules apply       |
| C Corp election         | C Corporation rules apply       |

**Key Form**: Form 8832, Entity Classification Election

---

## Fringe Benefits Deep Dive

### What Are Fringe Benefits?

> "A fringe benefit is a form of pay for the performance of services."
> — IRS Publication 15-B (2026)

**General Rule**: Fringe benefits are **taxable** unless specifically excluded by law.

### Excludable Fringe Benefits (When Rules Met)

| Benefit Type                    | 2026 Limits      | Key Requirements                                    |
| ------------------------------- | ---------------- | --------------------------------------------------- |
| De minimis benefits             | Small value only | Infrequent, administratively impractical to account |
| Working condition benefits      | No limit         | Would be deductible if employee paid                |
| Achievement awards              | $400-$1,600      | Length of service, safety achievement               |
| Qualified transportation        | $340/month       | Commuting, parking                                  |
| Dependent care                  | $7,500           | Childcare assistance                                |
| Health FSA                      | $3,400           | Salary reduction arrangement                        |
| HSA contributions               | $4,400/$8,750    | High-deductible health plan required                |
| Educational assistance          | $5,250           | Job-related education                               |
| Employee discounts              | Cost basis       | On employer's products/services                     |
| On-premises athletic facilities | No limit         | Substantially all use by employees                  |

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

| Item Purchased                    | Business Expense?      | Fringe Benefit?         | Notes                                |
| --------------------------------- | ---------------------- | ----------------------- | ------------------------------------ |
| **Office Supplies** (pens, paper) | ✅ 100%                | ❌                      | Ordinary business expense            |
| **Computer Equipment**            | ✅ Business use %      | Taxable if personal use | Must track business vs personal      |
| **Coffee/Snacks for Office**      | ✅ De minimis          | ❌ If occasional        | Becomes taxable if regular/excessive |
| **Employee Birthday Gift**        | ❌                     | ✅ Taxable              | Cash/gift cards always taxable       |
| **Holiday Turkey/Ham**            | ✅ De minimis          | ❌                      | Traditional, low-value               |
| **Software Subscription**         | ✅ Business %          | Taxable personal %      | Allocate by use                      |
| **Home Office Equipment**         | ✅ If accountable plan | Possibly                | Must meet reimbursement rules        |
| **Personal Items for Owner**      | ❌                     | ✅ Taxable compensation | Cannot be business expense           |
| **Client Gifts**                  | ✅ Up to $25/person    | N/A                     | Gift limit per recipient             |
| **Safety Equipment**              | ✅ 100%                | ❌                      | Required for job                     |

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

| Rule | Requirement             | Timeline                                        |
| ---- | ----------------------- | ----------------------------------------------- |
| 1    | **Business Connection** | Expenses must be business-related               |
| 2    | **Adequate Accounting** | Substantiate within **60 days**                 |
| 3    | **Return Excess**       | Return excess reimbursement within **120 days** |

### Substantiation Requirements

| Expense Type   | Must Prove                                             |
| -------------- | ------------------------------------------------------ |
| Travel         | Amount, Date, Place, Business Purpose                  |
| Meals          | Amount, Date, Place, Business Purpose, Attendees       |
| Gifts          | Amount, Date, Description, Business Purpose, Recipient |
| Transportation | Amount, Date, Destination, Business Purpose            |

### Non-Accountable Plan Consequences

If ANY requirement not met:

- Entire reimbursement = **taxable wages**
- Included in employee's W-2 Box 1
- Subject to income tax withholding
- Subject to FICA taxes

---

## Key IRS Publications

### Primary References

| Publication         | Title                                   | Key Topics                                   |
| ------------------- | --------------------------------------- | -------------------------------------------- |
| **Pub 15-B (2026)** | Employer's Tax Guide to Fringe Benefits | Fringe benefit rules, exclusions, valuations |
| **Pub 463 (2024)**  | Travel, Gift, and Car Expenses          | Substantiation, accountable plans            |
| **Pub 535 (2022)**  | Business Expenses (discontinued)        | Deducting business expenses                  |
| **Pub 334**         | Tax Guide for Small Business            | Schedule C guidance                          |
| **Pub 542**         | Corporations                            | C Corp rules                                 |

### Critical IRC Sections

| Section          | Topic                                                       |
| ---------------- | ----------------------------------------------------------- |
| **IRC §1372**    | S Corp shareholders treated as partners for fringe benefits |
| **IRC §132**     | Fringe benefit exclusions                                   |
| **IRC §162**     | Trade or business expenses                                  |
| **IRC §274**     | Entertainment, gifts, travel expenses                       |
| **IRC §105/106** | Health plan exclusions                                      |

---

## App Design Implications

### Target Users (Expanded from Research)

| User Type                   | Primary Pain Point                | How App Helps                |
| --------------------------- | --------------------------------- | ---------------------------- |
| **S Corp 2%+ Shareholders** | Benefits become taxable wages     | Track which benefits hit W-2 |
| **LLC Members**             | Rules depend on tax election      | Allocation by entity type    |
| **Nonprofit Board Members** | Board member benefits vs supplies | Clear separation for 990     |
| **Small Business Owners**   | Mixed personal/business purchases | Allocation slider            |
| **Accountants/Bookkeepers** | Client expense categorization     | Batch processing             |

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

## Board Member / Director Benefits (C Corp Specific)

### Critical Finding: Directors CAN Receive Fringe Benefits

> **"You don't have to be an employee of the provider to be a recipient of a fringe benefit. If you're a partner, a director, or an independent contractor, you can also be the recipient of a fringe benefit."**
> — IRS Publication 525 (2026)

This is **critically important**: Board members/directors are explicitly eligible for fringe benefits, even if they are NOT employees.

### Director vs Employee vs Shareholder

A person can hold multiple roles simultaneously:

| Role                    | Tax Form for Compensation                           | Fringe Benefits Eligible? | Notes                               |
| ----------------------- | --------------------------------------------------- | ------------------------- | ----------------------------------- |
| **Director only**       | 1099-NEC (if ≥$600)                                 | ✅ Yes                    | Self-employment income              |
| **Employee only**       | W-2                                                 | ✅ Yes                    | Standard employee benefits          |
| **Director + Employee** | W-2 for salary, possibly 1099-NEC for director fees | ✅ Yes                    | Most common for small C Corp owners |
| **Shareholder only**    | Dividends on 1099-DIV                               | ❌ Not as shareholder     | Distributions ≠ compensation        |

### How Director Fees Are Reported

| Scenario                              | How Reported                  | Tax Type               |
| ------------------------------------- | ----------------------------- | ---------------------- |
| Director is NOT an employee           | Form 1099-NEC Box 1           | Self-employment income |
| Director IS an employee               | W-2 (may combine with salary) | Wages                  |
| Director fees paid to another company | 1099-NEC to the company       | Business income        |

### C Corp Owner-Directors: The Best of Both Worlds

For **C Corporation** owners who are BOTH directors AND employees:

```
Owner Status in C Corp:
├── Shareholder (owns stock)
├── Director (board member)
└── Employee (works for company)

All three roles CAN receive fringe benefits when acting as director or employee!
```

**Key Advantage**: Unlike S Corps (where 2%+ shareholders lose most benefit exclusions), C Corp owner-employees retain full eligibility for tax-free fringe benefits.

### Vacation Rental Management: Special Considerations

For a C Corp providing **Short Term Vacation Rental Management** services:

#### Site Visits = Business Travel

When owner-directors visit rental properties:

| Expense Type          | Treatment                      | Documentation Needed              |
| --------------------- | ------------------------------ | --------------------------------- |
| Travel to property    | Business expense (IRC §162)    | Business purpose, dates, location |
| Lodging at property   | Complex—see below              | Careful allocation required       |
| Meals during travel   | 50% deductible (business days) | Business purpose, attendees       |
| Supplies used on-site | Depends on use—see allocation  | Track business vs personal use    |

#### Lodging at Your Own Rental Property

**Tricky Issue**: When owner stays at a property the company manages:

| Scenario                           | Tax Treatment                                          |
| ---------------------------------- | ------------------------------------------------------ |
| Property inspection/work only      | Business expense (working condition fringe)            |
| Extended stay beyond business need | Personal use portion = taxable compensation            |
| Family members accompany           | Family portion generally = personal/taxable            |
| Stay during peak rental season     | Stronger argument for taxable (foregone rental income) |

**Best Practice**: Document the business purpose for each day of the visit.

#### Supplies Used While Visiting Properties

**The Core Question**: When you use business supplies (toilet paper, cleaning supplies, coffee, etc.) at rental properties for your personal needs during site visits:

| Analysis Factor             | Business Expense                 | Taxable Benefit                   |
| --------------------------- | -------------------------------- | --------------------------------- |
| Primary purpose of supplies | Stocked for guests/operations    | Bought specifically for owner use |
| Amount of personal use      | Incidental to business visit     | Substantial personal benefit      |
| Would expense exist anyway? | Yes—part of operations           | No—extra expense for owner        |
| Documentation               | Part of property operating costs | Tracked as owner benefit          |

**Practical Approach**:

1. **De Minimis**: Incidental personal use (coffee, toilet paper, basic supplies already stocked) = likely de minimis, not taxable
2. **Substantial**: Extended stays, family use, special purchases for owner = allocate as taxable benefit
3. **Working Condition**: Supplies needed to perform inspection/management duties = business expense

### Reporting Board Member Benefits

#### If Treated as Employee (Most Common for Small C Corps)

- Include fringe benefit value in W-2 Box 1 (unless excludable)
- Taxable benefits subject to FICA
- Excludable benefits documented but not included

#### If Director Only (Not Employee)

- Director fees reported on 1099-NEC
- Taxable fringe benefits may be reported on 1099-NEC or separately
- Self-employment tax applies to director fees

### Questions to Consider for App Design

Based on this research, the app should help users answer:

1. **What role am I acting in?**
   - Employee conducting business
   - Director performing oversight
   - Shareholder (not a service role)

2. **What is the primary purpose of this expense?**
   - Guest/customer service
   - Property maintenance/operations
   - Personal convenience during business travel
   - Purely personal benefit

3. **How much personal benefit was received?**
   - Incidental (de minimis)
   - Substantial (requires allocation)
   - 100% personal (fully taxable)

4. **Is there documentation of business purpose?**
   - Inspection reports
   - Board meeting minutes
   - Property management records

---

## C Corp On-Site Benefits: Deep Dive

### Overview: What C Corps Can Provide On-Site

For a C Corporation providing services like **Short Term Vacation Rental Management**, owner-directors who must be on-site at properties can potentially receive substantial tax-advantaged benefits. This section covers the IRS rules for:

1. **On-Site Lodging** (IRC §119)
2. **On-Site Meals** (IRC §119, §132)
3. **On-Site Consumables** (De minimis fringe benefits)
4. **On-Site Transportation** (Working condition fringe benefits)

### 1. On-Site Lodging — IRC §119

#### The Three Requirements for Tax-Free Lodging

Under IRC §119, the value of **lodging** furnished to an employee (or director) can be **excluded from income** if ALL THREE conditions are met:

| Requirement                    | Test                                                                           | Key Question                                            |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **1. Business Premises**       | Lodging must be furnished on the employer's business premises                  | Is this location where the employer conducts business?  |
| **2. Employer's Convenience**  | Lodging must be furnished for the employer's convenience (not as compensation) | Is there a substantial business reason for the lodging? |
| **3. Condition of Employment** | Employee must accept the lodging as a condition of employment                  | Must the employee accept to properly perform duties?    |

> **"The value of lodging provided by the employer to an employee can be excluded from income if it's furnished on the employer's business premises, for the employer's convenience, and as a condition of employment."**
> — IRS Publication 15-B (2026)

#### What Counts as "Business Premises"?

The IRS defines **business premises** broadly for IRC §119:

| Location                        | Business Premises? | Example                                    |
| ------------------------------- | ------------------ | ------------------------------------------ |
| Company headquarters            | ✅ Yes             | Main office building                       |
| Remote work site                | ✅ Yes             | Construction camp, managed rental property |
| Manager's residence ON property | ✅ Yes             | Live-in property manager quarters          |
| Employee's personal home        | ❌ No              | Home office alone doesn't qualify          |
| Off-site hotel during travel    | ❌ No              | Travel expense rules apply instead         |

**For Vacation Rental Management**: Properties you manage ARE your business premises when you're there performing management duties.

#### What Satisfies "Convenience of the Employer"?

The lodging must serve the employer's business needs, not be a substitute for compensation:

| Scenario                            | Employer Convenience? | Why                                |
| ----------------------------------- | --------------------- | ---------------------------------- |
| On-call 24/7 for emergencies        | ✅ Yes                | Must be available immediately      |
| Security/supervision duties         | ✅ Yes                | Presence required for business     |
| No reasonable alternative available | ✅ Yes                | Remote location, no nearby lodging |
| Extended property inspection        | ⚠️ Depends            | Document business necessity        |
| Vacation disguised as work          | ❌ No                 | Primary purpose is personal        |

**IRS Example**: "Alaska construction project site... lodging furnished to employees who work at these sites qualifies for exclusion."
— IRS Pub 15-B (2026)

#### What Makes Lodging a "Condition of Employment"?

The employee must be **required** to accept the lodging to perform their duties properly:

| Factor                       | Supports Condition of Employment                | Weakens Claim               |
| ---------------------------- | ----------------------------------------------- | --------------------------- |
| Written employment agreement | ✅ "Must stay on-site during property visits"   | No documentation            |
| Nature of duties             | ✅ Property inspection, emergency response      | Work can be done remotely   |
| Business necessity           | ✅ Multiple properties, after-hours emergencies | Single easy property nearby |
| Alternative available        | ✅ No nearby hotels, unsafe area at night       | Luxury hotels next door     |

#### C Corp vs S Corp for On-Site Lodging

| Entity                  | Owner Can Exclude Lodging?           | Notes                                                     |
| ----------------------- | ------------------------------------ | --------------------------------------------------------- |
| **C Corporation**       | ✅ Yes, if IRC §119 requirements met | Owner-employee/director treated as regular employee       |
| **S Corporation (2%+)** | ❌ No                                | 2%+ shareholders treated as self-employed; cannot exclude |
| **Partnership/LLC**     | ❌ No                                | Partners cannot exclude                                   |
| **Sole Proprietor**     | ❌ No                                | Cannot provide benefit to self                            |

> **"Treat a 2% shareholder as you would a partner in a partnership for fringe benefit purposes, but don't treat the benefit as a reduction in distributions to the 2% shareholder."**
> — IRS Publication 15-B (2026)

### 2. On-Site Meals — IRC §119 and §132

#### Tax-Free Meals Under IRC §119

Meals furnished to an employee can be **excluded from income** if:

1. **Furnished on business premises**, AND
2. **Furnished for the convenience of the employer**

**Convenience of Employer for Meals** includes:

| Scenario                                  | Excludable? | Why                                |
| ----------------------------------------- | ----------- | ---------------------------------- |
| Short meal period (must eat on-site)      | ✅ Yes      | Business operations require it     |
| Emergency on-call staff                   | ✅ Yes      | Must be immediately available      |
| Proper meal facilities unavailable nearby | ✅ Yes      | No practical alternative           |
| Restrict employees during meal periods    | ✅ Yes      | Security, customer service reasons |
| Voluntary lunch in company cafeteria      | ⚠️ May be   | 50%+ rule applies (see below)      |

#### The 50%+ Rule for Meals

> **"If more than half of the employees to whom meals are furnished on business premises receive meals for the employer's convenience, all meals provided to employees on the business premises are treated as furnished for the employer's convenience."**
> — IRC §119(b)(4)

**Practical Application**: If most employees must eat on-site for business reasons, ALL employee meals on-site become excludable.

#### De Minimis Meals (Separate from IRC §119)

Even if IRC §119 doesn't apply, certain meals qualify as **de minimis**:

| Meal Type                         | De Minimis?                        | Limit                       |
| --------------------------------- | ---------------------------------- | --------------------------- |
| Coffee, donuts, soft drinks       | ✅ Yes                             | Occasional, low value       |
| Occasional meal for overtime work | ✅ Yes                             | Not regular pattern         |
| Company picnics, holiday parties  | ✅ Yes                             | Infrequent events           |
| Occasional meal enabling overtime | ✅ Yes                             | Business necessity          |
| Regular daily lunch allowance     | ❌ No                              | Too regular, too much value |
| Subsidized company cafeteria      | ❌ No (but may qualify under §119) |                             |

#### Employer Deduction for Meals (Important 2026 Change)

> **"For amounts incurred after December 31, 2025, the 50% deduction for business-related meals will no longer apply."**
> — IRS Notice (Tax Cuts and Jobs Act effect)

**After 2025**: Employer meal deductions (employer's side) are eliminated except:

- De minimis meals
- Food and beverages for employees that are excludable under IRC §119
- Recreational expenses for employees (holiday parties, etc.)

**Note**: This affects the employer's deduction, NOT whether the meal is taxable to the employee.

### 3. On-Site Consumables — Bathroom & Kitchen Supplies

#### The De Minimis Analysis for On-Site Supplies

When board members/employees use supplies at business locations:

| Item Type                            | Analysis                              | Tax Treatment                              |
| ------------------------------------ | ------------------------------------- | ------------------------------------------ |
| **Toilet paper, soap, paper towels** | Already stocked for operations/guests | ✅ De minimis—incidental use during work   |
| **Coffee, tea, water**               | Commonly provided for workers         | ✅ De minimis—if occasional/low value      |
| **Cleaning supplies**                | Business operational expense          | ✅ Business expense when used for business |
| **Full pantry stocked for owner**    | Special personal benefit              | ⚠️ Allocate taxable portion                |
| **Groceries beyond basics**          | Personal consumption                  | ❌ Taxable benefit                         |

#### Working Condition Benefit Analysis

Some supplies qualify as **working condition benefits** (not just de minimis):

> **"A working condition benefit is any property or service provided to you by your employer, the cost of which would be allowable as an employee business expense deduction if you had paid for it."**
> — IRS Publication 15-B (2026)

| Supply                                    | Would Employee Deduct If Paid? | Working Condition?   |
| ----------------------------------------- | ------------------------------ | -------------------- |
| Cleaning supplies for property inspection | ✅ Yes—job duty                | ✅ Working condition |
| Safety equipment, gloves                  | ✅ Yes—required for work       | ✅ Working condition |
| Basic amenities during business stay      | ✅ Yes—travel expense          | ✅ Working condition |
| Premium personal care items               | ❌ No—personal preference      | ❌ Taxable benefit   |

#### Practical Guidance for Vacation Rental Management

**Scenario**: Board members visit managed rental properties and use bathroom/kitchen supplies already stocked at the property.

| Analysis Factor                     | Result                                               |
| ----------------------------------- | ---------------------------------------------------- |
| **Why are supplies there?**         | Stocked for rental guests and property operations    |
| **Would they be purchased anyway?** | Yes—required for rental business                     |
| **Personal use amount**             | Incidental to business visit                         |
| **Tracking practicality**           | Administratively impractical to track one roll of TP |

**Conclusion**: Incidental use of supplies already stocked for business operations = **de minimis**, not separately taxable.

**But**: If supplies are specifically purchased FOR the owner's personal use (special groceries, personal items not available to guests), allocate as taxable benefit.

### 4. On-Site Transportation — Vehicles & Local Travel

#### Working Condition Benefit for Vehicles

When the company provides vehicle use:

> **"The use of an employer-provided vehicle is a working condition benefit to the extent the employee would be able to deduct the costs of operating the vehicle as a business expense."**
> — IRS Publication 15-B (2026)

| Vehicle Use                            | Tax Treatment                                                   |
| -------------------------------------- | --------------------------------------------------------------- |
| **100% Business use**                  | ✅ Fully excludable working condition benefit                   |
| **Business + Commuting**               | Commuting portion is taxable                                    |
| **Business + Personal**                | Personal use portion is taxable                                 |
| **Qualified non-personal use vehicle** | ✅ Fully excludable (by design, unlikely to be used personally) |

#### Qualified Transportation Fringe Benefits (§132)

For 2026:

| Benefit                     | Monthly Limit | Notes                                 |
| --------------------------- | ------------- | ------------------------------------- |
| Transit passes              | $340          | Commuter highway vehicle, transit     |
| Qualified parking           | $340          | At or near workplace, park-and-ride   |
| Qualified bicycle commuting | ❌ Eliminated | Permanently eliminated by P.L. 119-21 |

> **Important**: 2%+ S Corp shareholders **cannot** exclude qualified transportation benefits.

#### De Minimis Transportation

| Transportation                     | De Minimis? | Notes                                   |
| ---------------------------------- | ----------- | --------------------------------------- |
| Occasional local fare (taxi, Uber) | ✅ Yes      | Under $21 per occasion                  |
| Unsafe conditions ride home        | ✅ Yes      | Overtime, unusual circumstances         |
| Regular commuting expense          | ❌ No       | Taxable unless qualified transportation |

#### Vehicle Use at Rental Properties

**Scenario**: Company provides vehicle for traveling between managed properties.

| Use                                           | Tax Treatment                            |
| --------------------------------------------- | ---------------------------------------- |
| Driving between properties during work        | ✅ Working condition—100% excludable     |
| Driving from home to first property           | ⚠️ Commuting—taxable (unless exceptions) |
| Using vehicle for personal errands            | ❌ Taxable fringe benefit                |
| De minimis personal use (stopping for coffee) | ✅ Incidental—excludable                 |

**2024 Mileage Rates** (if tracking actual vs. reimbursement):

- Business use: $0.67/mile standard mileage rate
- First-year depreciation limit: $20,400 (vehicles acquired after 9/27/2017)

### Summary: C Corp On-Site Benefits Matrix

| Benefit Category                         | C Corp Owner-Director     | Requirements                                                       | Key IRC Section |
| ---------------------------------------- | ------------------------- | ------------------------------------------------------------------ | --------------- |
| **On-Site Lodging**                      | ✅ Excludable             | Business premises + Employer convenience + Condition of employment | §119            |
| **On-Site Meals (employer convenience)** | ✅ Excludable             | Business premises + Employer convenience                           | §119            |
| **De Minimis Meals**                     | ✅ Excludable             | Occasional, small value                                            | §132(e)         |
| **Bathroom/Kitchen Supplies**            | ✅ De minimis             | Incidental, already stocked                                        | §132(e)         |
| **Working Supplies**                     | ✅ Excludable             | Would be deductible if employee paid                               | §132(d)         |
| **Business Vehicle Use**                 | ✅ Excludable             | 100% business use                                                  | §132(d)         |
| **Personal Vehicle Use**                 | ❌ Taxable                | Personal portion                                                   | —               |
| **Qualified Transportation**             | ✅ Excludable up to limit | $340/month transit/parking                                         | §132(f)         |

### Documentation Best Practices

For maximum tax benefit, document:

1. **For Lodging**:
   - Written policy requiring on-site presence
   - Business purposes for each stay (inspection reports, emergency response logs)
   - Board meeting minutes establishing oversight duties

2. **For Meals**:
   - Business purpose documentation
   - Why on-site eating was necessary
   - 50%+ calculation if relying on that rule

3. **For Consumables**:
   - Operating budget includes supplies for all properties
   - No special purchases for owner personal use
   - De minimis treatment is reasonable given amounts

4. **For Transportation**:
   - Mileage logs differentiating business vs personal
   - Business purpose for each trip
   - Vehicle use policy

### C Corp Advantage Recap

**Why This Matters for C Corp Owner-Directors**:

```
C Corporation Owner-Director:
├── IRC §119 Lodging → AVAILABLE ✅
├── IRC §119 Meals → AVAILABLE ✅
├── De Minimis Benefits → AVAILABLE ✅
├── Working Condition Benefits → AVAILABLE ✅
└── Qualified Transportation → AVAILABLE ✅

S Corporation 2%+ Shareholder:
├── IRC §119 Lodging → NOT AVAILABLE ❌
├── IRC §119 Meals → NOT AVAILABLE ❌
├── De Minimis Benefits → Limited availability
├── Working Condition Benefits → AVAILABLE ✅
└── Qualified Transportation → NOT AVAILABLE ❌
```

**Bottom Line**: C Corp structure provides significant tax advantages for owner-directors who must be on-site at business locations. The same expenses that would be taxable compensation for an S Corp 2%+ shareholder can potentially be tax-free for a C Corp owner-director.

---

## Research Status

| Area                            | Status      | Source                          |
| ------------------------------- | ----------- | ------------------------------- |
| C Corp fringe benefits          | ✅ Complete | Pub 15-B (2026)                 |
| S Corp 2% shareholder rules     | ✅ Complete | IRS.gov S Corp guide            |
| LLC tax elections               | ✅ Complete | IRS.gov LLC page                |
| Accountable plan rules          | ✅ Complete | Pub 463 (2024)                  |
| De minimis benefits             | ✅ Complete | Pub 15-B (2026)                 |
| Working condition benefits      | ✅ Complete | Pub 15-B (2026)                 |
| Amazon allocation scenarios     | ✅ Complete | Synthesis of rules              |
| **Board member benefits**       | ✅ Complete | Pub 525, IRC §132               |
| **Director compensation**       | ✅ Complete | 1099-NEC rules                  |
| **Vacation rental specifics**   | ✅ Complete | Pub 463, 527, 525               |
| **On-site lodging (IRC §119)**  | ✅ Complete | IRC §119, Pub 15-B (2026)       |
| **On-site meals**               | ✅ Complete | IRC §119, Pub 15-B (2026)       |
| **On-site consumables**         | ✅ Complete | De minimis rules, Pub 15-B      |
| **On-site transportation**      | ✅ Complete | Pub 463 (2024), Pub 15-B (2026) |
| **C Corp vs S Corp comparison** | ✅ Complete | IRC §1372, synthesis            |

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

_Research compiled from IRS.gov sources, February 2026_
