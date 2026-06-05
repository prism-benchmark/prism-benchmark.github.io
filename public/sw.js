// PRISM Markdown for Agents — content-negotiation service worker
//
// GitHub Pages does not run edge functions, so server-side Accept-header
// negotiation is not available. This service worker implements the same
// behaviour in the browser: when a request prefers text/markdown, return
// the pre-built .md companion (if one exists) with the right Content-Type
// and the x-markdown-tokens header. HTML remains the default.
//
// The service worker MUST be served from the same origin. The HTML pages
// register it via <script>navigator.serviceWorker.register('/sw.js')</script>.
//
// Scope: the SW controls the origin root. The demo.html / paper.html
// pages that opt in register it on first load; only those clients get
// the markdown negotiation. Non-browser agents (curl, httpx, fetch()
// without SW support) fall back to HTML at /.md URLs.

const VERSION = "prism-md-v1";
const MD_CACHE = `${VERSION}-md`;
const HTML_CACHE = `${VERSION}-html`;

const MD_MANIFEST = new Set([
  "/",
  "/index.md",
  "/demo",
  "/demo.md",
  "/index.html",
  "/demo/index.html",
]);

// Crude token estimate: ~0.75 tokens per whitespace-separated word is a
// reasonable approximation for English prose. The Cloudflare x-markdown-tokens
// header is informational, so a small inaccuracy is acceptable; clients that
// need exact tokenization can re-count on their side.
function estimateTokens(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words * 0.75));
}

function prefersMarkdown(request) {
  const accept = request.headers.get("accept") || "";
  if (!accept) return false;
  // Parse the Accept header. text/markdown wins if it is explicitly
  // listed with any q-value, OR if it appears with a higher q-value
  // than text/html.
  const parts = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => {
      const [type, ...params] = s.split(";").map((x) => x.trim());
      const qParam = params.find((p) => p.startsWith("q="));
      const q = qParam ? parseFloat(qParam.slice(2)) : 1.0;
      return { type, q: Number.isFinite(q) ? q : 1.0 };
    });

  const md = parts.find((p) => p.type === "text/markdown");
  const html = parts.find(
    (p) => p.type === "text/html" || p.type === "application/xhtml+xml",
  );
  if (!md) return false;
  if (!html) return true;
  return md.q > html.q;
}

// Map a request URL to the .md companion. For directory-style paths
// ("/" and "/demo/"), the companion is "<path>index.md" or
// "<path>.md" respectively. For explicit .html files, drop the .html.
function mdCompanionFor(url) {
  const path = url.pathname;
  if (path.endsWith(".md")) return path; // already markdown
  if (path.endsWith(".html")) {
    return path.replace(/\.html$/, ".md");
  }
  if (path === "/" || path.endsWith("/")) {
    return path.replace(/\/?$/, "/index.md");
  }
  return `${path}.md`;
}

function isNavigation(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("sec-fetch-mode") === "navigate")
  );
}

self.addEventListener("install", (event) => {
  // Pre-cache the markdown companions so the first request is instant.
  event.waitUntil(
    caches
      .open(MD_CACHE)
      .then((cache) =>
        cache.addAll(
          ["/index.md", "/demo.md"].filter((u) => MD_MANIFEST.has(u)),
        ),
      ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Only negotiate for navigations and direct page fetches. Static
  // assets (CSS, JS, images, fonts) always go to the network unchanged.
  const isPageRequest =
    isNavigation(request) ||
    (request.headers.get("accept") || "").includes("text/markdown");

  if (!isPageRequest) return;

  if (!prefersMarkdown(request)) return;

  const companion = mdCompanionFor(url);
  if (!MD_MANIFEST.has(companion) && !MD_MANIFEST.has(url.pathname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(MD_CACHE);
      let response = await cache.match(companion);
      if (!response) {
        try {
          const networkResponse = await fetch(companion, { cache: "no-store" });
          if (!networkResponse.ok) {
            // No companion available — fall through to the HTML.
            return fetch(request);
          }
          await cache.put(companion, networkResponse.clone());
          response = networkResponse;
        } catch (err) {
          // Offline and not cached — fall through.
          return fetch(request);
        }
      }

      const body = await response.text();
      const tokens = estimateTokens(body);
      return new Response(body, {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept",
          "x-markdown-tokens": String(tokens),
          "Content-Signal": "ai-train=no, search=yes, ai-input=no",
          "Cache-Control": "public, max-age=300",
        },
      });
    })(),
  );
});
