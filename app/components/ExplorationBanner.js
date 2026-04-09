/**
 * components/ExplorationBanner.js
 * Dumb component. Labels from props. Never imports config.
 */
'use client';

export default function ExplorationBanner({ topic, exploringLabel, resumeLabel, resetLabel, onResume, onReset }) {
  return (
    <div className="px-banner">
      <div className="px-banner-left">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <div>
          <span className="px-banner-label">{exploringLabel}</span>
          <span className="px-banner-topic">{topic}</span>
        </div>
      </div>
      <div className="px-banner-actions">
        <button className="px-banner-resume" onClick={onResume}>{resumeLabel}</button>
        <button className="px-banner-reset" onClick={onReset}>{resetLabel}</button>
      </div>
    </div>
  );
}
