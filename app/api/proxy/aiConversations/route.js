import { NextResponse } from 'next/server';

const ADDSEARCH_API_BASE = 'https://api.addsearch.com/v2/indices';
const DEFAULT_SITE_KEY = '1bed1ffde465fddba2a53ad3ce69e6c2';

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const streamMode = url.searchParams.get('stream') === 'true';
    const body = await request.json();
    const { question, conversationId, siteKey: runtimeSiteKey, tags } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Missing "question".' }, { status: 400 });
    }

    const siteKey = runtimeSiteKey || process.env.NEXT_PUBLIC_ADDSEARCH_SITEKEY || DEFAULT_SITE_KEY;
    let apiUrl = `${ADDSEARCH_API_BASE}/${siteKey}/conversations`;
    if (conversationId) apiUrl += `/${conversationId}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        streaming: streamMode,
        aiConversations: true,
        tags: Array.isArray(tags) && tags.length > 0 ? tags : ['sender:research-canvas'],
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      return NextResponse.json(
        { error: `API returned ${apiResponse.status}`, details: errText },
        { status: apiResponse.status }
      );
    }

    if (streamMode) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = apiResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                  controller.enqueue(encoder.encode(trimmed + '\n\n'));
                }
              }
            }

            if (buffer.trim().startsWith('data: ')) {
              controller.enqueue(encoder.encode(buffer.trim() + '\n\n'));
            }
          } catch (e) {
            controller.enqueue(
              encoder.encode(`data: {"type":"error","message":"${e.message}"}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await apiResponse.json();
    const inner = data.response || data;
    return NextResponse.json({
      answer: inner.answer || '',
      conversationId: inner.conversation_id || inner.conversationId || conversationId || '',
      sources: Array.isArray(inner.sources)
        ? inner.sources.map((s) => ({ title: s.title || s.url || '', url: s.url || s.link || '' }))
        : [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
