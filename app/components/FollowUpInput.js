'use client';

import { useState } from 'react';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function FollowUpInput({ onSubmit, isDisabled, hasConversation, followUpPlaceholder, freshPlaceholder, maxLength }) {
  var [value, setValue] = useState('');
  function handleSubmit(e) {
    e.preventDefault();
    var trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSubmit(trimmed);
    setValue('');
  }
  var placeholder = hasConversation ? (followUpPlaceholder || 'Ask a follow-up...') : (freshPlaceholder || 'Ask a question...');
  return (
    <form className="px-followup" onSubmit={handleSubmit}>
      <span className="px-followup-icon"><SearchIcon /></span>
      <input type="text" value={value} onChange={function (e) { setValue(e.target.value); }} placeholder={placeholder} className="px-followup-input" maxLength={maxLength || undefined} />
      <button type="submit" className="px-followup-btn" disabled={isDisabled || !value.trim()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </form>
  );
}
