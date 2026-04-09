'use client';

import MarkdownRenderer from './MarkdownRenderer';
import SmoothStreamingText from './SmoothStreamingText';
import ThinkingIndicator from './ThinkingIndicator';

export default function AiAnswerCard({ answer, sources, isStreaming, isThinking, label, query, streamingLabel, sourcesLabel, showDiveCta, diveButtonText, onDiveDeeper }) {
  var sourcesText = (sourcesLabel || 'Sources').replace('{count}', (sources || []).length);
  return (
    <div className={'px-answer-card' + (query ? ' px-initial-answer' : '')}>
      <div className="px-answer-label">
        {label || 'Research Brief'}
        {query && <> for: <strong>{query}</strong></>}
        {(isStreaming || isThinking) && <span className="px-streaming-badge">{streamingLabel || 'Thinking...'}</span>}
      </div>
      {isStreaming ? <SmoothStreamingText content={answer} isStreaming={isStreaming} /> : isThinking ? <ThinkingIndicator compact={true} label={streamingLabel || 'Thinking...'} /> : <MarkdownRenderer content={answer} />}
      {!isStreaming && !isThinking && sources && sources.length > 0 && (
        <div className="px-sources">
          <p className="px-sources-label">{sourcesText}</p>
          <div className="px-sources-row">
            {sources.map(function (s, i) { return <a key={i} className="px-source" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>; })}
          </div>
        </div>
      )}
      {showDiveCta && !isStreaming && !isThinking && <button className="px-dive-cta" onClick={onDiveDeeper}>{diveButtonText || 'Open Investigation Log →'}</button>}
    </div>
  );
}
