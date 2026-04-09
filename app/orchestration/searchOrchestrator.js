/**
 * orchestration/searchOrchestrator.js
 *
 * All business logic and view transitions live here.
 *
 * Calls services → updates React state.
 * No fetch() calls. No UI rendering. No direct API awareness.
 *
 * The orchestrator stores a reference to React's setState function,
 * passed during init(). All state updates go through that function.
 *
 * React's useState in page.js is the SINGLE SOURCE OF TRUTH.
 */

import * as answerProvider from '../services/answerProvider';
import * as conversationsService from '../services/conversationsService';
import { abort as abortConversation } from '../services/conversationsAdapter';
import { refineQuery } from '../services/refineQueryService';
import { initKeywordSearch, fetchRelatedResults } from '../services/keywordSearchService';
import { fetchSuggestions, cancelPending as cancelSuggestions } from '../services/suggestionsService';
import { getConfig } from '../config/app.config';

// ── State reference ──
var _setState = null;
var _getState = null;

// ── Refs (mutable values that don't trigger re-renders) ──
var _aiAnswerComplete = '';     // Full answer text for cut-off fix
var _aiSourcesComplete = [];   // Full sources for cut-off fix
var _refinedQueryRef = '';     // Refined query for related results
var _lastRequestTime = 0;     // Rate limiting
var _followUpAbort = null;     // Abort function for follow-up stream

/**
 * Initial state shape. React state is initialized with this.
 */
export var INITIAL_STATE = {
  // View
  view: 'landing',          // 'landing' | 'search' | 'dive'
  query: '',
  hasSearched: false,

  // AI Answer (initial)
  aiAnswer: '',
  aiSources: [],
  aiLoading: false,
  aiStreaming: false,
  showAiAnswer: true,

  // Conversation
  conversationId: null,
  conversationStarted: false,
  messages: [],
  followUpLoading: false,
  followUpStreaming: false,
  streamingText: '',

  // Related results
  relatedResults: [],
  totalRelated: 0,

  // Session
  hasDiveSession: false,
  returnedFromDive: false,
  refinedQuery: '',
  latestDiveQuery: '',

  // Suggestions
  suggestions: [],
  showSuggestions: false,
};

// ── Internal: merge partial state into current state ──
function update(partial) {
  if (!_setState) return;
  _setState(function (prev) { return Object.assign({}, prev, partial); });
}

function getState() {
  if (!_getState) return INITIAL_STATE;
  return _getState();
}

// ══════════════════════════════════════════════════════
// PUBLIC API — called by components via callbacks
// ══════════════════════════════════════════════════════

/**
 * Initialize the orchestrator with React's state functions.
 * Called once from page.js useEffect.
 */
export function init(setState, getStateFn) {
  _setState = setState;
  _getState = getStateFn;
}

/**
 * Execute a search: get initial AI answer + keyword results.
 */
export function doSearch(q) {
  if (!q) return;

  // Abort any in-progress streams
  abortConversation();
  if (_followUpAbort) { _followUpAbort(); _followUpAbort = null; }

  // Reset all state for new search
  _aiAnswerComplete = '';
  _aiSourcesComplete = [];
  _refinedQueryRef = '';

  update({
    view: 'search',
    query: q,
    hasSearched: true,
    showAiAnswer: true,
    aiAnswer: '',
    aiSources: [],
    aiLoading: true,
    aiStreaming: false,
    returnedFromDive: false,
    suggestions: [],
    showSuggestions: false,
    // Reset dive state
    messages: [],
    conversationId: null,
    conversationStarted: false,
    relatedResults: [],
    totalRelated: 0,
    hasDiveSession: false,
    latestDiveQuery: '',
    refinedQuery: '',
  });

  cancelSuggestions();

  // ── Initial answer via answerProvider ──
  var accumulated = '';

  answerProvider.getInitialAnswer(q, {
    onMetadata: function (data) {
      update({
        aiLoading: false,
        aiStreaming: true,
        conversationId: data.conversationId || null,
        conversationStarted: !!data.conversationId,
      });
    },
    onToken: function (content) {
      accumulated += content;
      _aiAnswerComplete = accumulated;
      update({ aiAnswer: accumulated, aiLoading: false, aiStreaming: true });
    },
    onSources: function (sources) {
      _aiSourcesComplete = sources;
      update({ aiSources: sources });
    },
    onDone: function () {
      if (accumulated) {
        _aiAnswerComplete = accumulated;
        update({ aiAnswer: accumulated, aiLoading: false, aiStreaming: false });
      } else {
        update({ aiLoading: false, aiStreaming: false });
      }
    },
    onError: function () {
      update({ aiLoading: false, aiStreaming: false, aiAnswer: 'An error occurred.' });
    },
  });

  // ── Keyword results in parallel ──
  setTimeout(function () { initKeywordSearch(q); }, 100);
}

/**
 * Send a follow-up question in the Dive Deeper conversation.
 */
