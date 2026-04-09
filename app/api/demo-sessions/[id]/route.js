/**
 * app/api/demo-sessions/[id]/route.js
 *
 * API route to fetch a demo session config by ID.
 *
 * GET /api/demo-sessions/acme-2026
 *   → 200 { session config JSON }
 *   → 404 { error: 'Session not found' }
 *   → 410 { error: 'Session expired or inactive' }
 *
 * DATA SOURCE:
 *   Currently reads from /data/demo-sessions.json (a single JSON file).
 *   Future: replace with database query, KV store, or external API.
 *   The client-side demoSessionLoader does not change either way.
 *
 * ADDING A NEW PROSPECT DEMO:
 *   1. Edit /data/demo-sessions.json — add a new key with the session config
 *   2. Redeploy (or if using a writable data source, no redeploy needed)
 *   3. Share URL: /?demo=new-session-id
 *
 * Note: On Vercel, /data/ is bundled at build time and read-only at runtime.
 * For true no-deploy session creation, replace this with Vercel KV, a database,
 * or an external config API. The API route interface stays the same.
 */

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Cache the parsed JSON in memory (per-instance, cleared on cold start)
var _sessionsCache = null;

async function loadSessions() {
  if (_sessionsCache) return _sessionsCache;

  try {
    var filePath = path.join(process.cwd(), 'data', 'demo-sessions.json');
    var raw = await fs.readFile(filePath, 'utf-8');
    _sessionsCache = JSON.parse(raw);
    return _sessionsCache;
  } catch (err) {
    console.error('[DemoSessions API] Failed to read sessions file:', err.message);
    return {};
  }
}

export async function GET(request, { params }) {
  var id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
  }

  var sessions = await loadSessions();
  var session = sessions[id];

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found: ' + id },
      { status: 404 }
    );
  }

  // Check active/expired
  if (session._meta) {
    if (session._meta.active === false) {
      return NextResponse.json(
        { error: 'Session inactive: ' + id },
        { status: 410 }
      );
    }
    if (session._meta.expiresAt) {
      if (new Date(session._meta.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: 'Session expired: ' + id },
          { status: 410 }
        );
      }
    }
  }

  // Return the full session (client-side loader strips _meta)
  return NextResponse.json(session);
}
