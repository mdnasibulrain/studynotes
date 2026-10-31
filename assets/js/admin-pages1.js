/* StudyNotes Product Manager — pages (part 1): Overview, Store, Products, Bundles, Offers, Homepage, Sections, Categories */
(function () {
"use strict";
const A = window.ADM, SN = window.SN, esc = A.esc;
const P = A.pages;
const ebooks = () => A.state.products.filter(p => p.kind !== "bundle");
const bundles = () => A.state.products.filter(p => p.kind === "bundle");
A.pf = { q: "", status: "all", cat: "all", sort: "order" };
A.editing = null;

/* ------------------------------------------------------------ OVERVIEW */
P.overview = {
  title: "Overview", sub: "सबै कुराको एकै ठाउँमा हेराइ",
  render() {
    const s = A.site(), pr = A.state.products, eb = ebooks(), bn = bundles();
    const live = pr.filter(SN.isLive);
    const v = SN.validate(A.state);
    const checks = [
      [!!A.workerUrl(), "Cloudflare Worker URL राखिएको", "publishing"],
      [!!SN.waDigits(s.contact.whatsapp), "WhatsApp नम्बर राखिएको", "whatsapp"],
      [!!s.contact.supportEmail, "Support Email राखिएको", "email"],
      [!!SN.safeUrl(s.payment.nspayUrl), "NSPAY link राखिएको", "payment"],
      [live.some(p => p.kind === "ebook"), "कम्तीमा १ Ebook Published छ", "products"],
      [live.filter(p => p.kind === "ebook").every(p => p.cover) && live.some(p => p.kind === "ebook"), "सबै Published Ebook मा Cover छ", "products"],
      [!!A.state.lastPublish, "कम्तीमा एक पटक Publish गरिएको", "publishing"]
    ];
    const done = checks.filter(c => c[0]).length;
    const first = !pr.length ? A.note(`<b>स्वागत छ!</b> यो Browser मा अहिले कुनै Product छैन।<div class="button-row"><button class="btn btn-primary" data-do="loadLive">🌐 Live Store को Data लोड गर्नुहोस्</button><button class="btn btn-ghost" data-do="loadStarter">✨ Starter सामग्री लोड गर्नुहोस्</button><button class="btn btn-ghost" data-go="backup">📦 Backup बाट फर्काउनुहोस्</button></div><p>"Live Store को Data" ले पहिले Publish गरेको सबै कुरा यो Browser मा ल्याउँछ। Starter सामग्री Draft रूपमा आउँछ — तपाईंले Cover र वास्तविक विवरण थपेपछि मात्र Publish हुन्छ।</p>`) : "";
    return first + `
    <div class="stats-grid">
      <article><span>Ebooks</span><strong>${eb.length}</strong></article>
      <article><span>Bundles</span><strong>${bn.length}</strong></article>
      <article><span>Published (Public)</span><strong>${live.length}</strong></article>
      <article><span>Draft / Hidden</span><strong>${pr.filter(p => p.status !== "published" && p.status !== "archived").length}</strong></article>
    </div>
    ${A.card("Publish अवस्था", `
      <div class="publish-summary">${A.hasUnpublished() ? "⚠️ Publish नगरिएका परिवर्तन छन् — Public site मा अझै देखिएको छैन।" : "✓ Public site र यहाँको data मिलेको छ।"}<br>${A.state.lastPublish ? "अन्तिम Publish: <b>" + esc(A.fmtDate(A.state.lastPublish.at)) + "</b> · " + A.state.lastPublish.counts.ebooks + " Ebook, " + A.state.lastPublish.counts.bundles + " Bundle" + (A.state.lastPublish.commit ? " · Commit <code>" + esc(A.state.lastPublish.commit.slice(0, 7)) + "</code>" : "") : "अहिलेसम्म Publish गरिएको छैन।"}</div>
      <div class="button-row"><button class="btn btn-primary" data-go="publishing">🚀 Publish पेज खोल्नुहोस्</button><button class="btn btn-ghost" data-do="previewHome">👁 Homepage Preview</button></div>`)}
    ${A.card("Setup Checklist (" + done + "/" + checks.length + ")", `<ul class="check-list nolist">${checks.map(c => `<li class="${c[0] ? "okc" : "nok"}">${c[0] ? "✅" : "⬜"} ${esc(c[1])}${c[0] ? "" : ` <button class="small-btn" data-go="${c[2]}">जानुहोस्</button>`}</li>`).join("")}</ul>`)}
    ${v.errors.length || v.warnings.length ? A.card("सच्याउनुपर्ने कुरा", `<ul class="check-list">${v.errors.map(e => `<li class="err">❌ ${esc(e.msg)} <button class="small-btn" data-go="${esc(e.where)}">जानुहोस्</button></li>`).join("")}${v.warnings.map(e => `<li>⚠️ ${esc(e.msg)} <button class="small-btn" data-go="${esc(e.where)}">जानुहोस्</button></li>`).join("")}</ul>`) : ""}
    ${A.card("छिटो जानुहोस्", `<div class="button-row"><button class="btn btn-primary" data-do="newEbook">＋ नयाँ Ebook</button><button class="btn btn-ghost" data-go="bundles">🎁 Bundles</button><button class="btn btn-ghost" data-go="offers">🏷 Offers</button><button class="btn btn-ghost" data-go="homepage">🏠 Homepage</button><button class="btn btn-ghost" data-go="messages">💬 Messages</button></div>`)}`;
  }
};

/* ------------------------------------------------------------ STORE */
P.store = {
  title: "Store", sub: "नाम, Logo, Footer, Policies",
  render() {
    const s = A.site();
    return A.card("Store को पहिचान", A.row(A.f(s, { k: "store.name", l: "Store को नाम", h: "Header, Footer, Browser tab र सबै Message मा देखिन्छ।" }) + A.f(s, { k: "store.founder", l: "Founder / Owner नाम" })) +
      A.row(A.f(s, { k: "store.tagline", l: "Tagline (English)" }) + A.f(s, { k: "store.taglineNe", l: "Footer मा देखिने छोटो वर्णन" })) +
      A.f(s, { k: "store.logo", l: "Logo (वैकल्पिक)", t: "image", kind: "logo", prefix: "site-logo", h: "नराखे Default StudyNotes logo नै देखिन्छ। Header, Footer, Chat र About मा देखिन्छ।" }) +
      A.row(A.f(s, { k: "store.currency", l: "Currency चिन्ह", h: "जस्तै: रु. वा NPR" }) + A.f(s, { k: "store.copyright", l: "Copyright लाइन", h: "{year} र {storeName} प्रयोग गर्न सकिन्छ। खाली राखे लुक्छ।" }))) +
      A.card("Footer शीर्षकहरू", A.row(A.f(s, { k: "footer.quickTitle", l: "Quick Links शीर्षक" }) + A.f(s, { k: "footer.contactTitle", l: "Contact शीर्षक" }) + A.f(s, { k: "footer.policiesTitle", l: "Policies शीर्षक" }))) +
      A.card("Footer मा थप Link", A.coll({ id: "flinks", list: s.footer.links, label: l => l.label || l.url, vis: "visible", addText: "Link थप्नुहोस्", empty: "अतिरिक्त Link छैन (Quick Links मा Home/Ebooks/Combo/Bundles/FAQ आफैं आउँछन्)।", make: () => ({ label: "", url: "https://", visible: true }), item: l => A.row(A.f(l, { k: "label", l: "Link को नाम" }) + A.f(l, { k: "url", l: "Link (https://...)" })) }), { sub: "जस्तै: Blog, Facebook Page, आफ्नो Website" }) +
      A.card("Policies (Footer मा Popup)", A.coll({ id: "policies", list: s.footer.policies, label: p => p.title, vis: "visible", addText: "Policy थप्नुहोस्", make: () => ({ title: "", content: "", visible: true }), item: p => A.f(p, { k: "title", l: "शीर्षक" }) + A.f(p, { k: "content", l: "विवरण", t: "area", rows: 4 }) }));
  }
};

/* ------------------------------------------------------------ PRODUCTS */
const STATUS_OPTS = [["draft", "Draft (Public मा देखिँदैन)"], ["published", "Published (Public मा देखिन्छ)"], ["hidden", "Hidden (लुकाइएको)"], ["archived", "Archived (अभिलेख)"]];
A.newProduct = kind => {
  const s = A.site();
  const id = kind === "bundle" ? SN.nextBundleId(A.state.products) : SN.nextEbookId(A.state.products, (s.categories[0] || {}).code || "XX");
  const max = A.state.products.reduce((a, p) => Math.max(a, +p.order || 0), 0);
  const p = { id, kind: kind === "bundle" ? "bundle" : "ebook", title: "", category: kind === "bundle" ? "" : (s.categories[0] || {}).name || "", status: "draft", availability: "available", featured: false, isNew: false, order: max + 10, regularPrice: null, offerPrice: null, offerActive: true, countdownVisible: true, tags: [], forWho: [], learningOutcomes: [], careerRelevance: [], chapterOutline: [], includes: [], createdAt: A.now(), _new: true };
  A.state.products.push(p); A.saveNow(); return p;
};
const sortFns = {
  order: (a, b) => (a.order ?? 1e6) - (b.order ?? 1e6),
  title: (a, b) => String(a.title).localeCompare(String(b.title)),
  priceLow: (a, b) => eff(a) - eff(b), priceHigh: (a, b) => eff(b) - eff(a),
  updated: (a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
};
const eff = p => { const n = SN.normalizeProduct(p); const pi = SN.priceInfo(n, A.site().offers, Date.now()); return pi.price || 0; };
A.productRow = (p, canMove) => {
  const n = SN.normalizeProduct(p), pi = SN.priceInfo(n, A.site().offers, Date.now());
  const flags = [p.featured ? "⭐ Featured" : "", p.isNew ? "🆕 New" : "", p.badge ? "🏷 " + esc(p.badge) : ""].filter(Boolean).join(" · ");
  const cover = p.cover ? `<img class="mini-cover" src="${esc(A.imgUrl(p.cover))}" alt="">` : `<div class="mini-cover ph">${p.kind === "bundle" ? "🎁" : "📘"}</div>`;
  return `<div class="product-row" data-pid="${esc(p.id)}">${cover}<div><div class="row-title">${esc(p.title || "(Title छैन)")}</div><div class="row-sub"><b>${esc(p.id)}</b> · ${esc(p.kind === "bundle" ? "Bundle · " + (p.includes || []).length + " Ebooks" : p.category || "Category छैन")} · ${pi.has ? `<b>${esc(A.money(pi.price))}</b> <s>${esc(A.money(pi.regular))}</s> (-${pi.discount}%)` : esc(A.money(pi.regular))}${flags ? " · " + flags : ""}</div></div>${A.statusPill(p.status)}<div class="row-actions">
    ${canMove ? `<button class="small-btn" data-do="pmove" data-id="${esc(p.id)}" data-dir="-1">↑</button><button class="small-btn" data-do="pmove" data-id="${esc(p.id)}" data-dir="1">↓</button>` : ""}
    <button class="small-btn" data-do="pedit" data-id="${esc(p.id)}">Edit</button>
    <button class="small-btn" data-do="pprev" data-id="${esc(p.id)}">Preview</button>
    <button class="small-btn" data-do="pdup" data-id="${esc(p.id)}">Copy</button>
    <button class="small-btn" data-do="ptoggle" data-id="${esc(p.id)}">${p.status === "published" ? "Hide" : "Publish"}</button>
    <button class="small-btn" data-do="parch" data-id="${esc(p.id)}">${p.status === "archived" ? "Restore" : "Archive"}</button>
    <button class="small-btn danger" data-do="pdel" data-id="${esc(p.id)}">Delete</button></div></div>`;
};
A.listView = kind => {
  const f = A.pf; const isB = kind === "bundle";
  let list = A.state.products.filter(p => (isB ? p.kind === "bundle" : p.kind !== "bundle"));
  const q = f.q.toLowerCase().trim();
  list = list.filter(p => (f.status === "all" || p.status === f.status) && (f.cat === "all" || p.category === f.cat) && (!q || [p.title, p.id, p.category, (p.tags || []).join(" ")].join(" ").toLowerCase().includes(q)));
  list.sort(sortFns[f.sort] || sortFns.order);
  const sel = (key, opts) => { const id = A.reg(() => f[key], v => { f[key] = v; A.rerenderKeep(); }, "select"); return `<select data-b="${id}">${opts.map(o => `<option value="${esc(o[0])}" ${f[key] === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`; };
  const qid = A.reg(() => f.q, v => { f.q = v; A.rerenderList(kind); }, "text");
  return `<div class="toolbar tb4"><input data-b="${qid}" value="${esc(f.q)}" placeholder="🔍 खोज्नुहोस् (नाम, ID, Tag...)">${sel("status", [["all", "सबै अवस्था"]].concat(STATUS_OPTS.map(o => [o[0], o[0]])))}${isB ? "" : sel("cat", [["all", "सबै Category"]].concat(A.site().categories.map(c => [c.name, c.name])))}${sel("sort", [["order", "क्रम (Order)"], ["title", "नाम A-Z"], ["priceLow", "Price ↑"], ["priceHigh", "Price ↓"], ["updated", "भर्खरै फेरिएको"]])}</div><div class="product-list" id="plist">${list.map(p => A.productRow(p, f.sort === "order" && f.status === "all" && f.cat === "all" && !q)).join("") || '<p class="muted pad">कुनै Product भेटिएन।</p>'}</div>`;
};
A.rerenderList = kind => { const el = A.$("#plist"); if (!el) return; const html = A.listView(kind); const tmp = document.createElement("div"); tmp.innerHTML = html; const nl = tmp.querySelector("#plist"); el.innerHTML = nl.innerHTML; };

P.products = {
  title: "Ebooks / Products", sub: "सबै Ebook — विवरण, Price, Offer, Cover, Badge",
  render() {
    if (A.editing && A.state.products.find(p => p.id === A.editing)) return A.productEditor(A.state.products.find(p => p.id === A.editing));
    return `<div class="button-row top"><button class="btn btn-primary" data-do="newEbook">＋ नयाँ Ebook</button><button class="btn btn-ghost" data-do="previewHome">👁 Homepage Preview</button></div>` + A.listView("ebook");
  }
};
P.bundles = {
  title: "Bundles", sub: "छानिएका Ebook मिलाएर Package बनाउनुहोस्",
  render() {
    if (A.editing && A.state.products.find(p => p.id === A.editing && p.kind === "bundle")) return A.productEditor(A.state.products.find(p => p.id === A.editing));
    return `<div class="button-row top"><button class="btn btn-primary" data-do="newBundle">＋ नयाँ Bundle</button></div>` + A.listView("bundle");
  }
};

/* the price card (live preview of what the public site will show) */
A.pcalc = () => {
  const el = A.$("#pcalc"); if (!el || !A.editing) return;
  const p = A.state.products.find(x => x.id === A.editing); if (!p) return;
  el.innerHTML = A.pcalcHtml(p);
};
A.pcalcHtml = p => {
  const n = SN.normalizeProduct(p), site = A.site(), now = Date.now();
  let reg = n.regularPrice || 0;
  if (n.kind === "bundle" && !(reg > 0)) reg = n.includes.reduce((a, id) => a + ((A.state.products.find(x => x.id === id) || {}).regularPrice || 0), 0);
  const pi = SN.priceInfo(Object.assign({}, n, { regularPrice: reg }), site.offers, now);
  const st = [];
  if (n.offerPrice !== null && n.offerPrice < reg) {
    const a = SN.parseTime(n.offerStart), b = SN.parseTime(n.offerEndsAt);
    if (!n.offerActive) st.push("Offer बन्द (Toggle Off) छ");
    else if (a && now < a) st.push("Offer अझै सुरु भएको छैन — सुरु: " + A.fmtDate(a));
    else if (b && now >= b) st.push("Offer सकिसकेको छ — अहिले Regular Price देखिन्छ");
    else st.push("Offer अहिले सक्रिय छ" + (b ? " — सकिने: " + A.fmtDate(b) : " (अन्त्य मिति छैन, Countdown देखिँदैन)"));
  }
  return `<div class="calc"><div><span>Regular</span><b>${esc(A.money(reg))}</b></div><div><span>Public मा देखिने Price</span><b class="or">${esc(A.money(pi.price))}</b></div><div><span>Discount</span><b class="gr">${pi.discount ? "-" + pi.discount + "%" : "छैन"}</b></div>${pi.has ? `<div><span>बचत</span><b>${esc(A.money(reg - pi.price))}</b></div>` : ""}</div>${st.length ? `<p class="muted">${esc(st.join(" · "))}</p>` : ""}${pi.showCountdown ? '<p class="muted">⏳ Countdown Public site मा देखिन्छ।</p>' : ""}`;
};

A.productEditor = p => {
  const s = A.site(), isB = p.kind === "bundle";
  const touch = () => { p.updatedAt = A.now(); };
  const F = (spec) => A.f(p, Object.assign({}, spec, { after: () => { touch(); A.pcalc(); } }));
  const catOpts = A.categoryOptions(p.category && !s.categories.some(c => c.name === p.category) ? [[p.category, p.category + " (सूचीमा छैन)"]] : []);
  const catSpec = { k: "category", l: "Category", t: "select", o: catOpts, rerender: false, after: () => {
    touch(); if (p._new && !isB) { const c = s.categories.find(c => c.name === p.category); if (c) { const others = A.state.products.filter(x => x !== p); p.id = SN.nextEbookId(others, c.code); A.editing = p.id; const t = A.$("#pidShow"); if (t) t.textContent = p.id; } }
  } };
  const badgeOpts = [["", "कुनै छैन"]].concat(SN.BADGES.map(b => [b, b]));
  if (p.badge && !SN.BADGES.includes(p.badge)) badgeOpts.push([p.badge, p.badge]);
  const head = `<div class="editor-head"><button class="btn btn-ghost" data-do="pclose">← सूचीमा फर्कनुहोस्</button><div class="eh-id">ID: <b id="pidShow">${esc(p.id)}</b> ${A.statusPill(p.status)}</div><div class="button-row"><button class="btn btn-ghost" data-do="pprev" data-id="${esc(p.id)}">👁 Preview</button><button class="btn btn-primary" data-go="publishing">🚀 Publish</button></div></div>`;
  const basic = A.card("१. आधारभूत विवरण", A.row(F({ k: "status", l: "अवस्था (Status)", t: "select", o: STATUS_OPTS, rerender: true }) + F({ k: "availability", l: "उपलब्धता", t: "select", o: [["available", "उपलब्ध (Available)"], ["unavailable", "उपलब्ध छैन (Public बाट लुक्छ)"], ["sold_out", "Sold out (Public बाट लुक्छ)"]] })) +
    F({ k: "title", l: "पूरा नाम (Title)", req: true }) + A.row(F({ k: "short", l: "छोटो नाम", h: "कार्डहरूमा देखिन्छ। खाली भए पूरा नाम प्रयोग हुन्छ।" }) + (isB ? "" : F(catSpec))) +
    F({ k: "subtitle", l: "Subtitle (उपशीर्षक)" }) + F({ k: "summary", l: "छोटो सारांश", t: "area", rows: 2, h: "Hero र कार्डमा देखिन्छ।" }) +
    F({ k: "description", l: "पूरा वर्णन", t: "area", rows: 4, h: "Product पेजको Hook बक्समा देखिन्छ।" }) + F({ k: "hook", l: "Hook / आकर्षक पङ्क्ति", t: "area", rows: 2, h: "Product पेजको ठूलो शीर्षक।" }) +
    A.row(F({ k: "tags", l: "Tags (अल्पविरामले छुट्याउनुहोस्)", t: "csv", ph: "Excel, Typing, Office" }) + F({ k: "language", l: "भाषा", ph: "Nepali" })) +
    A.row(F({ k: "featured", l: "⭐ Featured (Hero Carousel मा प्राथमिकता)", t: "bool" }) + F({ k: "isNew", l: "🆕 NEW tag देखाउने", t: "bool" })) +
    F({ k: "order", l: "क्रम नम्बर (सानो = पहिले)", t: "num", step: 1 }));
  const cover = A.card("२. Cover", A.f(p, { k: "cover", l: isB ? "Bundle Cover (वैकल्पिक — नराखे Designed cover देखिन्छ)" : "Cover Image (आवश्यक)", t: "image", kind: "cover", prefix: () => p.id, h: "Image आफैं सानो बनाइन्छ (३:४ अनुपात राम्रो)।", after: touch }) + F({ k: "coverAlt", l: "Cover को वैकल्पिक Text (Alt)" }));
  const price = A.card("३. Price, Discount र Offer", `<div id="pcalc">${A.pcalcHtml(p)}</div>` +
    A.row(F({ k: "regularPrice", l: isB ? "Regular Price (खाली = Ebook हरूको जोड)" : "Regular Price *", t: "num", min: 0, step: 1 }) + F({ k: "offerPrice", l: isB ? "Bundle को Sale Price" : "Offer / Sale Price", t: "num", min: 0, step: 1, h: "खाली = Discount छैन" })) +
    `<div class="field"><label>Discount % बाट Price निकाल्नुहोस्</label><div class="inline-act"><input id="discPct" type="number" min="1" max="95" placeholder="जस्तै 40"><button class="btn btn-ghost" type="button" data-do="applyPct">लागू गर्नुहोस्</button></div><small>Regular Price भन्दा कति % छुट दिने हो लेख्नुहोस् — Offer Price आफैं भरिन्छ।</small></div>` +
    F({ k: "offerActive", l: "Offer सक्रिय (Off गरे Regular Price मात्र देखिन्छ)", t: "bool" }) +
    A.row(F({ k: "offerStart", l: "Offer सुरु हुने समय (नेपाल समय)", t: "dt", h: "खाली = अहिले नै" }) + F({ k: "offerEndsAt", l: "Offer सकिने समय (नेपाल समय)", t: "dt", h: "यो मिति पछि Offer आफैं बन्द हुन्छ। यही मिति Countdown मा देखिन्छ।" })) +
    A.row(F({ k: "offerLabel", l: "Offer Label (कभरमा)", ph: "BESTSELLER" }) + F({ k: "badge", l: "Badge", t: "select", o: badgeOpts, rerender: false })) +
    F({ k: "badge", l: "अथवा आफ्नो Badge लेख्नुहोस्", ph: "जस्तै: EXAM SPECIAL" }) +
    F({ k: "offerDescription", l: "Offer को छोटो वर्णन", t: "area", rows: 2 }) +
    A.row(F({ k: "urgencyLabel", l: "Urgency Label (Product पेज Tag)", ph: "Limited Copies Offer", h: "वास्तविक कुरा मात्र लेख्नुहोस्।" }) + F({ k: "countdownText", l: "Countdown वाक्य", ph: "{time} मा Offer सकिन्छ" })) +
    F({ k: "countdownVisible", l: "⏳ Countdown देखाउने (Offer सकिने मिति राखेको भए)", t: "bool" }));
  const proof = A.card("४. Social Proof (वास्तविक मान मात्र)", A.note("⚠️ यहाँ <b>वास्तविक</b> संख्या मात्र राख्नुहोस्। खाली छोडेमा Public site मा त्यो भाग (Rating, Sold, बाँकी Copies) आफैं <b>लुक्छ</b>। नक्कली संख्या नराख्नुहोस्।") +
    A.row(F({ k: "rating", l: "Rating (0–5)", t: "num", min: 0, max: 5, step: 0.1 }) + F({ k: "reviewCount", l: "Reviews संख्या", t: "num", min: 0, step: 1 })) + A.row(F({ k: "soldCopies", l: "बिक्री भएको Copies", t: "num", min: 0, step: 1, h: isB ? "Bundle मा यो देखिँदैन" : "" }) + F({ k: "copiesLeft", l: isB ? "बाँकी Bundles (वास्तविक Limit भए मात्र)" : "बाँकी Copies (वास्तविक Limit भए मात्र)", t: "num", min: 0, step: 1 })));
  let value;
  if (isB) {
    const opts = ebooks().map(e => [e.id, e.id + " — " + (e.title || "(नाम छैन)") + (SN.isLive(SN.normalizeProduct(e)) ? "" : " [Published छैन]")]);
    value = A.card("५. Bundle मा कुन Ebook?", A.f(p, { k: "includes", l: "Ebook छान्नुहोस् (कम्तीमा २)", t: "multi", o: opts, after: () => { touch(); A.pcalc(); }, h: "Published नभएका Ebook Public Bundle बाट आफैं हटाइन्छन्।" }));
  } else {
    value = A.card("५. Ebook को मूल्य (Value)", F({ k: "forWho", l: "यो Ebook कसका लागि हो? (एक लाइनमा एक)", t: "lines", rows: 4 }) + F({ k: "learningOutcomes", l: "Learning Outcomes / फाइदाहरू (एक लाइनमा एक)", t: "lines", rows: 5 }) + F({ k: "careerRelevance", l: "Career Relevance (एक लाइनमा एक)", t: "lines", rows: 4 }) +
      A.row(F({ k: "pages", l: "Pages", t: "num", min: 0, step: 1 }) + F({ k: "chapters", l: "कुल Chapters", t: "num", min: 0, step: 1, h: "खाली भए तलको सूचीको संख्या प्रयोग हुन्छ।" }) + F({ k: "format", l: "Format", ph: "PDF" })) +
      F({ k: "previewPdf", l: "Preview PDF को Link (https://)", h: "Google Drive को Share link राख्न सकिन्छ (Anyone with link)। मूल PDF यहाँ Upload नगर्नुहोस् — केवल नमुना अध्याय।" }) +
      `<div class="field"><label>Chapters सूची (नमुना)</label>${A.coll({ id: "chapters", list: p.chapterOutline = p.chapterOutline || [], label: c => c.title, addText: "Chapter थप्नुहोस्", useId: false, make: () => ({ title: "", description: "" }), item: c => A.f(c, { k: "title", l: "Chapter को नाम", after: touch }) + A.f(c, { k: "description", l: "छोटो वर्णन", after: touch }) })}</div>`);
  }
  const actions = `<div class="editor-footer"><button class="btn btn-ghost" data-do="pclose">✓ बचत गरी फर्कनुहोस्</button>${p.status !== "published" ? `<button class="btn btn-primary" data-do="ppub" data-id="${esc(p.id)}">✅ Published बनाउनुहोस्</button>` : `<button class="btn btn-primary" data-go="publishing">🚀 Website मा Publish</button>`}</div>`;
  return head + basic + cover + price + proof + value + (isB || !A.bonusCard ? "" : A.bonusCard(p)) + actions;
};

/* product list/editor actions */
A.actions = {
  newEbook() { const p = A.newProduct("ebook"); A.editing = p.id; A.show("products"); },
  newBundle() { const p = A.newProduct("bundle"); A.editing = p.id; A.show("bundles"); },
  pedit(el) { A.editing = el.dataset.id; A.show(A.state.products.find(p => p.id === el.dataset.id).kind === "bundle" ? "bundles" : "products"); },
  pclose() { const p = A.state.products.find(x => x.id === A.editing); if (p) { delete p._new; p.updatedAt = A.now(); } A.editing = null; A.saveNow(); A.rerender(); },
  pdup(el) { const o = A.state.products.find(p => p.id === el.dataset.id); const n = SN.clone(o); n.id = o.kind === "bundle" ? SN.nextBundleId(A.state.products) : SN.nextEbookId(A.state.products, ((A.site().categories.find(c => c.name === o.category) || {}).code) || "XX"); n.title = (o.title || "") + " (Copy)"; n.status = "draft"; n.order = (o.order || 0) + 1; n.createdAt = A.now(); A.state.products.push(n); A.saveNow(); A.rerender(); A.toast("Copy बन्यो (Draft)"); },
  ptoggle(el) { const p = A.state.products.find(x => x.id === el.dataset.id); p.status = p.status === "published" ? "draft" : "published"; p.updatedAt = A.now(); A.saveNow(); A.rerender(); },
  ppub(el) { const p = A.state.products.find(x => x.id === el.dataset.id); p.status = "published"; p.availability = "available"; p.updatedAt = A.now(); A.saveNow(); A.rerender(); A.toast("Published छ — अब Publish पेजबाट Website मा पठाउनुहोस्।", 4000); },
  parch(el) { const p = A.state.products.find(x => x.id === el.dataset.id); p.status = p.status === "archived" ? "draft" : "archived"; p.updatedAt = A.now(); A.saveNow(); A.rerender(); },
  pdel(el) { const p = A.state.products.find(x => x.id === el.dataset.id); if (!p) return; const used = A.state.products.some(b => b.kind === "bundle" && (b.includes || []).includes(p.id)); if (!confirm(`"${p.title || p.id}" स्थायी रूपमा हटाउने?${used ? "\n(यो Ebook केही Bundle मा छ — Bundle बाट पनि हट्नेछ)" : ""}\nBackup नलिएको भए पहिले Backup पेजबाट Export गर्नुहोस्।`)) return; A.state.products = A.state.products.filter(x => x !== p); A.state.products.forEach(b => { if (b.includes) b.includes = b.includes.filter(i => i !== p.id); }); if (A.editing === p.id) A.editing = null; A.saveNow(); A.rerender(); },
  pmove(el) { const list = A.state.products.filter(p => (A.cur === "bundles" ? p.kind === "bundle" : p.kind !== "bundle")).sort(sortFns.order); const i = list.findIndex(p => p.id === el.dataset.id), j = i + (+el.dataset.dir); if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; list.forEach((p, k) => { p.order = (k + 1) * 10; }); A.saveNow(); A.rerender(); },
  applyPct() { const p = A.state.products.find(x => x.id === A.editing); const v = +A.$("#discPct").value; if (!p) return; let reg = +p.regularPrice || 0; if (p.kind === "bundle" && !(reg > 0)) reg = SN.normalizeProduct(p).includes.reduce((a, id) => a + ((A.state.products.find(x => x.id === id) || {}).regularPrice || 0), 0); if (!(reg > 0) || !(v > 0 && v < 100)) { A.toast("पहिले Regular Price र १–९९ बीच % राख्नुहोस्।"); return; } p.offerPrice = Math.round(reg * (100 - v) / 100); p.updatedAt = A.now(); A.saveNow(); A.rerender(); A.toast("Offer Price: " + A.money(p.offerPrice)); }
};

/* ------------------------------------------------------------ OFFERS */
P.offers = {
  title: "Offers", sub: "समयसीमा सहितका Campaign — Price, Badge, Countdown र Ticker मा देखिन्छ",
  render() {
    const s = A.site(), now = Date.now();
    const status = o => { const a = SN.parseTime(o.start), b = SN.parseTime(o.end); if (o.active === false) return "बन्द"; if (a && now < a) return "सुरु हुने"; if (b && now >= b) return "सकियो"; return "सक्रिय"; };
    return A.note("🏷 <b>Offer ले के गर्छ?</b> चुनिएका Ebook/Bundle मा <b>Discount %</b> लगाउँछ (Product को आफ्नै Offer Price भए सबैभन्दा कम Price लाग्छ), Cover मा Badge, <b>Countdown</b> (सकिने मिति), माथिको Ticker मा सन्देश, र Bundles खण्डमा विवरण देखाउँछ। मिति सकिएपछि सबै आफैं हट्छ — कुनै नक्कली Timer हुँदैन।") +
      A.card("Offer Campaigns", A.coll({ id: "offers", list: s.offers, label: o => (o.title || "(नाम छैन)") + " — " + status(o), vis: "active", addText: "नयाँ Offer", empty: "अहिले कुनै Offer छैन।", make: () => ({ title: "", subtitle: "", badge: "", description: "", active: true, showInTicker: true, start: null, end: null, discountPercent: null, productIds: [], bundleIds: [], ctaText: "", ctaAction: "section:bundles" }),
        item: o => A.row(A.f(o, { k: "title", l: "Offer को नाम (Ticker मा देखिन्छ)" }) + A.f(o, { k: "badge", l: "Badge / Emoji", ph: "🔥 FLASH SALE" })) + A.f(o, { k: "subtitle", l: "छोटो थप वाक्य (Ticker)" }) + A.f(o, { k: "description", l: "वर्णन (Bundle/Product मा देखिन्छ)", t: "area", rows: 2 }) +
          A.row(A.f(o, { k: "start", l: "सुरु (नेपाल समय)", t: "dt" }) + A.f(o, { k: "end", l: "सकिने (नेपाल समय)", t: "dt", h: "Countdown यही मितिसम्म देखिन्छ।" })) +
          A.row(A.f(o, { k: "discountPercent", l: "Discount % (वैकल्पिक)", t: "num", min: 0, max: 95, step: 1, h: "खाली = Price नबदल्ने (केवल Badge/Ticker/Countdown)" }) + A.f(o, { k: "showInTicker", l: "Ticker मा देखाउने", t: "bool" })) +
          A.f(o, { k: "productIds", l: "कुन Ebook मा लागू?", t: "multi", o: ebooks().map(e => [e.id, e.id + " — " + (e.title || "")]) }) + A.f(o, { k: "bundleIds", l: "कुन Bundle मा लागू?", t: "multi", o: bundles().map(e => [e.id, e.id + " — " + (e.title || "")]) }) +
          A.row(A.f(o, { k: "ctaText", l: "Ticker को Link शब्द", ph: "हेर्नुहोस्" }) + A.f(o, { k: "ctaAction", l: "क्लिक गर्दा के हुने?", t: "action" })) }) + `<p class="muted">Offer Ticker मा देखिन्छ जब Marketing पेजमा "Offer हरू Ticker मा आफैं" खोलिएको छ।</p>`);
  }
};

/* ------------------------------------------------------------ HOMEPAGE */
P.homepage = {
  title: "Homepage", sub: "Hero, Goals र खण्डहरूका शीर्षक",
  render() {
    const s = A.site(), h = s.hero;
    return A.card("Hero (पहिलो स्क्रिन)", A.f(h, { k: "badge", l: "माथिको सानो Badge", h: "{storeName} र {tagline} प्रयोग गर्न सकिन्छ। खाली = लुक्छ।" }) +
      A.row(A.f(h, { k: "headBefore", l: "शीर्षक — सुरु" }) + A.f(h, { k: "headHighlight", l: "शीर्षक — सुनौलो/Orange शब्द" }) + A.f(h, { k: "headAfter", l: "शीर्षक — पछिको भाग" })) +
      A.f(h, { k: "description", l: "वर्णन", t: "area", rows: 3, h: "**यसरी** लेखे मोटो अक्षर हुन्छ।" }) +
      A.row(A.f(h, { k: "cta1.text", l: "पहिलो Button को शब्द" }) + A.f(h, { k: "cta1.action", l: "पहिलो Button ले के गर्ने?", t: "action" })) +
      A.row(A.f(h, { k: "cta2.text", l: "दोस्रो Button को शब्द" }) + A.f(h, { k: "cta2.action", l: "दोस्रो Button ले के गर्ने?", t: "action" })) +
      A.f(h, { k: "cardNote", l: "Hero कार्ड मुनिको वाक्य" }) + A.f(h, { k: "carouselMode", l: "Hero मा घुम्ने Ebook/Bundle", t: "select", o: [["all", "सबै — पहिलो Bundle, सबै Ebook, अन्तिम Bundle (Default)"], ["featured", "केवल ⭐ Featured चिन्ह लगाएका"]] })) +
      A.note("Hero मा घुम्ने Ebook/Bundle माथिको छनोटले तय गर्छ (Default: सबै)। Rating/Sold/बाँकी संख्या Product मा राखेको वास्तविक मान मात्र देखिन्छ।") +
      A.card("Goals — “तपाईंको Goal के हो?”", A.row(A.f(s, { k: "goals.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "goals.title", l: "ठूलो शीर्षक" })) + A.f(s, { k: "goals.sub", l: "उपशीर्षक" }) +
        A.coll({ id: "goals", list: s.goals.items, label: g => g.title, vis: "visible", addText: "Goal थप्नुहोस्", make: () => ({ title: "", icon: "book", category: (s.categories[0] || {}).name || "", text: "", visible: true }), item: g => A.row(A.f(g, { k: "title", l: "शीर्षक" }) + A.f(g, { k: "icon", l: "Icon", t: "icon" })) + A.row(A.f(g, { k: "category", l: "क्लिक गर्दा कुन Category खुल्ने?", t: "select", o: [["", "सबै"]].concat(A.categoryOptions()) }) + A.f(g, { k: "text", l: "छोटो वर्णन" })) })) +
      A.card("अन्य खण्डका शीर्षक", `<h3 class="sub">Ebook Library</h3>` + A.row(A.f(s, { k: "library.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "library.title", l: "शीर्षक" })) + `<h3 class="sub">Custom Combo</h3>` + A.row(A.f(s, { k: "combo.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "combo.title", l: "शीर्षक" })) + A.f(s, { k: "combo.sub", l: "उपशीर्षक", h: "{comboMin} र {comboPercent} प्रयोग गर्न सकिन्छ।" }) + `<h3 class="sub">Bundles / Offers</h3>` + A.row(A.f(s, { k: "bundles.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "bundles.title", l: "शीर्षक" })) + A.f(s, { k: "bundles.sub", l: "उपशीर्षक" }));
  }
};

/* ------------------------------------------------------------ SECTIONS */
P.sections = {
  title: "Sections", sub: "Homepage का खण्ड देखाउने/लुकाउने र क्रम मिलाउने",
  render() {
    const s = A.site(), names = Object.fromEntries(SN.SECTIONS.map(x => [x[0], x[1]]));
    const rows = s.sections.map((x, i) => `<div class="sec-row ${x.enabled ? "" : "off"}"><span class="cn">${i + 1}</span><span class="sn">${esc(names[x.id] || x.id)}</span><span class="sec-tools">${x.id === "library" ? '<span class="muted">सधैं देखिन्छ</span>' : `<label class="switch"><input type="checkbox" data-sec="${esc(x.id)}" ${x.enabled ? "checked" : ""}><i></i></label>`}<button class="small-btn" data-do="secmove" data-id="${esc(x.id)}" data-dir="-1" ${i === 0 ? "disabled" : ""}>↑</button><button class="small-btn" data-do="secmove" data-id="${esc(x.id)}" data-dir="1" ${i === s.sections.length - 1 ? "disabled" : ""}>↓</button></span></div>`).join("");
    return A.card("Homepage खण्डहरू", `<div class="sec-list">${rows}</div>` + A.note("• <b>Announcement</b> = माथिको Offer पट्टी र Ticker (सधैं सबैभन्दा माथि रहन्छ)।<br>• <b>Footer</b> सधैं सबैभन्दा तल रहन्छ (Off गर्न मिल्छ)।<br>• खाली भएका खण्ड (जस्तै Review नभएको) आफैं लुक्छन्।<br>• बन्द गरेको खण्डका Menu/Footer Link पनि आफैं हट्छन्।")) + `<div class="button-row"><button class="btn btn-ghost" data-do="previewHome">👁 Homepage Preview</button></div>`;
  }
};
A.actions.secmove = el => { const l = A.site().sections, i = l.findIndex(x => x.id === el.dataset.id), j = i + (+el.dataset.dir); if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; A.save(); A.rerender(); };

/* ------------------------------------------------------------ CATEGORIES */
A.catPrev = new WeakMap();
P.categories = {
  title: "Categories", sub: "Ebook को वर्ग — नाम, Icon, रङ, ID Code",
  render() {
    const s = A.site();
    const list = A.coll({ id: "cats", list: s.categories, label: c => c.name, vis: "visible", addText: "Category थप्नुहोस्", empty: "Category छैन।", useId: true,
      make: () => { const used = s.categories.map(c => c.code); return { id: SN.slug("cat-" + Date.now().toString(36)), name: "", short: "", code: SN.categoryCode("New", used), icon: "book", palette: "orange", visible: true }; },
      onDelete: c => { const n = A.state.products.filter(p => p.category === c.name).length; if (n) { alert(`यो Category मा ${n} Product छन्। पहिले ती Product अर्को Category मा सार्नुहोस्।`); return false; } },
      item: c => { A.catPrev.set(c, A.catPrev.get(c) ?? c.name);
        return A.row(A.f(c, { k: "name", l: "Category को नाम", after: () => { const prev = A.catPrev.get(c); if (prev !== c.name) { A.state.products.forEach(p => { if (p.category === prev) p.category = c.name; }); s.goals.items.forEach(g => { if (g.category === prev) g.category = c.name; }); A.catPrev.set(c, c.name); } } }) + A.f(c, { k: "short", l: "छोटो नाम", h: "Cover मा देखिन्छ" })) +
          A.row(A.f(c, { k: "code", l: "ID को २ अक्षर (Code)", h: "नयाँ Ebook ID: SN001<b>CS</b> । पुराना ID फेरिँदैनन्।", max: 2 }) + A.f(c, { k: "icon", l: "Icon", t: "icon" }) + A.f(c, { k: "palette", l: "रङ (Cover)", t: "palette" })); } });
    return A.note("Category को नाम बदल्दा त्यसमा भएका Ebook को Category पनि आफैं बदलिन्छ। नयाँ Category नबनाई Ebook मा नयाँ नाम राखे पनि Public site मा त्यो आफैं देखिन्छ, तर यहाँ बनाउनु राम्रो।") + A.card("Categories", list) + A.card("Bundle र Combo ID", `<p class="muted">Ebook: <code>SN001CS</code> (SN + क्रम + Category Code) · Bundle: <code>SNB001</code> · Custom Combo (Customer ले बनाउने): <code>SNC001</code>।</p>`);
  }
};
})();
