# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - button "Menu" [active] [ref=e3] [cursor=pointer]: ☰
    - heading "📊 TSV" [level=1] [ref=e4]
    - button "Sign In" [ref=e5] [cursor=pointer]
  - complementary [ref=e6]:
    - navigation [ref=e7]:
      - link "📊 Dashboard" [ref=e8] [cursor=pointer]:
        - /url: "#/"
      - link "💰 Expenses" [ref=e9] [cursor=pointer]:
        - /url: "#/expenses"
      - link "📁 Import" [ref=e10] [cursor=pointer]:
        - /url: "#/import"
      - link "⚙️ Settings" [ref=e11] [cursor=pointer]:
        - /url: "#/settings"
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - article [ref=e15]:
          - heading "🏢 Supplies" [level=3] [ref=e16]
          - paragraph [ref=e17]: $0.00
          - text: 0 items
        - article [ref=e18]:
          - heading "👥 Benefits" [level=3] [ref=e19]
          - paragraph [ref=e20]: $0.00
          - text: 0 items
      - paragraph [ref=e21]: No expenses yet. Import data to get started.
  - contentinfo [ref=e22]: TSV Expenses v3.0 • Texas Sunset Venues
```