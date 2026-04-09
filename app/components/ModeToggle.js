/**
 * components/ModeToggle.js
 * Dumb component. Labels from props. Never imports config.
 */
'use client';

export default function ModeToggle({ activeView, searchLabel, diveLabel, onSwitchToSearch, onSwitchToDive }) {
  return (
    <div className="px-tabs">
      <div className="px-tabs-center">
        <button className={'px-tab' + (activeView === 'search' ? ' px-tab-active' : '')} onClick={onSwitchToSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {searchLabel}
        </button>
        <button className={'px-tab' + (activeView === 'dive' ? ' px-tab-active' : '')} onClick={onSwitchToDive}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {diveLabel}
        </button>
      </div>
    </div>
  );
}
