const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders }
});
function corsHeaders(origin, env) {
  const allowed = (env.SITE_ORIGIN || "").replace(/\/+$/, "");
  const incoming = (origin || "").replace(/\/+$/, "");
  const headers = { "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Vary": "Origin" };
  if (allowed && incoming === allowed) headers["Access-Control-Allow-Origin"] = incoming;
  return headers;
}
function safePath(path) {
  return typeof path === "string" && /^(data\/products\.json|data\/store-settings\.json|assets\/covers\/[a-zA-Z0-9_-]+\.(jpg|png|webp))$/.test(path);
}
async function githubPut(env, path, contentBase64, message, contentText = null) {
  const api = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  const headers = { "Authorization": `Bearer ${env.GITHUB_TOKEN}`, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "StudyNotes-Publisher", "Content-Type": "application/json" };
  let sha;
  const current = await fetch(`${api}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`, { headers });
  if (current.ok) { const old = await current.json(); sha = old.sha; }
  else if (current.status !== 404) throw new Error(`GitHub read failed for ${path} (${current.status})`);
  const payload = { message, branch: env.GITHUB_BRANCH, content: contentBase64 };
  if (sha) payload.sha = sha;
  const put = await fetch(api, { method: "PUT", headers, body: JSON.stringify(payload) });
  const result = await put.json().catch(() => ({}));
  if (!put.ok) throw new Error(`GitHub write failed for ${path} (${put.status}): ${result.message || "unknown error"}`);
  return result.commit?.sha || null;
}
function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
function validateCatalog(catalog) {
  if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.products)) return "Catalog schema invalid.";
  if (catalog.products.length > 500) return "Too many products.";
  const ids = new Set();
  for (const p of catalog.products) {
    if (!p || typeof p.id !== "string" || !p.id || ids.has(p.id)) return "Missing or duplicate product ID.";
    ids.add(p.id);
    if (typeof p.title !== "string" || !p.title.trim() || typeof p.category !== "string") return `Required fields missing for ${p.id}.`;
    if (!Number.isFinite(Number(p.regularPrice)) || Number(p.regularPrice) < 0) return `Invalid price for ${p.id}.`;
    if (p.offerPrice != null && (!Number.isFinite(Number(p.offerPrice)) || Number(p.offerPrice) < 0 || Number(p.offerPrice) > Number(p.regularPrice))) return `Invalid offer price for ${p.id}.`;
    if (p.cover && !/^assets\/covers\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(p.cover)) return `Invalid cover path for ${p.id}.`;
  }
  return null;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);
    if (request.method === "OPTIONS") {
      if (!cors["Access-Control-Allow-Origin"]) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, message: "StudyNotes publishing service is reachable." }, 200, cors);
    }
    if (url.pathname !== "/publish" || request.method !== "POST") return json({ error: "Not found." }, 404, cors);
    if (!cors["Access-Control-Allow-Origin"]) return json({ error: "Origin not allowed." }, 403);
    if (!env.ADMIN_SECRET || !env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO || !env.GITHUB_BRANCH) {
      return json({ error: "Publishing service is not fully configured." }, 500, cors);
    }
    const auth = request.headers.get("Authorization") || "";
    const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (supplied.length !== env.ADMIN_SECRET.length || !timingSafeEqual(supplied, env.ADMIN_SECRET)) return json({ error: "Unauthorized. Check the admin publishing secret." }, 401, cors);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON body." }, 400, cors); }
    const error = validateCatalog(body.catalog);
    if (error) return json({ error }, 400, cors);
    const assets = Array.isArray(body.assets) ? body.assets : [];
    if (assets.length > 100) return json({ error: "Too many cover assets." }, 400, cors);
    let totalBytes = 0;
    for (const a of assets) {
      if (!a || !safePath(a.path) || !a.path.startsWith("assets/covers/") || typeof a.contentBase64 !== "string") return json({ error: "Invalid cover asset." }, 400, cors);
      totalBytes += a.contentBase64.length;
      if (a.contentBase64.length > 7_000_000) return json({ error: "A cover image is too large." }, 413, cors);
    }
    if (totalBytes > 18_000_000) return json({ error: "Total image payload is too large. Publish fewer/smaller covers at once." }, 413, cors);
    try {
      let lastCommit = null;
      // Images first, then catalog/settings. The catalog should not point at a cover before it exists.
      for (const a of assets) lastCommit = await githubPut(env, a.path, a.contentBase64, "StudyNotes: publish cover asset");
      const catalogText = JSON.stringify({ schemaVersion: 1, updatedAt: body.catalog.updatedAt || new Date().toISOString(), products: body.catalog.products }, null, 2);
      lastCommit = await githubPut(env, "data/products.json", b64utf8(catalogText), "StudyNotes: publish product catalog");
      const settings = body.settings && typeof body.settings === "object" ? {
        storeName: "StudyNotes",
        currency: "NPR",
        whatsappNumber: String(body.settings.whatsappNumber || "").replace(/\D/g, "").slice(0, 16),
        supportEmail: String(body.settings.supportEmail || "").slice(0, 254),
        paymentInstructions: String(body.settings.paymentInstructions || "").slice(0, 2000)
      } : { storeName: "StudyNotes", currency: "NPR", whatsappNumber: "", supportEmail: "", paymentInstructions: "" };
      lastCommit = await githubPut(env, "data/store-settings.json", b64utf8(JSON.stringify(settings, null, 2)), "StudyNotes: publish store settings");
      return json({ ok: true, commit: lastCommit, publishedProducts: body.catalog.products.length, uploadedAssets: assets.length, message: "Catalog published to GitHub. GitHub Pages deployment may take a few minutes." }, 200, cors);
    } catch (e) {
      return json({ error: e.message || "Publishing failed." }, 502, cors);
    }
  }
};
function timingSafeEqual(a, b) {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}