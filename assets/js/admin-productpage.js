/* StudyNotes Product Manager — Product Page नियन्त्रण + Preview PDF (Pages → Slides) + Cover Corner Badges */
(function () {
"use strict";
const A = window.ADM, SN = window.SN, esc = A.esc;
const P = A.pages;
const ebooks = () => A.state.products.filter(p => p.kind !== "bundle");
const pp = () => A.site().productPage;

/* ------------------------------------------------------------ image kind for PDF pages */
A.IMG_KINDS.pvpage = { maxW: 1100, maxH: 1500, type: "image/jpeg", ext: "jpg", quality: 0.82 };

/* ------------------------------------------------------------ PDF → page images (pdf.js, site को आफ्नै folder बाट; CDN चाहिँदैन) */
A.pvLoadPdfjs = async () => {
  if (A._pdfjs) return A._pdfjs;
  const url = p => new URL(A.base + p, location.href).href;
  const m = await import(url("assets/vendor/pdf.min.js"));
  m.GlobalWorkerOptions.workerSrc = url("assets/vendor/pdf.worker.min.js");
  A._pdfjs = m; return m;
};
A.pvAddPages = async (p, paths) => {
  p.preview = SN.normPreview(p.preview);
  const cur = p.preview.pages.slice();
  const room = 10 - cur.length;
  p.preview.pages = cur.concat(paths.slice(0, Math.max(0, room)));
  p.updatedAt = A.now(); A.saveNow();
};
A.pvFromPdf = async (p, file, start, count) => {
  if (file.size > 60 * 1024 * 1024) throw new Error("PDF ६०MB भन्दा ठूलो छ — केवल नमुना पृष्ठ भएको सानो PDF प्रयोग गर्नुहोस्।");
  const pdfjs = await A.pvLoadPdfjs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const s = Math.max(1, Math.min(pdf.numPages, start | 0 || 1));
  const n = Math.max(1, Math.min(10, count | 0 || 10, pdf.numPages - s + 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    A.toast(`Page ${s + i} बनाउँदैछ… (${i + 1}/${n})`, 1500);
    const page = await pdf.getPage(s + i);
    const v1 = page.getViewport({ scale: 1 });
    const scale = Math.min(1100 / v1.width, 1500 / v1.height, 3);
    const vp = page.getViewport({ scale });
    const c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    await page.render({ canvas: c, canvasContext: g, viewport: vp }).promise;
    const blob = await new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("Page image बन्न सकेन"))), "image/jpeg", 0.82));
    out.push(await A.addImage(new File([blob], "pv.jpg", { type: "image/jpeg" }), "pvpage", p.id + "-pv" + (s + i)));
  }
  try { await pdf.destroy(); } catch (e) {}
  return out;
};

