/* StudyNotes Product Manager — app shell: navigation, rendering, events, preview, boot. */
(function () {
"use strict";
const A = window.ADM, SN = window.SN, esc = A.esc;

const NAV = [
  ["मुख्य", [["overview", "🏠", "Overview"], ["products", "📘", "Ebooks"], ["bundles", "🎁", "Bundles"], ["offers", "🔥", "Offers"]]],
  ["Homepage", [["homepage", "🖼", "Hero / शीर्षक"], ["sections", "↕️", "Sections क्रम"], ["categories", "🗂", "Categories"], ["marketing", "📣", "Marketing / Ticker"], ["steps", "🪜", "Steps"], ["reviews", "⭐", "Reviews"], ["faq", "❓", "FAQ"]]],
  ["व्यवसाय", [["payment", "💳", "Payment / Cart"], ["delivery", "📨", "Delivery"], ["whatsapp", "💬", "WhatsApp"], ["email", "✉️", "Email"], ["messages", "📝", "Messages"]]],
  ["Store", [["store", "🏪", "Store / Footer"], ["social", "🔗", "Social Links"], ["seo", "🔎", "SEO / Share"], ["labels", "🔤", "Button / Text"]]],
  ["Website मा पठाउने", [["publishing", "🚀", "Publish"], ["backup", "💾", "Backup / Import"]]]
];
const FLAT = NAV.reduce((a, g) => a.concat(g[1]), []);

A.buildNav = () => {
  const html = NAV.map(g => `<div class="side-group"><div class="side-title">${esc(g[0])}</div>${g[1].map(n => `<button class="side-link" data-go="${n[0]}" data-nav="${n[0]}"><span class="ico">${n[1]}</span><span>${esc(n[2])}</span>${n[0] === "products" ? '<span class="count" id="navPCount"></span>' : n[0] === "bundles" ? '<span class="count" id="navBCount"></span>' : ""}</button>`).join("")}</div>`).join("");
  A.$("#sideNav").innerHTML = html;
  A.$("#bottomTabs").innerHTML = [["overview", "🏠", "Home"], ["products", "📘", "Ebooks"], ["homepage", "🖼", "Homepage"], ["publishing", "🚀", "Publish"], ["menu", "☰", "Menu"]].map(t => `<button data-go="${t[0]}" data-nav="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join("");
};
A.markNav = () => { A.$$("[data-nav]").forEach(b => b.classList.toggle("active", b.dataset.nav === A.cur)); };

A.render = () => {
  const page = A.pages[A.cur] || A.pages.overview;
  A.resetBindings();
  let body;
  try { body = page.render(); }
  catch (e) { console.error(e); body = A.note("⚠️ यो पेज देखाउन सकिएन: " + esc(e.message) + " — Backup पेजबाट Backup लिनुहोस् र पेज Refresh गर्नुहोस्।"); }
  const editing = (A.cur === "products" || A.cur === "bundles") && A.editing;
  A.$("#app").innerHTML = (editing ? "" : `<div class="page-head"><h1>${esc(page.title)}</h1>${page.sub ? `<p>${esc(page.sub)}</p>` : ""}</div>`) + body;
  A.markNav(); A.updateBadges();
};
A.rerender = () => A.render();
A.rerenderKeep = () => { const y = window.scrollY; A.render(); window.scrollTo(0, y); };
A.rerenderSoft = () => { A.updateBadges(); };
A.show = id => {
  if (id === "menu") { document.body.classList.toggle("menu-open"); return; }
  if (!A.pages[id]) id = "overview";
  if (id !== A.cur && !(A.editing && (id === "products" || id === "bundles"))) { if (id !== "products" && id !== "bundles") A.editing = null; }
  A.cur = id; document.body.classList.remove("menu-open");
  A.render(); window.scrollTo(0, 0);
  try { history.replaceState(null, "", "#" + id); } catch (e) {}
};

/* ------------------------------------------------------------ preview overlay */
A.pv = { open: false, hash: "", drafts: false, ready: false };
A.previewPayload = () => {
  const ids = A.pv.drafts ? A.state.products.map(p => p.id) : [];
  const b = A.publicBuild({ forceInclude: ids });
  let cat = JSON.stringify(b.catalog), set = JSON.stringify(b.settings);
  const map = p => A.blobs[p];
  cat = cat.replace(/assets\/covers\/[A-Za-z0-9_.-]+/g, m => (map(m) ? map(m) : m));
  return { type: "sn-preview-data", catalog: JSON.parse(cat), settings: JSON.parse(set) };
};
A.livePreview = () => {
  if (!A.pv.open) return;
  clearTimeout(A._lpT);
  A._lpT = setTimeout(() => { const f = A.$("#pvFrame"); if (f && A.pv.ready && f.contentWindow) f.contentWindow.postMessage(A.previewPayload(), location.origin); }, 350);
};
A.openPreview = (hash) => {
  A.pv.open = true; A.pv.ready = false; A.pv.hash = hash || "";
  const box = A.$("#pv"); box.hidden = false; document.body.classList.add("pv-open");
  const f = A.$("#pvFrame");
  f.src = A.base + "index.html?snpreview=1" + (A.pv.hash ? "#" + A.pv.hash : "");
};
A.closePreview = () => { A.pv.open = false; A.$("#pv").hidden = true; document.body.classList.remove("pv-open"); A.$("#pvFrame").src = "about:blank"; };
window.addEventListener("message", ev => {
  if (ev.origin !== location.origin || !ev.data) return;
  if (ev.data.type === "sn-preview-ready") { A.pv.ready = true; const f = A.$("#pvFrame"); if (f && f.contentWindow) f.contentWindow.postMessage(A.previewPayload(), location.origin); }
});

/* ------------------------------------------------------------ extra actions */
Object.assign(A.actions, {
  previewHome() { A.openPreview(""); },
  pprev(el) { A.pv.drafts = true; A.$("#pvDrafts").checked = true; A.openPreview("/p/" + el.dataset.id); }
});

/* ------------------------------------------------------------ events */
document.addEventListener("input", A.onInput);
document.addEventListener("change", ev => {
  const el = ev.target;
  if (el.dataset && el.dataset.imgpick) { A.onImagePick(el); return; }
  if (el.dataset && el.dataset.impfile) { A.onFile(el); return; }
  if (el.dataset && el.dataset.sec) { const x = A.site().sections.find(s => s.id === el.dataset.sec); if (x) { x.enabled = el.checked; A.save(); A.rerenderKeep(); A.livePreview(); } return; }
  A.onInput(ev);
});
document.addEventListener("click", ev => {
  const t = ev.target;
  const clear = t.closest("[data-imgclear]");
  if (clear) { const b = A.bind[clear.dataset.imgclear]; if (b) { b.set(""); A.saveNow(); A.rerenderKeep(); A.livePreview(); } return; }
  const coll = t.closest("[data-coll]");
  if (coll && coll.dataset.act) { ev.preventDefault(); A.onCollClick(coll); A.livePreview(); return; }
  const doEl = t.closest("[data-do]");
  if (doEl) { const fn = A.actions[doEl.dataset.do]; if (fn) { ev.preventDefault(); Promise.resolve(fn(doEl)).then(() => A.livePreview(), e => { console.error(e); A.toast("⚠️ " + (e && e.message ? e.message : "त्रुटि")); }); } return; }
  const go = t.closest("[data-go]");
  if (go) { ev.preventDefault(); A.show(go.dataset.go); return; }
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && A.pv.open) A.closePreview(); });

/* ------------------------------------------------------------ boot */
A.boot = async () => {
  const how = A.loadState();
  A.buildNav();
  A.$("#pvClose").addEventListener("click", A.closePreview);
  A.$("#pvDrafts").addEventListener("change", e => { A.pv.drafts = e.target.checked; A.livePreview(); });
  A.$("#pvReload").addEventListener("click", () => { A.pv.ready = false; A.$("#pvFrame").contentWindow.location.reload(); });
  A.$("#btnPreview").addEventListener("click", () => { A.pv.drafts = A.$("#pvDrafts").checked; A.openPreview(""); });
  A.$("#btnPublish").addEventListener("click", () => A.show("publishing"));
  A.$("#menuBtn").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  A.$("#scrim").addEventListener("click", () => document.body.classList.remove("menu-open"));
  try { await A.preloadImages(); } catch (e) {}
  const start = (location.hash || "").replace("#", "");
  A.cur = A.pages[start] ? start : "overview";
  A.render();
  A.updateBadges();
  window.addEventListener("beforeunload", () => { try { A.saveNow(); } catch (e) {} });
  if (how === "migrated") A.toast("✓ पुरानो Manager को Data ल्याइयो (पुरानो Data जस्ताको तस्तै छ)", 5000);
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", A.boot); else A.boot();
})();
