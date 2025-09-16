/**
 * TSV Categorizer - Business Intelligence Engine
 * Provides categorization and analysis for expense tracking
 */

class TSVCategorizer {
    constructor() {
        this.categories = {
            'Food & Dining': ['restaurant', 'food', 'grocery', 'dining', 'meal'],
            'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'bus', 'train', 'parking'],
            'Entertainment': ['movie', 'theater', 'concert', 'game', 'entertainment'],
            'Shopping': ['amazon', 'shopping', 'retail', 'store', 'purchase'],
            'Utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
            'Healthcare': ['medical', 'doctor', 'pharmacy', 'health', 'dental'],
            'Education': ['book', 'course', 'education', 'school', 'university'],
            'Travel': ['hotel', 'flight', 'travel', 'vacation', 'airbnb'],
            'Other': []
        };
    }

    /**
     * Categorize an expense based on description
     * @param {Object} expense - Expense object with description
     * @returns {string} - Category name
     */
    categorize(expense) {
        if (!expense || !expense.description) {
            return 'Other';
        }

        const description = expense.description.toLowerCase();

        for (const [category, keywords] of Object.entries(this.categories)) {
            for (const keyword of keywords) {
                if (description.includes(keyword)) {
                    return category;
                }
            }
        }

        return 'Other';
    }

    /**
     * Analyze expenses and provide insights
     * @param {Array} expenses - Array of expense objects
     * @returns {Object} - Analysis results
     */
    analyze(expenses) {
        if (!Array.isArray(expenses)) {
            return { error: 'Invalid expenses data' };
        }

        const analysis = {
            totalExpenses: expenses.length,
            totalAmount: expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0),
            categories: {},
            monthlyTrends: {},
            insights: []
        };

        // Categorize expenses
        expenses.forEach(expense => {
            const category = this.categorize(expense);
            if (!analysis.categories[category]) {
                analysis.categories[category] = { count: 0, total: 0 };
            }
            analysis.categories[category].count++;
            analysis.categories[category].total += parseFloat(expense.amount) || 0;
        });

        return analysis;
    }

    /**
     * Categorize BoA transaction
     * @param {Object} transaction - Bank of America transaction
     * @returns {Object} - Analysis result with category and subcategory
     */
    categorizeBoATransaction(transaction) {
        const category = this.categorize(transaction);
        return {
            category: category,
            subcategory: this.getSubcategory(transaction, category),
            confidence: 0.8
        };
    }

    /**
     * Analyze Amazon order
     * @param {Object} order - Amazon order object
     * @returns {Object} - Analysis result
     */
    analyzeAmazonOrder(order) {
        return {
            category: this.categorize(order),
            subscribeAndSave: {
                isSubscribeAndSave: this.isSubscribeAndSave(order),
                confidence: 0.7,
                indicators: []
            },
            dataQuality: {
                completeness: this.calculateDataCompleteness(order)
            }
        };
    }

    /**
     * Get subcategory for a transaction
     * @param {Object} transaction - Transaction object
     * @param {string} category - Main category
     * @returns {string|null} - Subcategory or null
     */
    getSubcategory(transaction, category) {
        if (!transaction || !transaction.description) {
            return null;
        }

        const desc = transaction.description.toLowerCase();

        switch (category) {
            case 'Food & Dining':
                if (desc.includes('restaurant') || desc.includes('dining')) return 'Restaurant';
                if (desc.includes('grocery')) return 'Grocery';
                break;
            case 'Transportation':
                if (desc.includes('gas') || desc.includes('fuel')) return 'Fuel';
                if (desc.includes('uber') || desc.includes('lyft')) return 'Ride Share';
                break;
            case 'Shopping':
                if (desc.includes('amazon')) return 'Amazon';
                break;
        }

        return null;
    }

    /**
     * Check if order is Subscribe & Save
     * @param {Object} order - Amazon order object
     * @returns {boolean} - Whether it's Subscribe & Save
     */
    isSubscribeAndSave(order) {
        if (!order || !order.items) {
            return false;
        }

        const items = order.items.toLowerCase();
        return items.includes('subscribe') || items.includes('save') ||
               items.includes('subscription') || items.includes('monthly');
    }

    /**
     * Calculate data completeness score
     * @param {Object} order - Amazon order object
     * @returns {number} - Completeness score (0-1)
     */
    calculateDataCompleteness(order) {
        if (!order) return 0;

        let score = 0;
        let total = 0;

        // Check required fields
        if (order.orderId) score++;
        total++;
        if (order.date) score++;
        total++;
        if (order.amount || order.total) score++;
        total++;
        if (order.items) score++;
        total++;

        return total > 0 ? score / total : 0;
    }
}

module.exports = TSVCategorizer;
