'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { loadConfig } from './config/app.config';
import { resolveConfigFromURL } from './config/demoSessionLoader';
import * as orchestrator from './orchestration/searchOrchestrator';
import Header from './components/Header';
import Landing from './components/Landing';
import AiAnswerCard from './components/AiAnswerCard';
import ConversationThread from './components/ConversationThread';
import FollowUpInput from './components/FollowUpInput';
import LoadingDots from './components/LoadingDots';
import MarkdownRenderer from './components/MarkdownRenderer';

var ACTIONS = [
  { key: 'summary', title: 'Summarize findings', group: 'Analysis' },
  { key: 'findings', title: 'Extract key findings', group: 'Analysis' },
  { key: 'risks', title: 'Identify risks and gaps', group: 'Analysis' },
  { key: 'questions', title: 'Surface open questions', group: 'Analysis' },
  { key: 'compare', title: 'Compare selected sources', group: 'Comparison' },
  { key: 'contradictions', title: 'Highlight contradictions', group: 'Comparison' },
  { key: 'nextSteps', title: 'Recommend next steps', group: 'Strategy' },
  { key: 'conclusion', title: 'Generate conclusion', group: 'Strategy' },
];

export default function HomePage() {
  var [configReady, setConfigReady] = useState(false);
  var configRef = useRef(null);
  var sessionRef = useRef(null);

  useEffect(function () {
    if (configRef.current) return;
    resolveConfigFromURL().then(function (resolved) {
      var merged = Object.assign({}, resolved.config || {}, {
        theme: Object.assign({
          accentColor: '#c2410c',
          bgColor: '#f6f8fb',
          textColor: '#0f172a',
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          borderRadius: '16px',
        }, (resolved.config && resolved.config.theme) || {}),
      });
      configRef.current = loadConfig(merged);
      sessionRef.current = resolved;
      setConfigReady(true);
    });
  }, []);

  if (!configReady || !configRef.current) {
    return <main className="px-page"><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><LoadingDots /></div></main>;
  }

  return <ResearchCanvas config={configRef.current} session={sessionRef.current} />;
}

