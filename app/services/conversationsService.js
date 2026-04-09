/**
 * services/conversationsService.js
 *
 * High-level conversation API. Calls adapter + SSE parser.
 * Returns NORMALIZED internal models — no raw API shapes escape this file.
 *
 * Normalized output shapes:
 *   onMetadata: { conversationId: string }
 *   onToken:    content string
 *   onSources:  [{ title: string, url: string }]
 *   onDone:     (no payload)
 *   onError:    Error object
 *
 * Non-streaming returns:
 *   { answer: string, conversationId: string, sources: [{ title, url }] }
 */

import { fetchConversation } from './conversationsAdapter';
import { parseConversationStream } from './parseConversationStream';

// ── Internal: normalize a raw source object ──
function normalizeSource(raw) {
  return {
    title: raw.title || raw.url || '',
    url: raw.url || raw.link || '',
  };
}

// ── Internal: normalize a non-streaming JSON response ──
function normalizeJsonResponse(data) {
  // AddSearch nests the response: data.response.answer, data.response.conversation_id
  var inner = data.response || data;
  return {
    answer: inner.answer || '',
    conversationId: inner.conversation_id || inner.conversationId || '',
    sources: Array.isArray(inner.sources)
      ? inner.sources.map(normalizeSource)
      : [],
  };
}

/**
 * Stream a conversation response (initial or follow-up).
 *
 * All callbacks receive NORMALIZED data — no raw API shapes.
 *
 * @param {string} question
 * @param {string|null} conversationId - null for new conversation
 * @param {Object} callbacks
 * @param {function} callbacks.onMetadata - ({ conversationId }) first SSE event
 * @param {function} callbacks.onToken    - (content: string) each text chunk
 * @param {function} callbacks.onSources  - ([{ title, url }]) source references
 * @param {function} callbacks.onDone     - () stream complete
 * @param {function} callbacks.onError    - (error) stream or fetch error
 */
export function streamConversation(question, conversationId, callbacks) {
  var doneCalled = false;

  function callDoneOnce() {
    if (!doneCalled) {
      doneCalled = true;
      callbacks.onDone && callbacks.onDone();
    }
  }

  fetchConversation(question, conversationId, true)
    .then(function (response) {
      if (!response.ok) {
        callbacks.onError && callbacks.onError(new Error('API returned ' + response.status));
        return;
      }

      var contentType = response.headers.get('content-type') || '';

      // If the proxy returned JSON instead of SSE, handle as non-streaming
      if (!contentType.includes('text/event-stream')) {
        return response.json().then(function (data) {
          var normalized = normalizeJsonResponse(data);
          if (normalized.conversationId) {
            callbacks.onMetadata && callbacks.onMetadata({ conversationId: normalized.conversationId });
          }
          // Emit the full answer as a single token
          if (normalized.answer) {
            callbacks.onToken && callbacks.onToken(normalized.answer);
          }
          if (normalized.sources.length > 0) {
            callbacks.onSources && callbacks.onSources(normalized.sources);
          }
          callDoneOnce();
        });
      }

      // Parse SSE stream with normalized callbacks
      parseConversationStream(response.body.getReader(), {
        onMetadata: function (raw) {
          // Normalize: conversation_id → conversationId
          callbacks.onMetadata && callbacks.onMetadata({
            conversationId: raw.conversation_id || raw.conversationId || '',
          });
        },
        onToken: function (content) {
          callbacks.onToken && callbacks.onToken(content);
        },
        onSources: function (rawSources) {
          // Normalize each source
          var normalized = (rawSources || []).map(normalizeSource);
          callbacks.onSources && callbacks.onSources(normalized);
        },
        onDone: function () {
          callDoneOnce();
        },
        onError: function (err) {
          callbacks.onError && callbacks.onError(err);
        },
      });
    })
    .catch(function (err) {
      if (err.name === 'AbortError') return; // User-initiated abort, not an error
      callbacks.onError && callbacks.onError(err);
    });
}

/**
 * Get a conversation response without streaming (non-streaming fallback).
 *
 * @param {string} question
 * @param {string|null} conversationId
 * @returns {Promise<{ answer, conversationId, sources }>} Normalized response
 */
export function getConversationJSON(question, conversationId) {
  return fetchConversation(question, conversationId, false)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('API returned ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      return normalizeJsonResponse(data);
    });
}
