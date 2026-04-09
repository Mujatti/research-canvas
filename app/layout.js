/**
 * app/layout.js
 * Root layout: loads Google Fonts and AddSearch CDN scripts site-wide.
 * Edit: Update <title> or meta description for your own branding.
 */
import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Search + AI Answers Demo — AddSearch',
  description:
    'Try AddSearch AI Answers and AI Conversations: instant answers powered by your own content.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts – DM Serif Display (display) + Plus Jakarta Sans (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* AddSearch Search UI Library CSS (for styled search results) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/addsearch-search-ui@0.10/dist/addsearch-search-ui.min.css"
        />
      </head>

      <body>
        {children}

        {/* ── AddSearch CDN Scripts ────────────────────────────
            Loaded after body so they don't block rendering.
            Docs: https://www.addsearch.com/docs/
        ──────────────────────────────────────────────────── */}
        {/* AI Answers requires JS Client v1.2+ and Search UI v0.10+ */}
        <Script
          src="https://cdn.jsdelivr.net/npm/addsearch-js-client@1.2/dist/addsearch-js-client.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/addsearch-search-ui@0.10/dist/addsearch-search-ui.min.js"
          strategy="beforeInteractive"
        />
        {/* marked.js — lightweight Markdown parser for AI answer rendering */}
        <Script
          src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