function ResearchCanvas({ config }) {
  var labels = config.labels;
  var theme = config.theme;
  useEffect(function () {
    if (typeof document === 'undefined') return;
    var root = document.documentElement;
    if (theme.accentColor) root.style.setProperty('--accent', theme.accentColor);
    if (theme.bgColor) root.style.setProperty('--bg', theme.bgColor);
    if (theme.textColor) root.style.setProperty('--text', theme.textColor);
    if (theme.fontFamily) root.style.setProperty('--font', theme.fontFamily);
    if (theme.borderRadius) root.style.setProperty('--radius', theme.borderRadius);
  }, [theme]);

  var [state, setState] = useState(orchestrator.INITIAL_STATE);
  var stateRef = useRef(state);
  stateRef.current = state;
  var getState = useCallback(function () { return stateRef.current; }, []);
  var initialized = useRef(false);
  if (!initialized.current) {
    orchestrator.init(setState, getState);
    initialized.current = true;
  }

  var autoSearched = useRef(false);
  useEffect(function () {
    if (config.initialQuery && !autoSearched.current) {
      autoSearched.current = true;
      orchestrator.doSearch(config.initialQuery);
    }
  }, [config.initialQuery]);

  var [selectedEvidence, setSelectedEvidence] = useState([]);
  var [notes, setNotes] = useState('');
  var [canvasBlocks, setCanvasBlocks] = useState({
    summary: '',
    findings: '',
    risks: '',
    questions: '',
    compare: '',
    contradictions: '',
    nextSteps: '',
    conclusion: '',
  });
  var [canvasSources, setCanvasSources] = useState({});
  var [pinnedSources, setPinnedSources] = useState([]);
  var [pendingAction, setPendingAction] = useState(null);
  var [researchPulse, setResearchPulse] = useState('Research Brief');

  var lastAssistantCount = useRef(0);
  var lastInitialAnswer = useRef('');

  useEffect(function () {
    if (!state.hasSearched) {
      setSelectedEvidence([]);
      setPinnedSources([]);
      setNotes('');
      setCanvasBlocks({ summary: '', findings: '', risks: '', questions: '', compare: '', contradictions: '', nextSteps: '', conclusion: '' });
      setCanvasSources({});
      setPendingAction(null);
      setResearchPulse('Research Brief');
      lastAssistantCount.current = 0;
      lastInitialAnswer.current = '';
      return;
    }

    if (state.aiAnswer && !state.aiStreaming && state.aiAnswer !== lastInitialAnswer.current) {
      lastInitialAnswer.current = state.aiAnswer;
      setCanvasBlocks(function (prev) { return Object.assign({}, prev, { summary: state.aiAnswer }); });
      setCanvasSources(function (prev) { return Object.assign({}, prev, { summary: state.aiSources || [] }); });
    }
  }, [state.hasSearched, state.aiAnswer, state.aiStreaming, state.aiSources]);

  useEffect(function () {
    var assistantCount = state.messages.filter(function (m) { return m.role === 'assistant'; }).length;
    if (assistantCount <= lastAssistantCount.current) return;
    lastAssistantCount.current = assistantCount;
    if (!pendingAction) return;
    var latest = null;
    for (var i = state.messages.length - 1; i >= 0; i--) {
      if (state.messages[i].role === 'assistant') { latest = state.messages[i]; break; }
    }
    if (!latest) return;
    setCanvasBlocks(function (prev) { return Object.assign({}, prev, { [pendingAction]: latest.text }); });
    setCanvasSources(function (prev) { return Object.assign({}, prev, { [pendingAction]: latest.sources || [] }); });
    setResearchPulse('Updated ' + actionTitle(pendingAction));
    setPendingAction(null);
  }, [state.messages, pendingAction]);

  var logoUrl = theme.logoUrl || '/add_search_logo.png';
  var searchProps = {
    query: state.query,
    suggestions: state.suggestions,
    showSuggestions: state.showSuggestions,
    onInputChange: orchestrator.handleInputChange,
    onSubmit: function () { orchestrator.clearSuggestions(); orchestrator.doSearch(state.query.trim()); },
    onSelectSuggestion: orchestrator.selectSuggestion,
    onFocus: orchestrator.showSuggestions,
    onBlur: orchestrator.hideSuggestions,
  };

  var evidenceCandidates = useMemo(function () {
    var map = {};
    function add(item, kind) {
      if (!item || !item.url) return;
      if (map[item.url]) return;
      map[item.url] = { title: item.title || item.url, url: item.url, kind: kind || 'source' };
    }
    (state.aiSources || []).forEach(function (s) { add(s, 'brief'); });
    (state.relatedResults || []).forEach(function (r) { add({ title: r.title, url: r.url }, 'related'); });
    return Object.keys(map).map(function (url) { return map[url]; });
  }, [state.aiSources, state.relatedResults]);

  function toggleSource(src) {
    setPinnedSources(function (prev) {
      var exists = prev.some(function (p) { return p.url === src.url; });
      if (exists) return prev.filter(function (p) { return p.url !== src.url; });
      return prev.concat([src]);
    });
  }

  function toggleSelectSource(src) {
    setSelectedEvidence(function (prev) {
      var exists = prev.some(function (p) { return p.url === src.url; });
      if (exists) return prev.filter(function (p) { return p.url !== src.url; });
      return prev.concat([src]);
    });
  }

  function promptForAction(key) {
    var selected = selectedEvidence.length > 0 ? selectedEvidence : pinnedSources;
    var sourceLine = selected.length > 0
      ? 'Focus especially on these sources: ' + selected.map(function (s) { return s.title; }).join('; ') + '.'
      : 'Use the current search results, research brief, and conversation context.';

    var prompts = {
      summary: 'Create an executive summary of the current research. ' + sourceLine + ' Use crisp bullets and a short takeaway.',
      findings: 'Extract the key findings from the current research. ' + sourceLine + ' Group findings by theme.',
      risks: 'Identify risks, uncertainties, blind spots, and missing evidence. ' + sourceLine,
      questions: 'Surface the most important open questions that require further validation. ' + sourceLine,
      compare: 'Compare the selected sources. Highlight areas of agreement, disagreement, and nuance. ' + sourceLine,
      contradictions: 'Highlight contradictions or tensions across the sources and explain why they matter. ' + sourceLine,
      nextSteps: 'Recommend the next best actions for a research team based on the current evidence. ' + sourceLine,
      conclusion: 'Generate a reasoned conclusion based on the current research. Include confidence level and caveats. ' + sourceLine,
    };
    return prompts[key] || ('Help analyze the current research. ' + sourceLine);
  }

  function runCanvasAction(key) {
    if (!state.conversationStarted && !state.aiAnswer) return;
    setPendingAction(key);
    setResearchPulse('Running ' + actionTitle(key));
    orchestrator.doFollowUp(promptForAction(key));
  }

  function resetWorkspace() {
    setSelectedEvidence([]);
    setPinnedSources([]);
    setCanvasBlocks({ summary: '', findings: '', risks: '', questions: '', compare: '', contradictions: '', nextSteps: '', conclusion: '' });
    setCanvasSources({});
    setNotes('');
    setPendingAction(null);
    setResearchPulse('Research Brief');
    orchestrator.resetAll();
  }

  return (
    <main className="px-page rc-page">
      <Header hasSearched={state.hasSearched} logoUrl={logoUrl} placeholder={labels.headerSearchPlaceholder} {...searchProps} />

      {!state.hasSearched && (
        <div className="rc-landing-shell">
          <Landing title={labels.heroTitle} subtitle={labels.heroSubtitle} placeholder={labels.searchPlaceholder} buttonText={labels.searchButtonText} {...searchProps} />
          <div className="rc-prompt-row">
            {['Customer retention signals', 'Competitive landscape for site search', 'Summarize documentation quality gaps', 'What themes appear across support content?'].map(function (q) {
              return <button key={q} className="rc-prompt-chip" onClick={function(){ orchestrator.handleInputChange(q); orchestrator.doSearch(q); }}>{q}</button>;
            })}
          </div>
        </div>
      )}

      {state.hasSearched && (
        <div className="rc-shell">
          <div className="rc-topbar">
            <div>
              <p className="rc-eyebrow">Research Canvas</p>
              <h1 className="rc-title">{state.query}</h1>
            </div>
            <div className="rc-topbar-actions">
              <div className="rc-status-pill">{researchPulse}</div>
              <button className="rc-ghost-btn" onClick={resetWorkspace}>Reset canvas</button>
            </div>
          </div>

          <div className="rc-grid">
            <aside className="rc-panel rc-evidence-panel">
              <div className="rc-panel-header">
                <div>
                  <p className="rc-section-kicker">Evidence</p>
                  <h2>Pinned sources</h2>
                </div>
                <span className="rc-count-badge">{pinnedSources.length}</span>
              </div>
              {pinnedSources.length === 0 ? <p className="rc-empty-copy">Pin sources from the evidence list to build a curated set for comparison and conclusions.</p> : (
                <div className="rc-source-list">{pinnedSources.map(function (src) {
                  return <div key={src.url} className="rc-source-item"><div><p className="rc-source-kind">Pinned {src.kind}</p><a href={src.url} target="_blank" rel="noopener noreferrer" className="rc-source-link">{src.title}</a></div><button className="rc-mini-btn" onClick={function(){ toggleSource(src); }}>Remove</button></div>;
                })}</div>
              )}

              <div className="rc-divider" />
              <div className="rc-panel-header rc-tight"><div><p className="rc-section-kicker">Available evidence</p><h2>Source shelf</h2></div><span className="rc-count-badge">{evidenceCandidates.length}</span></div>
              <div className="rc-source-list">
                {evidenceCandidates.length === 0 ? <p className="rc-empty-copy">Sources from the research brief and related results will appear here.</p> : evidenceCandidates.map(function (src) {
                  var selected = selectedEvidence.some(function (s) { return s.url === src.url; });
                  var pinned = pinnedSources.some(function (s) { return s.url === src.url; });
                  return (
                    <div key={src.url} className={'rc-source-item' + (selected ? ' is-selected' : '')}>
                      <div>
                        <p className="rc-source-kind">{src.kind === 'brief' ? 'Brief source' : 'Related result'}</p>
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="rc-source-link">{src.title}</a>
                      </div>
                      <div className="rc-source-actions">
                        <button className="rc-mini-btn" onClick={function(){ toggleSelectSource(src); }}>{selected ? 'Selected' : 'Select'}</button>
                        <button className="rc-mini-btn" onClick={function(){ toggleSource(src); }}>{pinned ? 'Pinned' : 'Pin'}</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rc-divider" />
              <div className="rc-panel-header rc-tight"><div><p className="rc-section-kicker">Live search</p><h2>Search results</h2></div></div>
              <div className="rc-results-toolbar"><div id={config.containerIds.sortBy} className="px-sortby-container" /></div>
              <div id={config.containerIds.results} className="rc-results-container" />
              <div id={config.containerIds.pagination} className="px-pagination-container" />
            </aside>

            <section className="rc-panel rc-canvas-panel">
              <div className="rc-panel-header"><div><p className="rc-section-kicker">Research brief</p><h2>Decision-ready canvas</h2></div><span className="rc-count-badge">{selectedEvidence.length} selected</span></div>

              <AiAnswerCard
                answer={state.aiAnswer}
                sources={state.aiSources}
                isStreaming={state.aiStreaming}
                isThinking={state.aiLoading && !state.aiStreaming && !state.aiAnswer}
                label={'AI Answers'}
                query={state.query}
                streamingLabel={'Thinking...'}
                sourcesLabel={'Sources'}
              />

              <div className="rc-cards-grid">
                <CanvasCard title="Summary" subtitle="What the evidence currently says" content={canvasBlocks.summary} sources={canvasSources.summary} pending={pendingAction === 'summary'} />
                <CanvasCard title="Key findings" subtitle="Themes, facts, and signals" content={canvasBlocks.findings} sources={canvasSources.findings} pending={pendingAction === 'findings'} />
                <CanvasCard title="Risks / gaps" subtitle="What is uncertain or missing" content={canvasBlocks.risks} sources={canvasSources.risks} pending={pendingAction === 'risks'} />
                <CanvasCard title="Open questions" subtitle="What needs validation next" content={canvasBlocks.questions} sources={canvasSources.questions} pending={pendingAction === 'questions'} />
                <CanvasCard title="Comparison" subtitle="How selected sources differ" content={canvasBlocks.compare || canvasBlocks.contradictions} sources={canvasSources.compare || canvasSources.contradictions} pending={pendingAction === 'compare' || pendingAction === 'contradictions'} wide={true} />
                <CanvasCard title="Recommendation" subtitle="A path forward" content={canvasBlocks.nextSteps || canvasBlocks.conclusion} sources={canvasSources.nextSteps || canvasSources.conclusion} pending={pendingAction === 'nextSteps' || pendingAction === 'conclusion'} wide={true} />
              </div>

              <div className="rc-notes-card">
                <div className="rc-panel-header rc-tight"><div><p className="rc-section-kicker">Working memory</p><h2>Research notes</h2></div></div>
                <textarea className="rc-notes-input" value={notes} onChange={function(e){ setNotes(e.target.value); }} placeholder="Capture observations, hypotheses, objections, or decisions here..." />
              </div>

              <div className="rc-log-card">
                <div className="rc-panel-header rc-tight"><div><p className="rc-section-kicker">Investigation log</p><h2>Conversation</h2></div></div>
                <ConversationThread messages={state.messages} isLoading={state.followUpLoading} isStreaming={state.followUpStreaming} streamingText={state.streamingText} streamingLabel={'Thinking...'} sourcesLabel={'Sources'} />
              </div>
            </section>

            <aside className="rc-panel rc-actions-panel">
              <div className="rc-panel-header"><div><p className="rc-section-kicker">Action stack</p><h2>Run analysis</h2></div></div>
              <div className="rc-action-groups">
                {['Analysis', 'Comparison', 'Strategy'].map(function (group) {
                  return (
                    <div key={group} className="rc-action-group">
                      <p className="rc-group-title">{group}</p>
                      {ACTIONS.filter(function (a) { return a.group === group; }).map(function (action) {
                        var disabled = !state.aiAnswer || state.followUpLoading || state.followUpStreaming || (action.key === 'compare' && (selectedEvidence.length + pinnedSources.length) < 2);
                        return <button key={action.key} className="rc-action-btn" disabled={disabled} onClick={function(){ runCanvasAction(action.key); }}><span>{action.title}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>;
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="rc-divider" />
              <div className="rc-panel-header rc-tight"><div><p className="rc-section-kicker">Custom prompt</p><h2>Ask anything</h2></div></div>
              <div className="rc-input-shell">
                <FollowUpInput onSubmit={orchestrator.doFollowUp} isDisabled={state.followUpLoading || state.followUpStreaming} hasConversation={state.conversationStarted} followUpPlaceholder={labels.followUpPlaceholder} freshPlaceholder={labels.freshQuestionPlaceholder} maxLength={config.maxFollowUpLength} />
              </div>

              <div className="rc-divider" />
              <div className="rc-mini-metrics">
                <div className="rc-metric"><span className="rc-metric-label">Pinned</span><strong>{pinnedSources.length}</strong></div>
                <div className="rc-metric"><span className="rc-metric-label">Selected</span><strong>{selectedEvidence.length}</strong></div>
                <div className="rc-metric"><span className="rc-metric-label">Related</span><strong>{state.totalRelated || 0}</strong></div>
              </div>
            </aside>
          </div>

          <footer className="px-footer rc-footer"><p><a href={labels.footerBrandUrl} target="_blank" rel="noopener noreferrer">Powered by AddSearch</a></p></footer>
        </div>
      )}
    </main>
  );
}

function actionTitle(key) {
  var item = ACTIONS.find(function (a) { return a.key === key; });
  return item ? item.title : key;
}

function CanvasCard({ title, subtitle, content, sources, pending, wide }) {
  return (
    <section className={'rc-canvas-card' + (wide ? ' is-wide' : '')}>
      <div className="rc-card-head">
        <div>
          <p className="rc-card-kicker">{subtitle}</p>
          <h3>{title}</h3>
        </div>
        {pending && <span className="rc-status-pill">Thinking...</span>}
      </div>
      {content ? <MarkdownRenderer content={content} /> : <p className="rc-empty-copy">Run an action to populate this block.</p>}
      {sources && sources.length > 0 && <div className="px-sources"><p className="px-sources-label">Sources</p><div className="px-sources-row">{sources.map(function (s, i) { return <a key={i} className="px-source" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>; })}</div></div>}
    </section>
  );
}
