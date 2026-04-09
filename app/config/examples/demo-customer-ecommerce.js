/**
 * config/examples/demo-customer-ecommerce.js
 *
 * Example: customer-specific demo for an e-commerce site.
 * Shows how to customize siteKey, labels, filters, theme, and initial query
 * without touching any app code.
 *
 * Usage in page.js:
 *   import customerConfig from './config/examples/demo-customer-ecommerce';
 *   loadConfig(customerConfig);
 */

var customerEcommerceConfig = {
  siteKey: 'CUSTOMER_SITE_KEY_HERE',

  // Pre-fill and auto-execute a demo query
  initialQuery: 'wireless headphones',

  // Customer-specific filters based on their index categories
  filterOptions: {
    all: { label: 'All Products', filter: {}, active: true },
    electronics: { label: 'Electronics', filter: { category: '1xelectronics' } },
    accessories: { label: 'Accessories', filter: { category: '1xaccessories' } },
    sale: { label: 'On Sale', filter: { custom_fields: { on_sale: 'true' } } },
  },

  sortOptions: [
    { label: 'Most Relevant', sortBy: 'relevance', order: 'desc', active: true },
    { label: 'Price: Low to High', sortBy: 'custom_fields.price', order: 'asc' },
    { label: 'Price: High to Low', sortBy: 'custom_fields.price', order: 'desc' },
    { label: 'Newest', sortBy: 'date', order: 'desc' },
  ],

  // Custom labels for the customer's brand
  labels: {
    heroTitle: 'Find the perfect product with AI-powered search.',
    heroSubtitle: 'Search smarter, shop faster.',
    searchPlaceholder: 'Search products or ask a question...',
    searchButtonText: 'Find',
    aiAnswerLabel: 'AI Product Expert',
    diveButtonText: 'Ask More →',
    followUpPlaceholder: 'Ask about sizes, colors, compatibility...',
    resetButtonText: 'New search',
    relatedResultsLabel: 'Related Products',
    searchTabLabel: 'Products',
    diveTabLabel: 'Ask Expert',
    footerBrand: 'AcmeStore',
    footerBrandUrl: 'https://www.example.com/',
    footerTagline: '· Powered by AddSearch AI',
  },

  // Customer brand colors
  theme: {
    accentColor: '#2563eb',     // Blue instead of AddSearch red
    logoUrl: '/customer-logo.png',
  },
};

export default customerEcommerceConfig;
