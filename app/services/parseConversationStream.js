/**
 * services/parseConversationStream.js
 *
 * Stateless SSE parser for AddSearch AI Conversations streaming responses.
 *
 * Takes a ReadableStream reader and emits typed callbacks.
 * Has NO fetch calls, NO state management, NO API awareness.
 *
 * AddSearch SSE format:
 *   data: {"type": "metadata", "conversation_id": "...", "question_id": "..."}
 *   data: {"type": "token", "content": "text chunk"}
 *   data: {"type": "sources", "sources": [...]}
 *   data: {"type": "token_usage", ...}
 *   data: {"type": "done", "execution_time": ...}
 *
 * Usage:
 *   parseConversationStream(reader, {
 *     onMetadata: (data) => ...,
 *     onToken: (content) => ...,
 *     onSources: (sources) => ...,
 *     onDone: () => ...,
 *     onError: (err) => ...,
 *   });
 */

export function parseConversationStream(reader, callbacks) {
  var decoder = new TextDecoder();
  var buffer = '';

  function processLine(line) {
    var trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) return;

    try {
      var data = JSON.parse(trimmed.substring(6));

      switch (data.type) {
        case 'metadata':
          callbacks.onMetadata && callbacks.onMetadata(data);
          break;
        case 'token':
          if (data.content) {
            callbacks.onToken && callbacks.onToken(data.content);
          }
          break;
        case 'sources':
          callbacks.onSources && callbacks.onSources(data.sources || []);
          break;
        case 'done':
          callbacks.onDone && callbacks.onDone();
          break;
        // token_usage, error, etc. — silently skip
      }
    } catch (e) {
      // Malformed JSON line — skip
    }
  }

  function read() {
    reader.read().then(function (result) {
      if (result.done) {
        // Process remaining buffer
        if (buffer.trim()) {
          var remaining = buffer.split('\n');
          for (var i = 0; i < remaining.length; i++) {
            processLine(remaining[i]);
          }
        }
        // If onDone hasn't been called by the stream itself, call it now
        // (handles cases where the "done" event is missing)
        callbacks.onDone && callbacks.onDone();
        return;
      }

      buffer += decoder.decode(result.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (var i = 0; i < lines.length; i++) {
        processLine(lines[i]);
      }

      read();
    }).catch(function (err) {
      if (err.name !== 'AbortError') {
        callbacks.onError && callbacks.onError(err);
      }
    });
  }

  read();
}
