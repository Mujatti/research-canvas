/**
 * services/refineQueryService.js
 *
 * Calls the refine-query proxy and returns a normalized result.
 * Raw API field (refined_query) is mapped to refinedQuery here.
 *
 * @param {string} question - The conversational question to refine
 * @param {string} conversationId - Active conversation ID
 * @returns {Promise<string>} The refined keyword query
 */

import { fetchRefineQuery } from './conversationsAdapter';

export function refineQuery(question, conversationId) {
  return fetchRefineQuery(question, conversationId)
    .then(function (response) {
      if (!response.ok) return '';
      return response.json();
    })
    .then(function (data) {
      // Normalize: the proxy already maps refined_query → refinedQuery
      return data.refinedQuery || '';
    })
    .catch(function () {
      return ''; // Fail silently — refine-query is non-critical
    });
}
