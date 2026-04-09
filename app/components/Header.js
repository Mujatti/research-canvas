/**
 * components/Header.js
 * Dumb component. All text/URLs from props. Never imports config.
 */
'use client';

import AutocompleteDropdown from './AutocompleteDropdown';

export default function Header({
  hasSearched, logoUrl, placeholder,
  query, suggestions, showSuggestions,
  onInputChange, onSubmit, onSelectSuggestion, onFocus, onBlur,
}) {
  function handleSubmit(e) { e.preventDefault(); onSubmit(); }

  return (
    <header className="px-header">
      <a href="/" className="px-logo">
        <img src={logoUrl} alt="Logo" className="px-logo-img" />
      </a>
      {hasSearched && (
        <form className="px-header-search" onSubmit={handleSubmit}>
          <input type="text" value={query} onChange={function (e) { onInputChange(e.target.value); }}
            onFocus={onFocus} onBlur={onBlur} placeholder={placeholder}
            className="px-header-input" autoComplete="off" />
          <button type="submit" className="px-header-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <AutocompleteDropdown suggestions={suggestions} show={showSuggestions} onSelect={onSelectSuggestion} />
        </form>
      )}
    </header>
  );
}
