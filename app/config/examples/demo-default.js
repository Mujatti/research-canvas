/**
 * config/examples/demo-default.js
 *
 * Default demo config — uses AddSearch's own index.
 * This is what you get out of the box with no overrides.
 *
 * Usage in page.js:
 *   import demoConfig from './config/examples/demo-default';
 *   loadConfig(demoConfig);
 */

var demoDefaultConfig = {
  siteKey: '1bed1ffde465fddba2a53ad3ce69e6c2',

  filterOptions: {
    all: { label: 'All Results', filter: {}, active: true },
    docs: { label: 'Documentation & Support', filter: { category: '1xdocs' } },
    blog: { label: 'Blog', filter: { category: '1xblog' } },
    product: { label: 'Product', filter: { category: '1xproduct' } },
  },

  sortOptions: [
    { label: 'Sort by Relevance', sortBy: 'relevance', order: 'desc', active: true },
    { label: 'Newest First', sortBy: 'date', order: 'desc' },
    { label: 'Oldest First', sortBy: 'date', order: 'asc' },
  ],
};

export default demoDefaultConfig;
