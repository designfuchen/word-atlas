/* Word Atlas offline cache: app shell network-first, media cache-first. */
const VERSION = "atlas-v2";
const SHELL = `${VERSION}-shell`;
const MEDIA = `${VERSION}-media`;
/** Files fetched during install so the very first offline reload works. */
const PRECACHE = ["index.html", "manifest.webmanifest", "atlas/index.json"];

/**
 * On the very first visit the page's JS/CSS are loaded before this worker takes
 * control, so they would never reach the cache. Read the shell HTML here and
 * precache everything it references (plus the fonts its CSS pulls in).
 */
async function precacheShell(cache) {
  const root = new URL("", self.registration.scope);
  const urls = new Set([root.href, ...PRECACHE.map((p) => new URL(p, root).href)]);
  try {
    const res = await fetch(root, { cache: "reload" });
    if (res.ok) {
      const copy = res.clone();
      await cache.put(root.href, res);
      const html = await copy.text();
      for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        try {
          const u = new URL(m[1], root);
          if (u.origin === location.origin) urls.add(u.href);
        } catch {
          /* ignore malformed attribute values */
        }
      }
    }
  } catch {
    /* offline install: the runtime handler fills this in later */
  }
  await Promise.all(
    [...urls].map(async (href) => {
      try {
        const res = await fetch(href, { cache: "reload" });
        if (!res.ok) return;
        const copy = res.clone();
        await cache.put(href, res);
        if (!href.endsWith(".css")) return;
        // Cache the webfonts the stylesheet references, so offline text keeps its type.
        const css = await copy.text();
        await Promise.all(
          [...css.matchAll(/url\(([^)]+)\)/g)].map(async (m) => {
            try {
              const u = new URL(m[1].replace(/["']/g, ""), href);
              if (u.origin !== location.origin) return;
              const font = await fetch(u.href, { cache: "reload" });
              if (font.ok) await cache.put(u.href, font);
            } catch {
              /* optional */
            }
          }),
        );
      } catch {
        /* optional */
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await precacheShell(cache);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Only touch this app's own caches: a sibling PWA on the same origin may
      // use the same Cache Storage.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("atlas-") && !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

/** Drop hashed JS/CSS bundles the freshly cached HTML no longer references. */
async function pruneAssets(cache, pageUrl, res) {
  try {
    if (!(res.headers.get("content-type") || "").includes("text/html")) return;
    const html = await res.text();
    const keep = new Set();
    for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      try {
        keep.add(new URL(m[1], pageUrl).href);
      } catch {
        /* ignore malformed attribute values */
      }
    }
    for (const key of await cache.keys()) {
      const path = new URL(key.url).pathname;
      if (/\/assets\/[^/]+\.(?:js|css)$/.test(path) && !keep.has(key.url)) await cache.delete(key);
    }
  } catch {
    /* pruning is best-effort */
  }
}

const isMedia = (pathname) => /\/atlas\/(?:img|thumb|audio)\//.test(pathname) || /\/sfx\//.test(pathname) || /\/brand\//.test(pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const media = isMedia(url.pathname);
  // <audio> always sends a Range header. Serving a whole cached file for it is
  // fine (the files are small) and lets played audio work offline; other Range
  // requests are left to the network.
  if (req.headers.has("range") && !media) return;

  const isShell = req.mode === "navigate" || url.pathname.endsWith("/index.json");

  if (isShell) {
    event.respondWith(
      (async () => {
        let res;
        try {
          res = await fetch(req);
        } catch {
          const cache = await caches.open(SHELL);
          const hit = (await cache.match(req, { ignoreVary: true })) || (await cache.match(new URL("./", self.registration.scope).href, { ignoreVary: true }));
          return hit || Response.error();
        }
        if (res.ok) {
          // Cache writes must never break the response (quota, private mode, ...).
          try {
            const copy = res.clone(); // clone before the page consumes the body
            const cache = await caches.open(SHELL);
            await cache.put(req, copy.clone());
            if (req.mode === "navigate") await pruneAssets(cache, req.url, copy);
          } catch {
            /* keep serving the network response */
          }
        }
        return res;
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      // Media is cached by URL only, so a later Range request can hit the entry.
      const key = media ? new Request(url.href) : req;
      const name = media ? MEDIA : SHELL;
      const cache = await caches.open(name);
      // ignoreVary: the shell is fetched by <script crossorigin>, which sends an
      // Origin header, while the cached copy was stored without one.
      const hit = await cache.match(key, { ignoreVary: true });
      if (hit) return hit;
      try {
        // Fetch the whole file for media (even when the browser asked for a range).
        const res = await fetch(media ? key : req);
        if (res.ok && res.type === "basic") {
          try {
            await cache.put(key, res.clone());
            if (media) void trim(MEDIA, 1500);
          } catch {
            /* keep serving the network response */
          }
        }
        return res;
      } catch {
        return (await cache.match(key, { ignoreVary: true })) || Response.error();
      }
    })(),
  );
});
