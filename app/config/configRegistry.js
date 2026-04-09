/**
 * config/configRegistry.js
 *
 * Maps config keys (used in ?config=KEY URL param) to config objects.
 * Simple local lookup — no backend, no fetching.
 *
 * Usage:
 *   /?config=default    → loads demo-default config
 *   /?config=acme       → loads Acme Corp config
 *   /?config=university → loads university config
 *   / (no param)        → loads 'default'
 *
 * To add a new customer demo:
 *   1. Create a config object below (or import from config/examples/)
 *   2. Add an entry to CONFIG_REGISTRY
 *   3. Share the URL: https://your-app.vercel.app/?config=customer-name
 *
 * FUTURE (Step 3 demo sessions):
 *   This registry could be replaced or supplemented by a fetch()
 *   to a backend API that returns config for a session token.
 *   The resolveConfig() interface stays the same.
 */

import demoDefault from './examples/demo-default';
import demoEcommerce from './examples/demo-customer-ecommerce';

// ── Registry ──────────────────────────────────────
// Each key maps to a config override object (merged onto defaults).

var CONFIG_REGISTRY = {

  // AddSearch's own index — the default demo
  'default': demoDefault,

  // E-commerce demo (product search with price sorting)
  'ecommerce': demoEcommerce,

  // Acme Corp — fictional B2B company
  'acme': {
    siteKey: '1bed1ffde465fddba2a53ad3ce69e6c2',  // Same index for demo; swap for real customer
    initialQuery: 'how to integrate search',
    labels: {
      heroTitle: 'Find answers across all Acme documentation.',
      heroSubtitle: 'Powered by AI.',
      searchPlaceholder: 'Search Acme docs...',
      searchButtonText: 'Search Docs',
      aiAnswerLabel: 'Acme AI Assistant',
      diveButtonText: 'Explore Further →',
      followUpPlaceholder: 'Ask Acme AI...',
      resetButtonText: 'Start over',
      searchTabLabel: 'Docs',
      diveTabLabel: 'Ask AI',
      footerBrand: 'Acme Corp',
      footerBrandUrl: 'https://www.example.com/',
      footerTagline: '· Documentation Search',
    },
    theme: {
      accentColor: '#7c3aed',   // Purple
    },
    filterOptions: {
      all: { label: 'All Docs', filter: {}, active: true },
      docs: { label: 'Documentation', filter: { category: '1xdocs' } },
      blog: { label: 'Blog', filter: { category: '1xblog' } },
    },
  },

  // University — higher education demo
  'university': {
    siteKey: '1bed1ffde465fddba2a53ad3ce69e6c2',  // Same index for demo; swap for real customer
    labels: {
      heroTitle: 'Search courses, research, and campus resources.',
      heroSubtitle: 'Your AI campus assistant.',
      searchPlaceholder: 'What are you looking for?',
      searchButtonText: 'Search',
      aiAnswerLabel: 'Campus AI',
      diveButtonText: 'Learn More →',
      followUpPlaceholder: 'Ask a follow-up question...',
      searchTabLabel: 'Results',
      diveTabLabel: 'Ask Campus AI',
      footerBrand: 'State University',
      footerBrandUrl: 'https://www.example.edu/',
      footerTagline: '· Campus Search',
    },
    theme: {
      accentColor: '#059669',   // Green
    },
    filterOptions: {
      all: { label: 'Everything', filter: {}, active: true },
      docs: { label: 'Academics', filter: { category: '1xdocs' } },
      blog: { label: 'News', filter: { category: '1xblog' } },
    },
  },
};

/**
 * Resolve a config key to a config object.
 * Falls back to 'default' if key is not found.
 *
 * @param {string|null} key - The config key from URL param
 * @returns {Object} Config override object
 */
export function resolveConfig(key) {
  if (!key) return CONFIG_REGISTRY['default'] || {};
  var config = CONFIG_REGISTRY[key.toLowerCase()];
  if (!config) {
    console.warn('[Config] Unknown config key "' + key + '", falling back to default.');
    return CONFIG_REGISTRY['default'] || {};
  }
  return config;
}

/**
 * Get the config key from the current URL's ?config= param.
 * Returns null if no param is present.
 *
 * @returns {string|null}
 */
export function getConfigKeyFromURL() {
  if (typeof window === 'undefined') return null;
  var params = new URLSearchParams(window.location.search);
  return params.get('config') || null;
}

/**
 * Get the list of available config keys (for debugging/demo selection).
 * @returns {string[]}
 */
export function getAvailableConfigs() {
  return Object.keys(CONFIG_REGISTRY);
}

export default CONFIG_REGISTRY;
