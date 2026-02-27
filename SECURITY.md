# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them using one of the following methods:

### Option 1: GitHub Security Advisories (Preferred)

1. Go to the [Security tab](https://github.com/chf3198/tsv-ledger/security)
2. Click "Report a vulnerability"
3. Fill out the form with details

### Option 2: Email

Send an email to **chf3198@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

## What to Include

Please include as much of the following information as possible:

- Type of issue (e.g., XSS, authentication bypass, data exposure)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

## Disclosure Policy

- We will acknowledge receipt of your vulnerability report
- We will confirm the vulnerability and determine its impact
- We will release a fix as soon as possible, depending on complexity
- We will publicly disclose the vulnerability after a fix is available

## Safe Harbor

We consider security research conducted consistent with this policy to be:

- Authorized concerning any applicable anti-hacking laws
- Authorized concerning any relevant anti-circumvention laws
- Exempt from restrictions in our Terms of Service that would interfere with
  conducting security research

We will not pursue civil action or initiate a complaint with law enforcement
for accidental, good-faith violations of this policy.

## Scope

This security policy applies to:

- The TSV Ledger web application (https://tsv-ledger.pages.dev)
- The TSV Ledger API (https://tsv-ledger-api.chf3198.workers.dev)
- This GitHub repository

### Out of Scope

- Third-party services (Cloudflare, GitHub, Google, etc.)
- Issues already known or previously reported
- Denial of service attacks
- Social engineering attacks

## Recognition

We appreciate the security research community's efforts in keeping TSV Ledger
safe. Contributors who report valid vulnerabilities will be acknowledged in our
release notes (unless they prefer to remain anonymous).

Thank you for helping keep TSV Ledger and our users safe!