export function doFollowUp(question) {
  if (!question) return;

  var now = Date.now();
  if (now - _lastRequestTime < getConfig().rateLimitMs) return;
  _lastRequestTime = now;

  // Abort previous follow-up if still in progress
  if (_followUpAbort) { _followUpAbort(); _followUpAbort = null; }

  var state = getState();
  var convId = state.conversationId;

  update({
    messages: state.messages.concat([{ role: 'user', text: question }]),
    followUpLoading: true,
    followUpStreaming: false,
    streamingText: '',
    relatedResults: [],
    totalRelated: 0,
    latestDiveQuery: question,
    hasDiveSession: true,
  });

  _refinedQueryRef = '';

  // Refine query in parallel (non-blocking)
  if (convId) {
    refineQuery(question, convId).then(function (refined) {
      if (refined) {
        _refinedQueryRef = refined;
        update({ refinedQuery: refined });
      }
    });
  }

  // Stream follow-up answer
  var accumulated = '';
  var streamSources = [];

  // Store abort reference — conversationsAdapter handles the AbortController,
  // but we also need to know the follow-up is "ours" so we don't interfere
  // with a new follow-up that starts before this one finishes.
  var aborted = false;
  _followUpAbort = function () { aborted = true; abortConversation(); };

  conversationsService.streamConversation(question, convId, {
    onMetadata: function (data) {
      if (aborted) return;
      update({ followUpLoading: false, followUpStreaming: true });
      if (data.conversationId) {
        update({ conversationId: data.conversationId, conversationStarted: true });
      }
    },
    onToken: function (content) {
      if (aborted) return;
      accumulated += content;
      update({ followUpLoading: false, followUpStreaming: true, streamingText: accumulated });
    },
    onSources: function (sources) {
      if (aborted) return;
      streamSources = sources;
    },
    onDone: function () {
      if (aborted) return;
      _followUpAbort = null;

      if (accumulated) {
        var currentState = getState();
        update({
          messages: currentState.messages.concat([{ role: 'assistant', text: accumulated, sources: streamSources }]),
          followUpLoading: false,
          followUpStreaming: false,
          streamingText: '',
        });

        // Fetch related results using refined query when available
        var relatedQuery = _refinedQueryRef || question;
        fetchRelatedResults(relatedQuery).then(function (result) {
          update({ relatedResults: result.results, totalRelated: result.totalHits });
        });
      } else {
        var currentState2 = getState();
        update({
          messages: currentState2.messages.concat([{ role: 'assistant', text: 'I could not find an answer.', sources: [] }]),
          followUpLoading: false,
          followUpStreaming: false,
          streamingText: '',
        });
      }
    },
    onError: function () {
      if (aborted) return;
      var currentState = getState();
      update({
        messages: currentState.messages.concat([{ role: 'assistant', text: 'An error occurred.', sources: [] }]),
        followUpLoading: false,
        followUpStreaming: false,
        streamingText: '',
      });
    },
  });
}

/**
 * Switch to the Search tab.
 */
export function switchToSearch() {
  var state = getState();
  cancelSuggestions();
  update({ view: 'search', suggestions: [], showSuggestions: false });

  if (state.hasDiveSession) {
    update({ returnedFromDive: true, showAiAnswer: false });
    var sq = state.refinedQuery || state.latestDiveQuery || state.query;
    setTimeout(function () { initKeywordSearch(sq); }, 100);
  }
}

/**
 * Switch to the Dive Deeper tab.
 */
export function switchToDive() {
  cancelSuggestions();

  // Fix: ensure the AI answer is the COMPLETE version (cut-off fix)
  var updates = {
    view: 'dive',
    returnedFromDive: false,
    suggestions: [],
    showSuggestions: false,
    hasDiveSession: true,
  };
  if (_aiAnswerComplete) updates.aiAnswer = _aiAnswerComplete;
  if (_aiSourcesComplete.length > 0) updates.aiSources = _aiSourcesComplete;
  update(updates);

  // Start conversation if none exists yet
  var state = getState();
  if (!state.conversationStarted && state.query) {
    conversationsService.getConversationJSON(state.query, null).then(function (data) {
      if (data.conversationId) {
        update({ conversationId: data.conversationId, conversationStarted: true });
      }
    }).catch(function () {});
  }
}

/**
 * Full reset — back to landing screen.
 */
export function resetAll() {
  abortConversation();
  if (_followUpAbort) { _followUpAbort(); _followUpAbort = null; }
  cancelSuggestions();
  _aiAnswerComplete = '';
  _aiSourcesComplete = [];
  _refinedQueryRef = '';
  update(INITIAL_STATE);
}

/**
 * Reset conversation only — blank slate in Dive Deeper.
 */
