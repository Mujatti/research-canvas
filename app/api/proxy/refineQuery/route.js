import { NextResponse } from 'next/server';

const ADDSEARCH_API_BASE = 'https://api.addsearch.com/v2/indices';
const DEFAULT_SITE_KEY = '1bed1ffde465fddba2a53ad3ce69e6c2';

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, conversationId, siteKey: runtimeSiteKey } = body;
    if (!question || typeof question !== 'string') return NextResponse.json({ error: 'Missing "question" field.' }, { status: 400 });
    if (!conversationId) return NextResponse.json({ error: 'Missing "conversationId" — needed for refine-query.' }, { status: 400 });

    const siteKey = runtimeSiteKey || process.env.NEXT_PUBLIC_ADDSEARCH_SITEKEY || DEFAULT_SITE_KEY;
    const url = `${ADDSEARCH_API_BASE}/${siteKey}/conversations/${conversationId}/refine-query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `AddSearch API returned ${response.status}`, details: errText }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json({ refinedQuery: data.refined_query || '' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.', details: err.message }, { status: 500 });
  }
}
