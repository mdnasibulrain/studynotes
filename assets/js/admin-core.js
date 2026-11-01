/* StudyNotes Product Manager — core: storage, images, import/export, publish.
   Secrets: the publishing secret is typed into a password box and kept ONLY in memory (never saved, never in the page source). */
(function () {
"use strict";
const SN = window.SN;
const A = window.ADM = { base: (document.body && document.body.dataset.base) || "", bind: {}, pages: {}, cur: "overview" };
const KEY = "studynotes_admin_v2", OLD_PRODUCTS = "studynotes_manager_v1", OLD_SETTINGS = "studynotes_settings_v1", WORKER_KEY = "studynotes_worker_url";
const DB_NAME = "studynotes_assets_v1", DB_STORE = "covers";
A.SECRET = ""; // memory only

/* ------------------------------------------------------------ helpers */
A.$ = (s, r) => (r || document).querySelector(s);
A.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
A.esc = s => String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
A.toast = (m, ms) => { const e = A.$("#toast"); if (!e) return; e.textContent = m; e.classList.add("show"); clearTimeout(A._tt); A._tt = setTimeout(() => e.classList.remove("show"), ms || 2600); };
A.now = () => new Date().toISOString();
A.fmtDate = iso => { try { return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Kathmandu", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " (NPT)"; } catch (e) { return iso || ""; } };
A.money = n => SN.fmt(n, (A.site().store.currency || "रु."));
A.getPath = (o, p) => p.split(".").reduce((a, k) => (a === null || a === undefined ? a : a[k]), o);
A.setPath = (o, p, v) => { const ks = p.split("."); let t = o; for (let i = 0; i < ks.length - 1; i++) { if (t[ks[i]] === null || typeof t[ks[i]] !== "object") t[ks[i]] = {}; t = t[ks[i]]; } t[ks[ks.length - 1]] = v; };
A.hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };

/* ------------------------------------------------------------ state */
A.state = { v: 2, products: [], site: SN.defaults(), history: [], liveAssets: [], publishedHash: "", lastPublish: null, backups: [] };
A.site = () => A.state.site;
A.loadState = () => {
  let loaded = null;
  try { loaded = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { loaded = null; }
  if (loaded && loaded.v === 2) {
    A.state = Object.assign(A.state, loaded);
    A.state.site = SN.mergeSite(loaded.site || {});
    A.state.products = (loaded.products || []).filter(p => p && p.id);
    return "v2";
  }
  // migrate the old Product Manager (v1) data — old keys are left untouched (rollback friendly)
  let old = [], oldSet = {};
  try { old = JSON.parse(localStorage.getItem(OLD_PRODUCTS) || "[]"); } catch (e) {}
  try { oldSet = JSON.parse(localStorage.getItem(OLD_SETTINGS) || "{}"); } catch (e) {}
  A.state.site = SN.mergeSite({});
  if (Array.isArray(old) && old.length) { A.state.products = old.filter(p => p && p.id).map(A.migrateProduct); }
  if (oldSet && typeof oldSet === "object") A.applyLegacySettings(oldSet);
  return old.length ? "migrated" : "empty";
};
A.applyLegacySettings = s => {
  const site = A.state.site;
  if (s.whatsappNumber) { site.contact.whatsapp = SN.waDigits(s.whatsappNumber); site.contact.whatsappDisplay = ""; }
  if (s.supportEmail) site.contact.supportEmail = String(s.supportEmail);
  if (s.paymentInstructions) site.payment.instructions = String(s.paymentInstructions);
};
A.migrateProduct = p => {
  const n = Object.assign({}, p);
  if (n.benefits && n.benefits.length && !(n.learningOutcomes && n.learningOutcomes.length)) n.learningOutcomes = n.benefits.slice();
  if (n.isFeatured && !n.featured) n.featured = true;
  if (n.status === "published" && !n.availability) n.availability = "available";
  return SN.clone(n);
};
let saveT = null;
A.save = () => {
  clearTimeout(saveT);
  saveT = setTimeout(A.saveNow, 250);
  A.setStatus("बचत हुँदैछ…");
};
A.saveNow = () => {
  clearTimeout(saveT);
  try { localStorage.setItem(KEY, JSON.stringify(A.state)); A.setStatus("✓ यो Browser मा बचत भयो " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })); A.updateBadges(); return true; }
  catch (e) { A.setStatus("⚠️ बचत भएन"); A.toast("Browser को storage भरियो। Backup export गरेर पुराना कुरा हटाउनुहोस्।", 5000); return false; }
};
A.setStatus = t => { const e = A.$("#saveStatus"); if (e) e.textContent = t; };
A.publicBuild = opts => SN.buildPublic({ products: A.state.products, site: A.state.site }, opts || {});
A.publicHash = () => { const b = A.publicBuild(); return A.hash(JSON.stringify({ c: b.catalog, s: b.settings }, (k, v) => (k === "updatedAt" ? undefined : v))); };
A.hasUnpublished = () => A.state.publishedHash !== A.publicHash();
A.updateBadges = () => {
  const e = A.$("#pubBadge");
  if (e) { const u = A.hasUnpublished(); e.textContent = u ? "⚠️ Publish नगरिएका परिवर्तन छन्" : "✓ Public site सँग मिलेको"; e.className = "pub-badge " + (u ? "warn" : "ok"); }
  const c = A.$("#navPCount"); if (c) c.textContent = A.state.products.filter(p => p.kind !== "bundle").length;
  const b = A.$("#navBCount"); if (b) b.textContent = A.state.products.filter(p => p.kind === "bundle").length;
};

/* ------------------------------------------------------------ images (IndexedDB, same DB as the old manager) */
A.blobs = {};     // path -> object URL
A.blobData = {};  // path -> Blob
const db = () => new Promise((res, rej) => { const r = indexedDB.open(DB_NAME, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(DB_STORE)) r.result.createObjectStore(DB_STORE); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
A.imgPut = async (name, blob) => { const d = await db(); await new Promise((res, rej) => { const tx = d.transaction(DB_STORE, "readwrite"); tx.objectStore(DB_STORE).put(blob, name); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); };
A.imgGetAll = async () => { const d = await db(); return new Promise((res, rej) => { const out = {}; const st = d.transaction(DB_STORE).objectStore(DB_STORE); const rq = st.openCursor(); rq.onsuccess = () => { const c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); }; rq.onerror = () => rej(rq.error); }); };
A.preloadImages = async () => { try { const all = await A.imgGetAll(); for (const k of Object.keys(all)) { const p = "assets/covers/" + k; A.blobData[p] = all[k]; A.blobs[p] = URL.createObjectURL(all[k]); } } catch (e) {} };
A.imgUrl = p => (!p ? "" : A.blobs[p] || (/^https:/.test(p) ? p : A.base + p));
A.resize = (file, o) => new Promise((resolve, reject) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (o.ratio) { const r = sw / sh; if (r > o.ratio) { const nw = sh * o.ratio; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / o.ratio; sy = (sh - nh) / 2; sh = nh; } }
    const sc = Math.min(1, o.maxW / sw, o.maxH / sh), w = Math.max(1, Math.round(sw * sc)), h = Math.max(1, Math.round(sh * sc));
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
    if (o.type === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); }
    g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    URL.revokeObjectURL(url);
    c.toBlob(b => (b ? resolve(b) : reject(new Error("Image बदल्न सकिएन"))), o.type, o.quality || 0.85);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("यो file Image होइन (JPG/PNG/WEBP प्रयोग गर्नुहोस्)")); };
  img.src = url;
});
A.IMG_KINDS = {
  cover: { maxW: 900, maxH: 1200, type: "image/jpeg", ext: "jpg", quality: 0.86 },
  logo: { maxW: 256, maxH: 256, type: "image/png", ext: "png" },
  favicon: { maxW: 128, maxH: 128, type: "image/png", ext: "png" },
  og: { maxW: 1200, maxH: 630, type: "image/jpeg", ext: "jpg", ratio: 1200 / 630, quality: 0.85 }
};
A.addImage = async (file, kind, prefix) => {
  const k = A.IMG_KINDS[kind] || A.IMG_KINDS.cover;
  if (file.size > 25 * 1024 * 1024) throw new Error("Image 25MB भन्दा ठूलो छ।");
  const blob = await A.resize(file, k);
  const name = String(prefix || kind).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 7) + "." + k.ext;
  await A.imgPut(name, blob);
  const p = "assets/covers/" + name;
  A.blobData[p] = blob; A.blobs[p] = URL.createObjectURL(blob);
  return p;
};
const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
A.toDataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
A.dataUrlToBlob = u => { const m = String(u).match(/^data:([^;,]+)?(;base64)?,(.*)$/); if (!m) return null; const bin = atob(m[3]); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: m[1] || "image/jpeg" }); };
A.imageExistsLive = async p => { try { const r = await fetch(A.base + p + "?cb=" + Date.now(), { method: "HEAD", cache: "no-store" }); return r.ok; } catch (e) { return false; } };

