/**
 * components/Landing.js
 * Dumb component. All text from props. Never imports config.
 */
'use client';

import AutocompleteDropdown from './AutocompleteDropdown';

export default function Landing({
  title, subtitle, placeholder, buttonText,
  query, suggestions, showSuggestions,
  onInputChange, onSubmit, onSelectSuggestion, onFocus, onBlur,
}) {
  function handleSubmit(e) { e.preventDefault(); onSubmit(); }

  return (
    <div className="px-landing">
      <h1 className="px-landing-title">{title}</h1>
      <p className="px-landing-sub">{subtitle}</p>
      <form className="px-landing-form" onSubmit={handleSubmit}>
        <div className="px-search-bar-wrap">
          <div className="px-search-bar">
            <input type="text" value={query} onChange={function (e) { onInputChange(e.target.value); }}
              onFocus={onFocus} onBlur={onBlur} placeholder={placeholder}
              className="px-search-input" autoFocus autoComplete="off" />
            <button type="submit" className="px-search-btn" disabled={!query.trim()}>
              {buttonText}
            </button>
          </div>
          <AutocompleteDropdown suggestions={suggestions} show={showSuggestions}
            onSelect={onSelectSuggestion} className="px-autocomplete-landing" />
        </div>
      </form>
    </div>
  );
}
