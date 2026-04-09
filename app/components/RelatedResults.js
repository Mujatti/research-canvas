/**
 * components/RelatedResults.js
 * Dumb component. Headline from props. Never imports config.
 */
'use client';

export default function RelatedResults({ results, totalHits, headline, onViewAll }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="px-related">
      <p className="px-related-label">{headline || 'Related Search Results'}</p>
      <div className="px-related-grid">
        {results.map(function (r, i) {
          return (
            <a key={i} className="px-related-card" href={r.url} target="_blank" rel="noopener noreferrer">
              {r.thumbnail && (
                <div className="px-related-thumb">
                  <img src={r.thumbnail} alt="" onError={function (e) { e.target.style.display = 'none'; }} />
                </div>
              )}
              <span className="px-related-title">{r.title}</span>
            </a>
          );
        })}
        <button className="px-related-card px-related-total" onClick={onViewAll}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {totalHits > 0 && <span>+{totalHits}</span>}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}
