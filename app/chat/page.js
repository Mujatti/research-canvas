/**
 * app/chat/page.js — Chat-first variant
 *
 * A conversation-only UX. No landing hero, no keyword results, no tabs.
 * The user opens the page, types a question, and gets streaming AI answers.
 *
 * REUSES EVERYTHING from the search variant:
 *   - config system (loadConfig, getConfig)
 *   - demo session system (?demo=SESSION_ID)
 *   - conversationsAdapter (all fetch calls)
 *   - conversationsService (normalization)
 *   - answerProvider (first message goes through the provider abstraction)
 *   - parseConversationStream (SSE parsing)
 *   - orchestrator (doChatMessage, resetChat)
 *   - existing dumb components (ConversationThread, FollowUpInput, LoadingDots)
 *
 * DOES NOT USE:
 *   - Landing, ModeToggle, ExplorationBanner, RelatedResults
 *   - keyword search service
 *   - suggestions service
 *   - doSearch(), switchToSearch(), switchToDive()
 *
 * Test URLs:
 *   /chat                         → default demo, chat mode
 *   /chat?demo=acme-2026          → Acme Corp, chat mode
 *   /chat?demo=bigretail-q1       → BigRetail, chat mode
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { loadConfig } from '../config/app.config';
import { resolveConfigFromURL } from '../config/demoSessionLoader';
import * as orchestrator from '../orchestration/searchOrchestrator';

// Reused components (same as search variant)
import ConversationThread from '../components/ConversationThread';
import FollowUpInput from '../components/FollowUpInput';
import LoadingDots from '../components/LoadingDots';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function ChatPage() {
  var [configReady, setConfigReady] = useState(false);
  var configRef = useRef(null);

  useEffect(function () {
    if (configRef.current) return;
    resolveConfigFromURL().then(function (resolved) {
      configRef.current = loadConfig(resolved.config);
      setConfigReady(true);
    });
  }, []);

  if (!configReady || !configRef.current) {
    return (
      <main className="px-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <LoadingDots />
        </div>
      </main>
    );
  }

  return <ChatApp config={configRef.current} />;
}

function ChatApp({ config }) {
  var labels = config.labels;
  var theme = config.theme;

  // Apply theme
  useEffect(function () {
    if (typeof document === 'undefined') return;
    var root = document.documentElement;
    if (theme.accentColor) root.style.setProperty('--accent', theme.accentColor);
    if (theme.bgColor) root.style.setProperty('--bg', theme.bgColor);
    if (theme.textColor) root.style.setProperty('--text', theme.textColor);
    if (theme.fontFamily) root.style.setProperty('--font', theme.fontFamily);
    if (theme.borderRadius) root.style.setProperty('--radius', theme.borderRadius);
  }, [theme]);

  // React state
  var [state, setState] = useState(orchestrator.INITIAL_STATE);
  var stateRef = useRef(state);
  stateRef.current = state;
  var getState = useCallback(function () { return stateRef.current; }, []);

  var initialized = useRef(false);
  if (!initialized.current) {
    orchestrator.init(setState, getState);
    initialized.current = true;
  }

  var logoUrl = theme.logoUrl || '/add_search_logo.png';
  var hasMessages = state.messages.length > 0 || state.followUpLoading || state.followUpStreaming;

  return (
    <main className="px-page">
      {/* ── Compact header ── */}
      <header className="px-header">
        <a href="/" className="px-logo">
          <img src={logoUrl} alt="Logo" className="px-logo-img" />
        </a>
        {hasMessages && (
          <button className="px-dive-reset" onClick={orchestrator.resetChat} style={{ marginLeft: 'auto' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            {labels.resetButtonText || 'New conversation'}
          </button>
        )}
      </header>

      {/* ── Empty state: show welcome + input ── */}
      {!hasMessages && (
        <div className="px-chat-welcome">
          <div className="px-chat-welcome-inner">
            <h1 className="px-chat-title">{labels.heroTitle || 'Ask anything'}</h1>
            <p className="px-chat-subtitle">{labels.heroSubtitle || ''}</p>
          </div>
        </div>
      )}

      {/* ── Conversation thread ── */}
      {hasMessages && (
        <div className="px-chat-thread">
          <ConversationThread
            messages={state.messages}
            isLoading={state.followUpLoading}
            isStreaming={state.followUpStreaming}
            streamingText={state.streamingText}
            streamingLabel={labels.aiAnswerStreaming}
          />
        </div>
      )}

      {/* ── Input (always visible) ── */}
      <div className="px-chat-input-wrap">
        <FollowUpInput
          onSubmit={orchestrator.doChatMessage}
          isDisabled={state.followUpLoading || state.followUpStreaming}
          hasConversation={state.conversationStarted}
          followUpPlaceholder={labels.followUpPlaceholder || 'Ask a question...'}
          freshPlaceholder={labels.searchPlaceholder || 'Ask a question...'}
          maxLength={config.maxFollowUpLength}
        />
      </div>

      {/* ── Footer ── */}
      <footer className="px-footer">
        <p>
          {labels.footerText}{' '}
          <a href={labels.footerBrandUrl} target="_blank" rel="noopener noreferrer">{labels.footerBrand}</a>
          {' '}{labels.footerTagline}
        </p>
      </footer>
    </main>
  );
}
