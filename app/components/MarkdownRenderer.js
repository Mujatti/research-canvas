'use client';

import { useMemo } from 'react';

export function sanitizeStreamingMarkdown(md) {
  if (!md) return '';
  if (typeof md !== 'string') md = String(md);
  var out = md;
  if ((out.match(/```/g) || []).length % 2 === 1) out = out.replace(/```([^`]*)$/, '$1');
  if ((out.match(/\*\*/g) || []).length % 2 === 1) { var i = out.lastIndexOf('**'); if (i >= 0) out = out.slice(0, i) + out.slice(i + 2); }
  if ((out.match(/__/g) || []).length % 2 === 1) { var j = out.lastIndexOf('__'); if (j >= 0) out = out.slice(0, j) + out.slice(j + 2); }
  if ((out.match(/`/g) || []).length % 2 === 1) { var k = out.lastIndexOf('`'); if (k >= 0) out = out.slice(0, k) + out.slice(k + 1); }
  return out;
}

function markdownToHtml(md) {
  if (!md) return '';
  if (typeof md !== 'string') {
    if (typeof md === 'object') md = md.answer || md.text || md.summary || md.content || JSON.stringify(md);
    else md = String(md);
  }
  if (!md) return '';

  if (typeof window !== 'undefined' && window.marked) {
    try {
      return window.marked.parse(md, { breaks: true, gfm: true });
    } catch (e) {}
  }

  var html = md;
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/```(\w*)
([\s\S]*?)```/g, function(_, lang, code) { return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`; });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>
?)+/g, function(match){ return `<ul>${match}</ul>`; });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.split(/

+/).map(function(block) {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|li|pre|blockquote|div|table)/.test(block)) return block;
    return `<p>${block.replace(/
/g, '<br/>')}</p>`;
  }).join('
');
  return html;
}

export default function MarkdownRenderer({ content, className }) {
  var html = useMemo(function(){ return markdownToHtml(content); }, [content]);
  if (!content) return null;
  return <div className={`md-content ${className || ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