/* ------------------------------------------------------------ worker */
A.workerUrl = () => { try { return localStorage.getItem(WORKER_KEY) || sessionStorage.getItem("studynotes_worker_url") || ""; } catch (e) { return ""; } };
A.setWorkerUrl = v => { try { localStorage.setItem(WORKER_KEY, String(v || "").trim()); } catch (e) {} };
A.friendlyError = (e, status) => {
  const m = (e && e.message) || "";
  if (status === 401) return "Publish हुन सकेन। Admin secret मिलेन — Cloudflare मा राखेको ADMIN_SECRET नै राख्नुहोस्।";
  if (status === 403) return "Publish हुन सकेन। यो Admin page को address Worker (SITE_ORIGIN) मा अनुमति प्राप्त छैन।";
  if (status === 413) return "Publish हुन सकेन। Image हरू धेरै ठूला भए — केही Cover हटाएर वा थोरै थोरै गरी Publish गर्नुहोस्।";
  if (status === 400) return "Publish हुन सकेन। Data मा समस्या छ: " + m;
  if (status === 500) return "Publish हुन सकेन। Cloudflare Worker को Setup अधुरो छ (GitHub token/owner/repo/branch जाँच्नुहोस्)।";
  if (status === 502) return "Publish हुन सकेन। GitHub मा लेख्न सकिएन: " + m;
  if (status === 404) return "Publish हुन सकेन। Worker URL मिलेन (/publish भेटिएन) — URL फेरि जाँच्नुहोस्।";
  if (!status) return "Publish हुन सकेन। Internet connection check गर्नुहोस् र फेरि प्रयास गर्नुहोस्।";
  return "Publish हुन सकेन। " + m;
};
A.worker = async (path, body) => {
  const url = A.workerUrl().replace(/\/+$/, "");
  if (!url) { const e = new Error("पहिले Worker URL राख्नुहोस्।"); e.status = -1; throw e; }
  if (!/^https:\/\//i.test(url)) { const e = new Error("Worker URL https:// बाट सुरु हुनुपर्छ।"); e.status = -1; throw e; }
  const headers = { "Content-Type": "application/json" };
  if (A.SECRET) headers.Authorization = "Bearer " + A.SECRET;
  let r;
  try { r = await fetch(url + path, { method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined }); }
  catch (e) { const er = new Error("network"); er.status = 0; throw er; }
  let d = {}; try { d = await r.json(); } catch (e) {}
  if (!r.ok) { const er = new Error(d.error || "Request failed (" + r.status + ")"); er.status = r.status; throw er; }
  return d;
};

/* ------------------------------------------------------------ publish */
A.backupSnapshot = (reason) => {
  const snap = { at: A.now(), reason, products: SN.clone(A.state.products), site: SN.clone(A.state.site) };
  A.state.backups = [snap].concat(A.state.backups || []).slice(0, 4);
};
A.collectAssets = async (pub) => {
  const assets = [], missing = [], skipped = [];
  for (const p of pub.imagePaths) {
    const live = (A.state.liveAssets || []).includes(p);
    const blob = A.blobData[p];
    if (blob) { if (!live || A._forceAssets) { assets.push({ path: p, contentBase64: await toB64(blob), contentType: blob.type || "image/jpeg" }); } else skipped.push(p); }
    else if (live) skipped.push(p);
    else if (await A.imageExistsLive(p)) { A.state.liveAssets.push(p); skipped.push(p); }
    else missing.push(p);
  }
  return { assets, missing, skipped };
};
A.publish = async (onStep) => {
  const step = m => { if (onStep) onStep(m); };
  const v = SN.validate(A.state);
  if (v.errors.length) { const e = new Error("validation"); e.validation = v; throw e; }
  if (!A.SECRET) { const e = new Error("Admin secret राख्नुहोस्।"); e.status = -1; throw e; }
  step("Backup बन्दैछ…");
  A.backupSnapshot("before-publish");
  const pub = A.publicBuild();
  step("Images तयार हुँदैछन्…");
  const { assets, missing } = await A.collectAssets(pub);
  if (missing.length) { const e = new Error("missing-images"); e.missing = missing; throw e; }
  const size = assets.reduce((a, x) => a + x.contentBase64.length, 0);
  if (size > 17000000) { const e = new Error("Images ठूला भए"); e.status = 413; throw e; }
  step("GitHub मा पठाउँदैछ… (" + pub.counts.ebooks + " Ebook, " + pub.counts.bundles + " Bundle, " + assets.length + " नयाँ Image)");
  const body = { catalog: pub.catalog, settings: pub.settings, assets };
  let res;
  try { res = await A.worker("/publish", body); }
  catch (e) { A.addHistory({ ok: false, error: A.friendlyError(e, e.status), counts: pub.counts, assets: assets.length }); throw e; }
  assets.forEach(a => { if (!A.state.liveAssets.includes(a.path)) A.state.liveAssets.push(a.path); });
  A.state.publishedHash = A.publicHash();
  A.state.lastPublish = { at: A.now(), updatedAt: pub.catalog.updatedAt, commit: res.commit || "", counts: pub.counts, assets: assets.length };
  A.addHistory({ ok: true, commit: res.commit || "", counts: pub.counts, assets: assets.length, updatedAt: pub.catalog.updatedAt });
  A.saveNow();
  return { res, pub };
};
A.addHistory = h => { A.state.history = [Object.assign({ at: A.now() }, h)].concat(A.state.history || []).slice(0, 25); A.saveNow(); };
/* After publish: wait until the PUBLIC site (GitHub Pages) really serves the new data */
A.verifyLive = async (updatedAt, onTick, maxMs) => {
  const end = Date.now() + (maxMs || 240000);
  let tries = 0;
  while (Date.now() < end) {
    tries++;
    try {
      const r = await fetch(A.base + "data/products.json?cb=" + Date.now(), { cache: "no-store" });
      if (r.ok) { const j = await r.json(); if (j && j.updatedAt === updatedAt) return true; }
    } catch (e) {}
    if (onTick) onTick(tries);
    await new Promise(r => setTimeout(r, 12000));
  }
  return false;
};

/* ------------------------------------------------------------ import / export */
A.exportData = (withImages) => (async () => {
  const out = { format: "studynotes-backup", v: 2, exportedAt: A.now(), products: A.state.products, site: A.state.site, liveAssets: A.state.liveAssets };
  if (withImages) {
    out.images = {};
    const used = new Set(A.publicBuild({ forceInclude: A.state.products.map(p => p.id) }).imagePaths);
    A.state.products.forEach(p => { if (p.cover) used.add(p.cover); if (p.bonus) (p.bonus.items || []).forEach(x => { if (x && x.cover) used.add(x.cover); }); });
    for (const p of used) if (A.blobData[p]) out.images[p] = await A.toDataUrl(A.blobData[p]);
  }
  return out;
})();
A.download = (name, text, type) => { const b = new Blob([text], { type: type || "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
/* Accepts: v2 backup · live/published catalog (with the __site__ record) · old manager exports (array / {products,settings}) */
A.parseImport = obj => {
  const r = { products: [], site: null, images: null, legacy: null, kind: "unknown" };
  if (Array.isArray(obj)) { r.products = obj; r.kind = "old-array"; }
  else if (obj && obj.format === "studynotes-backup") { r.products = obj.products || []; r.site = obj.site || null; r.images = obj.images || null; r.kind = "backup"; }
  else if (obj && Array.isArray(obj.products)) {
    r.kind = obj.schemaVersion ? "catalog" : "old-object";
    const siteRec = obj.products.find(p => p && p.id === SN.SITE_ID && p.site);
    if (siteRec) r.site = siteRec.site;
    r.products = obj.products.filter(p => p && p.id !== SN.SITE_ID && p.kind !== "site");
    if (obj.settings) r.legacy = obj.settings;
  }
  r.products = r.products.filter(p => p && p.id).map(A.migrateProduct).map(p => (p.kind === "bundle" && p.category === SN.CATEGORY_NAME_BUNDLE ? Object.assign(p, { category: "" }) : p));
  return r;
};
A.applyImport = async (r, mode, opts) => {
  opts = opts || {};
  if (mode === "replace") A.state.products = [];
  const byId = new Map(A.state.products.map(p => [p.id, p]));
  let added = 0, updated = 0;
  for (const p of r.products) {
    if (byId.has(p.id)) { if (mode === "merge-keep") continue; const i = A.state.products.findIndex(x => x.id === p.id); A.state.products[i] = Object.assign({}, A.state.products[i], p); updated++; }
    else { A.state.products.push(p); added++; }
  }
  if (r.site) { A.state.site = mode === "replace" || opts.siteReplace ? SN.mergeSite(r.site) : SN.mergeSite(SN.deepMerge(A.state.site, r.site)); }
  if (r.legacy) A.applyLegacySettings(r.legacy);
  if (r.images) for (const p of Object.keys(r.images)) { const b = A.dataUrlToBlob(r.images[p]); if (b && /^assets\/covers\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(p)) { await A.imgPut(p.replace("assets/covers/", ""), b); A.blobData[p] = b; A.blobs[p] = URL.createObjectURL(b); } }
  if (opts.live) {
    // everything the live catalog points at is already on the website
    const paths = new Set(); r.products.forEach(p => { if (p.cover) paths.add(p.cover); if (p.bonus) (p.bonus.items || []).forEach(x => { if (x && x.cover) paths.add(x.cover); }); });
    SN.IMAGE_FIELDS(SN.mergeSite(r.site || {})).forEach(f => paths.add(f.obj[f.key]));
    paths.forEach(p => { if (p && !A.state.liveAssets.includes(p)) A.state.liveAssets.push(p); });
  }
  A.saveNow();
  return { added, updated };
};
A.fetchLive = async () => {
  const r = await fetch(A.base + "data/products.json?cb=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("Live catalog (" + r.status + ")");
  let set = {}; try { const s = await fetch(A.base + "data/store-settings.json?cb=" + Date.now(), { cache: "no-store" }); if (s.ok) set = await s.json(); } catch (e) {}
  const j = await r.json(); if (!j.settings) j.settings = set;
  return j;
};
A.fetchStarter = async () => { const r = await fetch(A.base + "extras/starter-content.json?cb=" + Date.now(), { cache: "no-store" }); if (!r.ok) throw new Error("Starter content भेटिएन"); return r.json(); };
})();
