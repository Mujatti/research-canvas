/**
 * config/app.config.js
 *
 * Central configuration for the AI Search Experience Starter App.
 *
 * CONFIG FLOW:
 *   config → services/adapter     (siteKey, proxyUrls, tags)
 *   config → orchestration        (behavior: rateLimits, maxResults)
 *   config → page.js → components (labels, theme — passed as props, never imported by components)
 *
 * LOADING:
 *   1. Defaults are always present
 *   2. Override via loadConfig(overrides) — merges on top of defaults
 *   3. Currently accepts a local object
 *   4. Future: loadConfig() can fetch from URL for runtime/session config
 *
 * RULES:
 *   - Components NEVER import this file. They receive config values as props.
 *   - Only services, orchestration, and page.js may read config.
 *   - Config contains NO logic. Just values.
 */

// ══════════════════════════════════════════════════
// DEFAULTS — every field is documented inline
// ══════════════════════════════════════════════════

var DEFAULTS = {

  // ── REQUIRED ────────────────────────────────────
  // AddSearch public site key. Override via env var or loadConfig().
  siteKey: '',

  // ── API / Proxy ─────────────────────────────────
  proxyUrls: {
    conversations: '/api/proxy/aiConversations',   // SSE streaming proxy
    refineQuery: '/api/proxy/refineQuery',         // Refine-query proxy
  },
  tags: ['sender:starter-app'],                    // Analytics tags for Dashboard

  // ── Answer provider ─────────────────────────────
  // 'conversations' = AI Conversations for initial answer (current)
  // 'aiAnswers'     = AI Answers for initial answer (future, not implemented)
  answerProvider: 'conversations',

  // ── Behavior ────────────────────────────────────
  rateLimitMs: 2000,               // Min ms between submissions
  maxFollowUpLength: 210,          // Max chars for follow-up (0 = no limit)
  maxRelatedResults: 4,            // Related result cards in Dive Deeper
  initialQuery: '',                // Auto-execute on load ('' = show landing)

  // ── Suggestions ─────────────────────────────────
  suggestions: {
    enabled: true,
    debounceMs: 200,
    maxResults: 5,
    minChars: 2,
  },

  // ── Keyword search ──────────────────────────────
  filterOptions: {
    all: { label: 'All Results', filter: {}, active: true },
  },
  sortOptions: [
    { label: 'Sort by Relevance', sortBy: 'relevance', order: 'desc', active: true },
  ],
  containerIds: {
    results: 'addsearch-results',
    filters: 'addsearch-filters',
    sortBy: 'addsearch-sortby',
    pagination: 'addsearch-pagination',
  },

  // ── Labels ──────────────────────────────────────
  // All user-facing text. Override for branding or localization.
  labels: {
    heroTitle: 'Research Canvas for Evidence-Driven Teams.',
    heroSubtitle: 'Search, pin evidence, compare signals, and build a structured point of view.'
    searchPlaceholder: 'Ask a question or search by keyword...',
    searchButtonText: 'Search',
    headerSearchPlaceholder: 'Ask anything...',
    aiAnswerLabel: 'Research Brief',
    aiAnswerStreaming: 'Thinking...',
    aiAnswerLoading: 'Thinking...',
    diveButtonText: 'Open Investigation Log →',
    initialAnswerLabel: 'Research Brief',
    followUpPlaceholder: 'Ask a follow-up...',
    freshQuestionPlaceholder: 'Ask a question...',
    resetButtonText: 'Reset conversation',
    relatedResultsLabel: 'Evidence From Related Results',
    searchTabLabel: 'Canvas',
    diveTabLabel: 'Investigation Log',
    exploringLabel: 'Exploring',
    resumeButtonText: 'Resume Dive Deeper →',
    resetAllButtonText: 'Reset',
    footerText: 'Powered by',
    footerBrand: 'AddSearch',
    footerBrandUrl: 'https://www.addsearch.com/',
    footerTagline: '',
    sourcesLabel: '{count} sources',
  },

  // ── Theme ───────────────────────────────────────
  // Applied as CSS custom properties. Set null to keep CSS defaults.
  theme: {
    accentColor: null,       // e.g. '#e2422a'
    bgColor: null,           // e.g. '#191a1f'
    textColor: null,         // e.g. '#ececed'
    fontFamily: null,        // e.g. "'Plus Jakarta Sans', sans-serif"
    logoUrl: null,           // e.g. '/my-logo.png'
    borderRadius: null,      // e.g. '12px'
  },
};


// ══════════════════════════════════════════════════
// ACTIVE CONFIG — merged defaults + overrides
// ══════════════════════════════════════════════════

var _config = deepMerge({}, DEFAULTS);
applyEnvFallback();

/**
 * Load configuration by merging overrides on top of defaults.
 *
 * siteKey precedence (highest to lowest):
 *   1. overrides.siteKey (from runtime config / registry)
 *   2. NEXT_PUBLIC_ADDSEARCH_SITEKEY env var (deployment default)
 *   3. '' (empty — app will warn at startup)
 *
 * @param {Object} overrides - Partial config. Only include fields you want to change.
 * @returns {Object} The full merged config
 */
export function loadConfig(overrides) {
  _config = deepMerge(deepMerge({}, DEFAULTS), overrides || {});

  // Env var is a FALLBACK — only applied if the runtime config didn't provide a siteKey
  if (!_config.siteKey) {
    applyEnvFallback();
  }

  // Warn if still no siteKey
  if (!_config.siteKey) {
    console.error('[Config] No siteKey configured. Set it in your config or via NEXT_PUBLIC_ADDSEARCH_SITEKEY env var.');
  }

  return _config;
}

/** Get the full active config. */
export function getConfig() {
  return _config;
}

/** Get a section by key (e.g. 'labels', 'theme', 'proxyUrls'). */
export function getConfigSection(key) {
  return _config[key];
}

// ── Env var fallback (only used when runtime config has no siteKey) ──
function applyEnvFallback() {
  if (!_config.siteKey && typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_ADDSEARCH_SITEKEY) {
    _config.siteKey = process.env.NEXT_PUBLIC_ADDSEARCH_SITEKEY;
  }
}

// ── Deep merge (no dependencies) ──
function deepMerge(target, source) {
  var result = Object.assign({}, target);
  for (var key in source) {
    if (!source.hasOwnProperty(key)) continue;
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export default _config;
