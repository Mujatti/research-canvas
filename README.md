# AI Search Experience — Starter App

Modular starter app: AddSearch Keyword Search + AI Conversations with streaming.
Per-prospect demos via API — no app code edits per customer.

## Quick Start

```
npm install && npm run dev
```

Deploy: push to GitHub → import in Vercel → set `NEXT_PUBLIC_ADDSEARCH_SITEKEY` env var.

## Creating a Prospect Demo

**Step 1:** Open `data/demo-sessions.json` and add an entry:

```json
"prospect-name": {
  "_meta": {
    "customerName": "Prospect Inc",
    "createdBy": "you@addsearch.com",
    "createdAt": "2026-03-26",
    "expiresAt": "2026-06-26",
    "active": true
  },
  "siteKey": "THEIR_SITE_KEY",
  "labels": {
    "heroTitle": "Search Prospect Inc",
    "aiAnswerLabel": "Prospect AI"
  },
  "theme": {
    "accentColor": "#2563eb"
  }
}
```

**Step 2:** Deploy.

**Step 3:** Share the URL:
```
https://your-app.vercel.app/?demo=prospect-name
```

Only `siteKey` is required. Everything else falls back to defaults.

**Future:** Replace `data/demo-sessions.json` with a database or admin UI. The API route interface stays the same. The client never changes.

## Test URLs

```
/                          → Default demo
/?demo=acme-2026           → Acme Corp (purple, docs)
/?demo=bigretail-q1        → BigRetail (blue, products)
/?demo=stateuni-demo       → State University (green, campus)
/?config=default           → Dev: config registry
```

## How It Works

```
Browser: /?demo=acme-2026
  → page.js calls resolveConfigFromURL()
    → demoSessionLoader fetches /api/demo-sessions/acme-2026
      → API route reads data/demo-sessions.json
      → validates _meta.active and _meta.expiresAt
      → returns session JSON (or 404/410)
    → loader strips _meta, returns app config
    → loadConfig() merges onto defaults
  → app renders with customer branding, siteKey, filters, theme
```

## Config Resolution Order

| Priority | URL param | Source | Path |
|---|---|---|---|
| 1 | `?demo=ID` | API route | `GET /api/demo-sessions/{id}` → `data/demo-sessions.json` |
| 2 | `?config=KEY` | Config registry | `configRegistry.js` (dev/testing) |
| 3 | (none) | Defaults | `app.config.js` + env var |

## Session Config Contract

```json
{
  "_meta": {
    "customerName": "string (display only)",
    "createdBy": "string (tracking)",
    "createdAt": "YYYY-MM-DD",
    "expiresAt": "YYYY-MM-DD (optional, auto-expires)",
    "active": true,
    "notes": "optional"
  },

  "siteKey": "REQUIRED",
  "answerProvider": "conversations (or future: aiAnswers)",
  "initialQuery": "optional auto-search",
  "labels": {},
  "theme": {},
  "filterOptions": {},
  "sortOptions": []
}
```

## File Structure

```
data/
  demo-sessions.json              ← All session configs (editable data, not app code)

app/
  api/
    demo-sessions/[id]/route.js   ← API: reads data file, validates, returns JSON
    proxy/                        ← Existing conversation/refine proxies
  config/
    app.config.js                 ← Defaults + loadConfig()
    demoSessionLoader.js          ← Fetches from API, falls back to registry
    configRegistry.js             ← Dev/testing only
  services/                       ← AI Conversations adapter/service/parser
  orchestration/                  ← Business logic
  components/                     ← Dumb UI
  page.js                         ← Async config load → render
```

## Architecture Boundaries (unchanged)

- All AI Conversations API calls → `conversationsAdapter.js` only
- No raw API shapes outside `conversationsService.js`
- `answerProvider.js` abstracts initial answer source
- UI components receive labels as props, never import config
- Session loading is isolated in `demoSessionLoader.js` + API route

## Future Evolution

| Current | Next step |
|---|---|
| `data/demo-sessions.json` | Vercel KV, database, or external API |
| Edit JSON + deploy | Admin UI writes to database |
| `answerProvider: 'conversations'` | Add `'aiAnswers'` provider |
| API route reads file | API route reads database |


## Research Canvas variant

This variant supports runtime index overrides via `/?site_key=YOUR_SITE_KEY`.
