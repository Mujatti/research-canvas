'use client';

import { useEffect, useRef, useState } from 'react';
import MarkdownRenderer, { sanitizeStreamingMarkdown } from './MarkdownRenderer';

export default function SmoothStreamingText({ content, isStreaming, className }) {
  var targetRef = useRef(content || '');
  var rafRef = useRef(null);
  var [displayed, setDisplayed] = useState('');

  useEffect(function () {
    targetRef.current = content || '';
    if (!isStreaming) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setDisplayed(targetRef.current);
      return;
    }
    function tick() {
      setDisplayed(function (prev) {
        var target = targetRef.current;
        if (prev.length >= target.length) return prev;
        var remaining = target.length - prev.length;
        var step = remaining > 160 ? 14 : remaining > 80 ? 10 : remaining > 32 ? 6 : 3;
        return target.slice(0, prev.length + step);
      });
      rafRef.current = requestAnimationFrame(function(){ if (targetRef.current.length > 0) tick(); });
    }
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    return function(){ if (rafRef.current && !isStreaming) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  }, [content, isStreaming]);

  useEffect(function(){ return function(){ if (rafRef.current) cancelAnimationFrame(rafRef.current); }; }, []);
  if (!displayed) return null;
  return <MarkdownRenderer content={sanitizeStreamingMarkdown(displayed)} className={'px-streaming-text' + (className ? ' ' + className : '')} />;
}