export function resetConversation() {
  abortConversation();
  if (_followUpAbort) { _followUpAbort(); _followUpAbort = null; }
  _refinedQueryRef = '';
  _aiAnswerComplete = '';
  _aiSourcesComplete = [];
  update({
    messages: [],
    relatedResults: [],
    totalRelated: 0,
    latestDiveQuery: '',
    refinedQuery: '',
    followUpLoading: false,
    followUpStreaming: false,
    streamingText: '',
    aiAnswer: '',
    aiSources: [],
    aiLoading: false,
    aiStreaming: false,
    conversationId: null,
    conversationStarted: false,
  });
}

/**
 * Handle search input changes — fetch suggestions.
 */
export function handleInputChange(value) {
  update({ query: value });

  if (!value || value.trim().length < getConfig().suggestions.minChars) {
    update({ suggestions: [], showSuggestions: false });
    return;
  }

  fetchSuggestions(value.trim(), function (results) {
    if (results.length > 0) {
      update({ suggestions: results, showSuggestions: true });
    } else {
      update({ suggestions: [], showSuggestions: false });
    }
  });
}

/**
 * Select an autocomplete suggestion.
 */
export function selectSuggestion(text) {
  update({ query: text, suggestions: [], showSuggestions: false });
  doSearch(text);
}

/**
 * Show/hide suggestions dropdown.
 */
export function showSuggestions() {
  var state = getState();
  if (state.suggestions.length > 0) {
    update({ showSuggestions: true });
  }
}

export function hideSuggestions() {
  setTimeout(function () {
    update({ showSuggestions: false });
  }, 200);
}

/**
 * Clear suggestions immediately (used on search submit, tab switch).
 */
export function clearSuggestions() {
  cancelSuggestions();
  update({ suggestions: [], showSuggestions: false });
}

// ══════════════════════════════════════════════════════
// CHAT VARIANT — used by the chat-first UX
// Reuses the same services/adapter/answerProvider as the search variant.
// Only difference: no keyword search, no related results, no tabs.
// ══════════════════════════════════════════════════════

/**
 * Send a chat message. Handles both first message (starts conversation)
 * and follow-ups (continues conversation).
 * Uses answerProvider for the first message, conversationsService for follow-ups.
 * No keyword search. No related results.
 */
export function doChatMessage(question) {
  if (!question) return;

  var now = Date.now();
  if (now - _lastRequestTime < getConfig().rateLimitMs) return;
  _lastRequestTime = now;

  // Abort any in-progress stream
  abortConversation();
  if (_followUpAbort) { _followUpAbort(); _followUpAbort = null; }

  var state = getState();
  var convId = state.conversationId;
  var isFirstMessage = !convId;

  // Add user message to thread
  update({
    hasSearched: true,
    messages: state.messages.concat([{ role: 'user', text: question }]),
    followUpLoading: true,
    followUpStreaming: false,
    streamingText: '',
  });

  var accumulated = '';
  var streamSources = [];
  var aborted = false;
  _followUpAbort = function () { aborted = true; abortConversation(); };

  // Callbacks — identical for first message and follow-ups
  var callbacks = {
    onMetadata: function (data) {
      if (aborted) return;
      update({ followUpLoading: false, followUpStreaming: true });
      if (data.conversationId) {
        update({ conversationId: data.conversationId, conversationStarted: true });
      }
    },
    onToken: function (content) {
      if (aborted) return;
      accumulated += content;
      update({ followUpLoading: false, followUpStreaming: true, streamingText: accumulated });
    },
    onSources: function (sources) {
      if (aborted) return;
      streamSources = sources;
    },
    onDone: function () {
      if (aborted) return;
      _followUpAbort = null;
      var currentState = getState();
      if (accumulated) {
        update({
          messages: currentState.messages.concat([{ role: 'assistant', text: accumulated, sources: streamSources }]),
          followUpLoading: false,
          followUpStreaming: false,
          streamingText: '',
        });
      } else {
        update({
          messages: currentState.messages.concat([{ role: 'assistant', text: 'I could not find an answer.', sources: [] }]),
          followUpLoading: false,
          followUpStreaming: false,
          streamingText: '',
        });
      }
    },
    onError: function () {
      if (aborted) return;
      var currentState = getState();
      update({
        messages: currentState.messages.concat([{ role: 'assistant', text: 'An error occurred.', sources: [] }]),
        followUpLoading: false,
        followUpStreaming: false,
        streamingText: '',
      });
    },
  };

  // First message: use answerProvider (same abstraction as search variant)
  // Follow-ups: use conversationsService directly
  if (isFirstMessage) {
    answerProvider.getInitialAnswer(question, callbacks);
  } else {
    conversationsService.streamConversation(question, convId, callbacks);
  }
}

/**
 * Reset chat conversation — clear all messages, start fresh.
 */
export function resetChat() {
  abortConversation();
  if (_followUpAbort) { _followUpAbort(); _followUpAbort = null; }
  update({
    hasSearched: false,
    messages: [],
    conversationId: null,
    conversationStarted: false,
    followUpLoading: false,
    followUpStreaming: false,
    streamingText: '',
  });
}
