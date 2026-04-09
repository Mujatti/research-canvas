/**
 * services/keywordSearchService.js
 * Wraps AddSearch Search UI Library. Reads config at call time via getConfig().
 */

import { getConfig } from '../config/app.config';

var _sharedClient = null;

/** Get or create the shared AddSearchClient. */
export function getClient() {
  if (_sharedClient) return _sharedClient;
  if (typeof window === 'undefined' || !window.AddSearchClient) return null;
  try {
    _sharedClient = new window.AddSearchClient(getConfig().siteKey);
    return _sharedClient;
  } catch (e) { return null; }
}

/** Reset the shared client (e.g. after config change). */
export function resetClient() {
  _sharedClient = null;
}

/** Initialize keyword search UI. Retries if CDN scripts aren't ready yet. */
export function initKeywordSearch(query) {
  var config = getConfig();
  var ids = config.containerIds;

  function tryInit() {
    if (typeof window === 'undefined' || !window.AddSearchClient || !window.AddSearchUI) {
      // CDN not ready — retry
      setTimeout(tryInit, 200);
      return;
    }

    Object.values(ids).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });

    try {
      var client = new window.AddSearchClient(config.siteKey);
      var searchui = new window.AddSearchUI(client, { updateBrowserHistory: false });

      searchui.searchResults({ containerId: ids.results });
      searchui.filters({
        containerId: ids.filters,
        type: window.AddSearchUI.FILTER_TYPE.TABS,
        options: config.filterOptions,
      });
      searchui.sortBy({ containerId: ids.sortBy, options: config.sortOptions });
      searchui.pagination({ containerId: ids.pagination });
      searchui.start();
      setTimeout(function () { if (searchui.search) searchui.search(query); }, 100);
    } catch (e) { console.error('Search UI init error:', e); }
  }

  tryInit();
}

/** Fetch related results (normalized). */
export function fetchRelatedResults(query) {
  var config = getConfig();
  return new Promise(function (resolve) {
    if (!query) { resolve({ results: [], totalHits: 0 }); return; }
    function trySearch() {
      var client = getClient();
      if (!client) { setTimeout(trySearch, 300); return; }
      try {
        client.search(query, function (r) {
          if (r && r.hits && r.hits.length > 0) {
            resolve({
              results: r.hits.slice(0, config.maxRelatedResults).map(function (h) {
                var thumb = h.images ? (h.images.main || h.images.capture || '') : '';
                return { title: h.title || '', url: h.url || '', thumbnail: thumb };
              }),
              totalHits: r.total_hits || 0,
            });
          } else { resolve({ results: [], totalHits: 0 }); }
        });
      } catch (e) { resolve({ results: [], totalHits: 0 }); }
    }
    trySearch();
  });
}
