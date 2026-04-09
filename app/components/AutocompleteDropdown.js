/**
 * components/AutocompleteDropdown.js
 * Renders autocomplete suggestion list.
 * Dumb component: receives suggestions as props, calls onSelect callback.
 */
'use client';

export default function AutocompleteDropdown({ suggestions, show, onSelect, className }) {
  if (!show || !suggestions || suggestions.length === 0) return null;

  return (
    <div className={'px-autocomplete ' + (className || '')}>
      {suggestions.map(function (s, i) {
        var text = s.value || s;
        return (
          <button
            key={i}
            className="px-autocomplete-item"
            type="button"
            onMouseDown={function () { onSelect(text); }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
