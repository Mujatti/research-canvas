/**
 * services/suggestionsService.js
 * Autocomplete suggestions with debounce. Reads config at call time.
 */

import { getConfig } from '../config/app.config';
import { getClient } from './keywordSearchService';

var _timeout = null;

export function fetchSuggestions(term, callback) {
  cancelPending();
  var config = getConfig();

  if (!config.suggestions.enabled || !term || term.length < config.suggestions.minChars) {
    callback([]);
    return;
  }

  _timeout = setTimeout(function () {
    var client = getClient();
    if (!client || typeof client.suggestions !== 'function') { callback([]); return; }
    try {
      client.suggestions(term, function (response) {
        if (response && response.suggestions && response.suggestions.length > 0) {
          callback(response.suggestions.slice(0, config.suggestions.maxResults));
        } else { callback([]); }
      });
    } catch (e) { callback([]); }
  }, config.suggestions.debounceMs);
}

export function cancelPending() {
  if (_timeout) { clearTimeout(_timeout); _timeout = null; }
}
