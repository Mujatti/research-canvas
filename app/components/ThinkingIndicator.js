'use client';

export default function ThinkingIndicator({ label, compact }) {
  return (
    <div className={compact ? 'px-thinking px-thinking-compact' : 'px-thinking'}>
      <span className="px-thinking-spinner" aria-hidden="true" />
      <span>{label || 'Thinking...'}</span>
    </div>
  );
}