document.addEventListener("change", async ev => {
  const el = ev.target;
  if (!el.dataset || !(el.dataset.pvpdf || el.dataset.pvimg)) return;
  const p = A.state.products.find(x => x.id === A.editing);
  const files = [...(el.files || [])]; el.value = "";
  if (!p || !files.length) return;
  try {
    p.preview = SN.normPreview(p.preview);
    if (el.dataset.pvpdf) {
      if (p.preview.pages.length && !confirm("पुराना Preview Pages हटेर यो PDF का नयाँ Pages राखिन्छन्। पक्का?")) return;
      const start = +(A.$("#pvStart") || {}).value || 1, count = +(A.$("#pvCount") || {}).value || 10;
      A.toast("PDF पढ्दैछ…", 2000);
      const paths = await A.pvFromPdf(p, files[0], start, count);
      p.preview.pages = []; await A.pvAddPages(p, paths);
      A.toast(`✓ ${paths.length} Page Slide बने। अब Publish गर्नुहोस्।`, 4000);
    } else {
      const paths = [];
      for (const f of files.slice(0, 10 - p.preview.pages.length)) paths.push(await A.addImage(f, "pvpage", p.id + "-pv"));
      await A.pvAddPages(p, paths);
      A.toast(`✓ ${paths.length} Image थपियो`, 3000);
    }
    A.rerenderKeep(); A.livePreview();
  } catch (e) { console.error(e); A.toast("⚠️ " + (e && e.message || e), 6000); }
});
Object.assign(A.actions, {
  pvpmove(el) { const p = A.state.products.find(x => x.id === A.editing); if (!p) return; const l = p.preview.pages, i = +el.dataset.i, j = i + (+el.dataset.dir); if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; p.updatedAt = A.now(); A.saveNow(); A.rerenderKeep(); },
  pvpdel(el) { const p = A.state.products.find(x => x.id === A.editing); if (!p) return; p.preview.pages.splice(+el.dataset.i, 1); p.updatedAt = A.now(); A.saveNow(); A.rerenderKeep(); },
  pvpclear() { const p = A.state.products.find(x => x.id === A.editing); if (!p || !confirm("सबै Preview Pages हटाउने? (पुरानो ४-Slide Preview फर्कन्छ)")) return; p.preview.pages = []; p.updatedAt = A.now(); A.saveNow(); A.rerenderKeep(); }
});
A.pvPagesBlock = p => {
  const v = p.preview = SN.normPreview(p.preview), touch = () => { p.updatedAt = A.now(); };
  const F = (k, l, x) => A.f(v, Object.assign({ k, l, after: touch }, x || {}));
  const thumbs = v.pages.map((src, i) => `<div style="width:84px;text-align:center"><div style="width:84px;height:112px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#f8fafc"><img src="${esc(A.imgUrl(src))}" alt="" style="width:100%;height:100%;object-fit:cover"></div><div class="small-btns" style="display:flex;gap:2px;justify-content:center;margin-top:3px"><button class="small-btn" data-do="pvpmove" data-i="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""}>←</button><b style="font-size:11px;align-self:center">${i + 1}</b><button class="small-btn" data-do="pvpmove" data-i="${i}" data-dir="1" ${i === v.pages.length - 1 ? "disabled" : ""}>→</button><button class="small-btn" data-do="pvpdel" data-i="${i}" title="हटाउने">✕</button></div></div>`).join("");
  return `<div class="field" style="border:2px solid #fdba74;border-radius:12px;padding:12px;margin-top:6px;background:#fff7ed"><b>📄 Preview PDF → Slides (५–१० पृष्ठ)</b>
    <small style="display:block;margin:4px 0 8px">नमुना PDF (५–१० पृष्ठ) Upload गर्नुहोस् — हरेक पृष्ठ एउटा Slide बन्छ र "Preview PDF हेर्नुहोस्" थिच्दा Slide जस्तै खुल्छ। <b>पूरा Ebook PDF Upload नगर्नुहोस्</b>; केवल यहाँ छानिएका पृष्ठ Image रूपमा Publish हुन्छन्। Pages भएन भने पुरानो ४-Slide Preview चल्छ।</small>
    <div class="button-row"><label class="btn btn-primary file-button">📤 Preview PDF छान्नुहोस्<input type="file" accept="application/pdf" data-pvpdf="1" hidden></label><label class="btn btn-ghost file-button">🖼 वा Images थप्नुहोस्<input type="file" accept="image/*" multiple data-pvimg="1" hidden></label></div>
    <div class="field-row" style="margin-top:8px"><div class="field"><label>PDF को कुन Page देखि</label><input id="pvStart" type="number" min="1" value="1"></div><div class="field"><label>कति Pages (अधिकतम १०)</label><input id="pvCount" type="number" min="1" max="10" value="10"></div></div>
    ${v.pages.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">${thumbs}</div><div class="button-row"><button class="btn btn-ghost" data-do="pvpclear">🗑 सबै Pages हटाउने</button></div>` : '<p class="muted" style="margin:8px 0 0">अहिले कुनै Page छैन।</p>'}
    ${F("pageHook", "हरेक Page मुनिको Hook (खाली = 'Preview — Page {n} / {total}')", { ph: "Preview — Page {n} / {total}", h: "{n}, {total}, {price}, {id}, {name}, {pages}, {chapters} प्रयोग गर्न सकिन्छ।" })}
    ${F("pageCta", "Page Slide को CTA Button Text (खाली = साझा Text)", { ph: "🛒 Add to Cart — {price}" })}
    ${F("keepLocked", "अन्तिममा 🔒 Locked Slide देखाउने (Slide ४ को सेटिङ अनुसार)", { t: "bool" })}</div>`;
};

/* ------------------------------------------------------------ प्रति-Ebook Product Page (यही Ebook मात्र) */
A.pageCard = p => {
  if (p.kind === "bundle") return "";
  const touch = () => { p.updatedAt = A.now(); };
  const opts = SN.PP_ORDER.map(x => [x[0], x[1]]).concat([["career", "🎯 Career Relevance (Outcomes सँग)"], ["stickyCta", "📌 तलको Sticky Order पट्टी"]]);
  return A.card("८. 🧾 यो Ebook को Product Page (वैकल्पिक Override)",
    A.note("सबै Ebook को साझा सेटिङ <b>Product Page</b> मेनुमा छ। यहाँ <b>यही Ebook</b> का लागि मात्र केही खण्ड लुकाउन वा Chapters को संख्या फरक राख्न सकिन्छ।") +
    A.f(p, { k: "pageHide", l: "यो Ebook को पेजमा यी खण्ड लुकाउने", t: "multi", o: opts, after: touch, rerender: false }) +
    A.f(p, { k: "insideCount", l: "Inside the Ebook मा सुरुमा कति Chapter देखाउने (खाली = साझा सेटिङ)", t: "num", min: 1, max: 40, step: 1, after: touch }));
};

/* ------------------------------------------------------------ PRODUCT PAGE मेनु */
const sw = (obj, k, l, h) => A.f(obj, { k, l, t: "bool", h, rerender: false });
P.productpage = {
  title: "Product Page", sub: "Product पेजको हरेक खण्ड, Cover Badge, Chapters Popup र Preview नियन्त्रण",
  render() {
    const c = pp(), H = c.hero, B = c.badges, IN = c.inside, S = c.sections, names = Object.fromEntries(SN.PP_ORDER);
    const sel = ebooks().filter(x => x.status === "published")[0] || ebooks()[0];
    const rows = c.order.map((id, i) => {
      const extra = id === "outcomes" ? `<label class="chk"><input type="checkbox" data-ppvis="career" ${S.career.visible !== false ? "checked" : ""}><span>Career Relevance पनि</span></label>` : "";
      return `<div class="sec-row ${S[id] && S[id].visible === false ? "off" : ""}"><span class="cn">${i + 1}</span><span class="sn">${esc(names[id] || id)}</span><span class="sec-tools">${extra}<label class="switch"><input type="checkbox" data-ppvis="${id}" ${S[id].visible !== false ? "checked" : ""}><i></i></label><button class="small-btn" data-do="ppmove" data-id="${id}" data-dir="-1" ${i === 0 ? "disabled" : ""}>↑</button><button class="small-btn" data-do="ppmove" data-id="${id}" data-dir="1" ${i === c.order.length - 1 ? "disabled" : ""}>↓</button></span></div>`;
    }).join("");
    return A.note("🧾 <b>Product Page नियन्त्रण।</b> यहाँ सबै Ebook को Product पेज (Cover Badge, माथिको भाग, खण्डको क्रम, Chapters Popup, Preview) एकै ठाउँबाट मिलाउन सकिन्छ। Ebook को आफ्नै विवरण (नाम, Price, Chapters, Bonus, Preview PDF) <b>Ebooks</b> मेनुमा हुन्छ। बाँकी सबै Button/Text को शब्द <b>Button / Text</b> मेनुमा हुन्छ। हरेक परिवर्तन माथिको 👁 Preview मा तुरुन्तै देखिन्छ।" + (sel ? ` <button class="btn btn-ghost" data-do="pprev" data-id="${esc(sel.id)}">👁 ${esc(sel.id)} को Product Page Preview</button> <button class="btn btn-ghost" data-go="labels">🔤 Button / Text</button>` : "")) +
      A.card("१. Cover को ४ कुनाका Badge", A.note("Carousel, Library र Product पेजका Cover मा एउटै ४-कुने Badge देखिन्छ: <b>↖ Offer Label</b> (Bundle मा BUNDLE) · <b>↗ Discount %</b> · <b>↙ Rating</b> · <b>↘ Sold / बाँकी Copies</b>। मान खाली भए त्यो कुना आफैं लुक्छ (झुटो संख्या कहिल्यै देखिँदैन)।") +
        A.row(sw(B, "tl", "↖ माथि-बायाँ: Offer Label") + sw(B, "tr", "↗ माथि-दायाँ: Discount %")) + A.row(sw(B, "bl", "↙ तल-बायाँ: Rating") + sw(B, "br", "↘ तल-दायाँ: Sold / बाँकी")) +
        `<h3 style="margin:10px 0 4px">कुन ठाउँमा देखाउने?</h3>` + A.row(sw(B, "carousel", "🎠 Hero Carousel") + sw(B, "library", "📚 Library Cards")) + A.row(sw(B, "product", "📄 Product Page") + sw(B, "preview", "👁 Preview Popup"))) +
      A.card("२. Product Page को माथिको भाग (Hero)", A.row(sw(H, "showBack", "← 'सबै Ebooks' Back button") + sw(H, "showCategory", "Category नाम")) + A.row(sw(H, "showPreviewBtn", "👁 Preview PDF बटन (Cover मुनि)") + sw(H, "showIdChip", "ID: SNxxxx chip")) + A.row(sw(H, "showTag", "Urgency/Offer Tag") + sw(H, "showStats", "Rating · Sold · Pages · Chapters पट्टी")) + A.row(sw(H, "showOfferBox", "Offer / Countdown / बाँकी बक्स") + sw(H, "showTiles", "३ वटा Tile (Delivery · Format · Support)")) + A.row(sw(H, "showWaBtn", "WhatsApp Order बटन") + sw(H, "showPayBtn", "NSPAY Payment बटन"))) +
      A.card("३. खण्डहरूको क्रम र देखाउने/लुकाउने", `<div class="sec-list">${rows}</div>` + sw(S.stickyCta, "visible", "📌 तलको Sticky Order पट्टी देखाउने") + A.note("खाली भएका खण्ड (जस्तै Review नभएको) आफैं लुक्छन्। Hero सधैं सबैभन्दा माथि रहन्छ।")) +
      A.card("४. शीर्षक र पाठ (खाली = साझा Text)",
        A.f(S.hook, { k: "tag", l: "Hook बक्सको Tag", ph: "🏁 तपाईंको पहिलो उपलब्धि" }) +
        A.row(A.f(S.outcomes, { k: "title", l: "Learning Outcomes शीर्षक", ph: "Learning Outcomes" }) + A.f(S.career, { k: "title", l: "Career Relevance शीर्षक", ph: "Career Relevance" })) +
        A.row(A.f(S.price, { k: "title", l: "Price Breakdown शीर्षक" }) + A.f(S.suggested, { k: "title", l: "सुझाव गरिएका Ebooks शीर्षक" })) +
        A.row(A.f(S.suggested, { k: "count", l: "सुझाव कति Ebook (० = लुकाउने)", t: "num", min: 0, max: 8, step: 1 }) + A.f(S.faq, { k: "title", l: "FAQ शीर्षक" })) +
        sw(S.faq, "disclaimer", "⚠️ तलको Disclaimer (Store पेजमा लेखिएको) देखाउने")) +
      A.card("५. Inside the Ebook र 'See all Chapters' Popup", A.note("Product पेजमा सुरुका केही Chapter मात्र देखिन्छन्। बाँकी भए तल बीचमा <b>See all Chapters</b> बटन आउँछ — थिच्दा Popup खुल्छ जसमा सबै Chapter, Hook र CTA देखिन्छ। Chapters सूची Ebook भित्र (Ebooks → Chapters सूची) राखिन्छ।") +
        A.row(A.f(IN, { k: "initialCount", l: "सुरुमा कति Chapter देखाउने", t: "num", min: 1, max: 40, step: 1 }) + A.f(IN, { k: "title", l: "खण्डको शीर्षक", ph: "Inside the Ebook" })) +
        A.row(sw(IN, "showAllBtn", "'See all Chapters' बटन देखाउने") + A.f(IN, { k: "btnText", l: "बटनको Text", ph: "📖 See all Chapters" })) + A.row(sw(IN, "showNumbers", "Chapter नम्बर देखाउने") + sw(IN, "showDesc", "Chapter को छोटो वर्णन (Hook) देखाउने")) +
        `<h3 style="margin:10px 0 4px">Popup</h3>` + A.f(IN, { k: "modalTitle", l: "Popup शीर्षक", ph: "Inside the Ebook — सबै {n} Chapters", h: "{n}=Chapter संख्या, {title}, {id}, {name}, {pages}, {chapters}, {price}" }) +
        A.f(IN, { k: "modalHook", l: "Popup को Hook (माथिको वाक्य)", t: "area", rows: 2, ph: "{n} Chapters मा के-के सिक्नुहुन्छ — पूरा सूची तल हेर्नुहोस्।" }) + sw(IN, "modalShowCta", "Popup मा CTA बटन देखाउने") + A.f(IN, { k: "modalCta", l: "Popup को CTA Text", ph: "🛒 Add to Cart — {price}" })) +
      A.card("६. Preview PDF (Slide)", A.note("Preview PDF Upload, Pages क्रम, Hook र CTA हरेक Ebook को सम्पादनमा <b>६. Preview Slides</b> कार्डमा हुन्छ (५–१० पृष्ठको PDF Upload गर्दा हरेक पृष्ठ एक Slide बन्छ)।") + (sel ? `<button class="btn btn-primary" data-do="pedit" data-id="${esc(sel.id)}">📘 ${esc(sel.id)} सम्पादन गर्नुहोस्</button>` : "")) +
      A.card("७. अन्य", A.note("• <b>Bonus</b> खण्डको Text/Items → <b>Bonus Resources</b> मेनु<br>• Reviews, FAQ, Delivery Steps को सामग्री → <b>Reviews / FAQ / Steps</b> मेनु<br>• Price, Offer, Countdown, Social Proof → <b>Ebooks</b> सम्पादनमा<br>• हरेक Ebook मा अलग खण्ड लुकाउन → Ebooks सम्पादन → <b>८. यो Ebook को Product Page</b>"));
  }
};
document.addEventListener("change", ev => {
  const el = ev.target;
  if (!el.dataset || !el.dataset.ppvis) return;
  const S = pp().sections; (S[el.dataset.ppvis] = S[el.dataset.ppvis] || {}).visible = el.checked;
  A.save(); A.rerenderKeep(); A.livePreview();
});
A.actions.ppmove = el => { const l = pp().order, i = l.indexOf(el.dataset.id), j = i + (+el.dataset.dir); if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; A.save(); A.rerender(); };
})();
