import { getConfig } from '../config/app.config';

var _abortController = null;

export function fetchConversation(question, conversationId, streaming) {
  abort();
  _abortController = new AbortController();
  var config = getConfig();
  var url = config.proxyUrls.conversations;
  if (streaming) url += (url.includes('?') ? '&' : '?') + 'stream=true';

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question,
      conversationId: conversationId || undefined,
      siteKey: config.siteKey || undefined,
      tags: config.tags || undefined,
    }),
    signal: _abortController.signal,
  });
}

export function fetchRefineQuery(question, conversationId) {
  var config = getConfig();
  return fetch(config.proxyUrls.refineQuery, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: question, conversationId: conversationId, siteKey: config.siteKey || undefined }),
  });
}

export function abort() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}
