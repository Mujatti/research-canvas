/**
 * components/LoadingDots.js
 * Shared animated loading dots indicator.
 * Dumb component: no logic, no API calls.
 */
'use client';

export default function LoadingDots({ message }) {
  return (
    <div className="px-loading">
      <div className="px-dots"><span /><span /><span /></div>
      {message && <p>{message}</p>}
    </div>
  );
}
