/* أملآ — عامل الخدمة: عمل بدون إنترنت مع وصول التحديثات فور توفرها */
const CACHE = "amalan-v3";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  /* الصفحة نفسها: الشبكة أولاً (تحديثات فورية) ثم الكاش عند الانقطاع */
  if (url.origin === location.origin && (url.pathname === "/" || url.pathname.endsWith("index.html"))) {
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put("./index.html", cp));
        return r;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  /* الخطوط والأصول الثابتة: الكاش أولاً */
  if (url.origin === location.origin ||
      url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com") ||
      url.hostname.includes("cdnjs.cloudflare.com") ||
      url.hostname.includes("cdn.jsdelivr.net")) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return r;
      }).catch(() => hit))
    );
  }
  /* البقية (تلاوات، تفاسير، مواقيت): شبكة مباشرة */
});
