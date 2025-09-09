# Amazon Data Sources Summary

**Last Updated:** September 9, 2025  
**Data Cleanup:** Completed - Extracted folders removed from root

## 📊 Available Amazon Datasets

### Primary Datasets (Recommended for Import)

1. **`amazon-comprehensive-orders.csv`** (1.6MB, 2,789 orders) ⭐ **BEST**
   - **Source:** Amazon Official "Your Orders.zip" → Retail.OrderHistory.1
   - **Format:** Complete transaction details with full metadata
   - **Columns:** Order ID, Date, Currency, Prices, Tax, Shipping, ASIN, Addresses, Tracking, etc.
   - **Use Case:** Most comprehensive analysis with full business intelligence

2. **`amazon-official-data.csv`** (559KB, 2,785 orders) ⭐ **PROCESSED**
   - **Source:** Amazon Official export (processed/cleaned)
   - **Format:** Pre-categorized business intelligence format
   - **Columns:** id, date, amount, description, category, asin, source
   - **Use Case:** Ready-to-import format with categories already assigned

### Secondary Datasets

3. **`amazon_order_history.csv`** (375KB, 1,948 orders)
   - **Source:** Chrome Extension scraping
   - **Format:** Scraped web interface data
   - **Use Case:** Legacy data, less comprehensive than official sources

4. **`amazon-cart-history.csv`** (62KB, 221 items)
   - **Source:** Amazon Cart Items from official export
   - **Format:** Items added to cart (saved/wishlist items)
   - **Use Case:** Shopping pattern analysis, potential future purchases

### Test/Sample Data

5. **`amazon-batch1.csv`** (7KB, 21 orders) - Testing subset
6. **`amazon-test-sample.csv`** (533B) - Development testing

## 🎯 Recommendation for Data Import

**Use `amazon-comprehensive-orders.csv` for new imports** - it has:
- ✅ Most complete data (2,789 vs 2,785 orders)
- ✅ Full transaction metadata (shipping, tax, tracking)
- ✅ ASIN product identifiers
- ✅ Customer addresses for location analysis
- ✅ Payment method details

## 📁 Cleanup Summary

**Removed from root directory:**
- `Retail.*` folders (Amazon retail data extractions)
- `Digital.*` folders (Digital purchase data)
- `YourOrders.*` folders (Photo delivery data)
- `Sustainability.*` folders (Environmental metrics)

**Preserved in data folder:**
- All Amazon CSV datasets organized and documented
- Original "Your Orders.zip" file maintained for reference

**Total space saved:** ~2MB of extracted folder structure cleanup
