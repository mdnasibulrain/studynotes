/* StudyNotes Product Manager — Bonus Resources (per-Ebook bonus package + Homepage / Product-page section content) */
(function () {
"use strict";
const A = window.ADM, SN = window.SN, esc = A.esc, P = A.pages;
const ebooks = () => A.state.products.filter(p => p.kind !== "bundle");
const TYPE_OPTS = SN.BONUS_TYPES.map(t => [t[0], t[1]]);
const DEFAULT_SEQ = ["workbook", "templates", "action", "custom"];

/* state of one Ebook's bonus, for the status chip */
A.bonusState = p => {
  const b = SN.normBonus(p.bonus), now = Date.now();
  const vis = b.items.filter(x => x.visible && x.title).length;
  if (!b.enabled) return ["off", "बन्द"];
  if (!vis) return ["warn", "देखिने Item छैन"];
  const s = SN.parseTime(b.start), e = SN.parseTime(b.end);
  if (s !== null && now < s) return ["wait", "सुरु हुन बाँकी"];
  if (e !== null && now >= e) return ["exp", "समय सकियो (लुकेको)"];
  return ["on", e ? "सक्रिय · " + SN.formatDateTime(e) + " सम्म" : "सक्रिय · समय सीमा छैन"];
};
const CHIP = { off: "#64748b", warn: "#b45309", wait: "#0369a1", exp: "#b91c1c", on: "#047857" };

/* the whole editor for one Ebook's bonus (used inside the Ebook editor AND the Bonus page) */
A.bonusEditor = (p, opt) => {
  opt = opt || {};
  p.bonus = SN.normBonus(p.bonus);
  const b = p.bonus, touch = () => { p.updatedAt = A.now(); };
  const F = spec => A.f(b, Object.assign({}, spec, { after: () => { touch(); if (spec.rerender !== false && spec.k === "enabled") A.rerenderKeep(); } }));
  const st = A.bonusState(p);
  const status = `<div class="notice-box"><b>अवस्था:</b> <span style="color:${CHIP[st[0]]};font-weight:800">${esc(st[1])}</span> — Public site मा Bonus तब मात्र देखिन्छ जब यो चालु छ, देखिने Item छ, र Offer को समय बाँकी छ।</div>`;
  const items = A.coll({
    id: "bonus-" + p.id, list: b.items, label: x => (x.title || "(Title छैन)") + (x.type ? " · " + x.type : ""), vis: "visible", addText: "＋ Bonus Resource थप्नुहोस्", empty: "अहिले कुनै Bonus छैन — तल बटनले थप्नुहोस्।",
    make: () => ({ type: DEFAULT_SEQ[Math.min(b.items.length, 3)], title: "", description: "", icon: "", cover: "", file: "", value: null, order: null, visible: true, tag: "" }),
    after: touch,
    item: x => A.row(A.f(x, { k: "type", l: "प्रकार", t: "select", o: TYPE_OPTS, rerender: false, after: touch }) + A.f(x, { k: "tag", l: "Tag (खाली = BONUS 1, 2…)", ph: "BONUS 1", after: touch })) +
      A.f(x, { k: "title", l: "Bonus को नाम (Title) *", ph: "Workbook: Practice Exercises", after: touch }) +
      A.f(x, { k: "description", l: "छोटो वर्णन", t: "area", rows: 3, ph: "Exercises, Practice, Self-tests, Skill development", after: touch }) +
      A.row(A.f(x, { k: "icon", l: "Icon (खाली = प्रकार अनुसार)", t: "icon", after: touch }) + A.f(x, { k: "value", l: "वास्तविक मूल्य (वैकल्पिक)", t: "num", min: 0, step: 1, h: "खाली = मूल्य देखिँदैन। वास्तविक मूल्य मात्र राख्नुहोस्।", after: touch })) +
      A.f(x, { k: "cover", l: "Bonus Image / Cover (वैकल्पिक)", t: "image", kind: "cover", prefix: () => p.id + "-bonus-" + x.id, h: "सानो Image आफैं बनाइन्छ। नराखे Icon देखिन्छ।", after: touch }) +
      A.f(x, { k: "file", l: "🔒 PDF फाइलको नाम / Private Delivery Reference", ph: "SN001CS-Workbook.pdf", h: "यो केवल तपाईंको Admin मा सुरक्षित रहन्छ — Public site/GitHub मा कहिल्यै जाँदैन। Payment पछि WhatsApp/Email बाट हातले पठाउनुहोस्।", after: touch })
  });
  const ctl =
    A.row(F({ k: "enabled", l: "✅ यो Ebook को Bonus चालु", t: "bool" }) + F({ k: "showCountdown", l: "⏳ Offer-end Countdown देखाउने", t: "bool" })) +
    A.row(F({ k: "showOnHome", l: "Homepage मा देखाउने", t: "bool" }) + F({ k: "showOnProduct", l: "Product पेजमा देखाउने", t: "bool" })) +
    A.row(F({ k: "start", l: "Bonus Offer सुरु हुने समय (नेपाल समय)", t: "dt", h: "खाली = अहिले नै" }) + F({ k: "end", l: "Bonus Offer सकिने समय (नेपाल समय)", t: "dt", h: "यो समय पछि Bonus Offer आफैं लुक्छ। खाली = समय सीमा छैन (सीमित-समय वाक्य/Countdown देखिँदैन)।" })) +
    F({ k: "headline", l: "यो Ebook को विशेष शीर्षक (वैकल्पिक)", ph: "Resume Mastery Complete Package" }) +
    F({ k: "hook", l: "Hook वाक्य (खाली = Site को सामान्य Hook)", ph: "Buy Before the Offer Ends & Unlock Your Exclusive Bonuses!" }) +
    A.row(F({ k: "cta", l: "CTA बटन Text (खाली = सामान्य)", ph: "Bonus सहित Order गर्नुहोस्" }) ) +
    F({ k: "eligibility", l: "को पाउँछ? (Eligibility वाक्य, खाली = सामान्य)", t: "area", rows: 2 });
  return status + ctl + `<div class="field"><label>Bonus Resources सूची (क्रम ↑↓ बाट मिलाउनुहोस्)</label>${items}</div>`;
};

/* card shown inside the Ebook editor */
A.bonusCard = p => A.card("६. 🎁 Bonus Resources", A.note("एउटा Ebook सँग Workbook · Templates · Action Plan जस्ता Bonus दिन सकिन्छ। <b>मूल PDF/Workbook यहाँ Upload हुँदैन</b> — केवल नाम/वर्णन Public हुन्छ; फाइल तपाईं हातले पठाउनुहुन्छ।") + A.bonusEditor(p));

/* ------------------------------------------------------------ BONUS PAGE */
A.bonusSel = null;
const siteCard = (key, title) => {
  const c = A.site().bonus[key], f = (k, l, extra) => A.f(c, Object.assign({ k, l }, extra || {}));
  return A.card(title, A.row(f("enabled", "✅ यो खण्ड देखाउने", { t: "bool" }) + (key === "home" ? "" : f("showValue", "Value देखाउने", { t: "bool" }))) +
    (key === "home" ? A.row(f("showValue", "Value देखाउने", { t: "bool" }) + f("maxProducts", "अधिकतम Ebook (Homepage)", { t: "num", min: 1, max: 12, step: 1 })) : "") +
    f("eyebrow", "माथिको सानो Label") + f("title", "मुख्य शीर्षक", { t: "area", rows: 2 }) + f("sub", "Sub-शीर्षक") + f("tagline", "Tagline", { h: "जस्तै: One Book. Multiple Resources. Real Results." }) +
    A.row(f("mainTitle", "MAIN EBOOK Label") + f("mainDesc", "MAIN EBOOK को वर्णन")) +
    f("hooks", "Hook पङ्क्ति (एक लाइनमा एक)", { t: "lines", rows: 3, h: "Ebook को आफ्नै Hook भए त्यही प्रयोग हुन्छ।" }) +
    A.row(f("cta", "CTA बटन (WhatsApp)") + (key === "home" ? f("viewCta", "Bonus हेर्ने बटन") : "")) +
    f("eligibility", "को पाउँछ? (Eligibility वाक्य)", { t: "area", rows: 2 }));
};
P.bonus = {
  title: "Bonus Resources", sub: "प्रत्येक Ebook को आफ्नै Bonus Package · Homepage र Product पेजको खण्ड",
  render() {
    const s = A.site(), list = ebooks();
    if (!A.bonusSel || !list.find(p => p.id === A.bonusSel)) A.bonusSel = (list[0] || {}).id || null;
    const rows = list.map(p => { const st = A.bonusState(p), n = SN.normBonus(p.bonus).items.length;
      return `<div class="product-row ${p.id === A.bonusSel ? "sel" : ""}" data-do="bsel" data-id="${esc(p.id)}"><div class="mini-cover ph">🎁</div><div><div class="row-title">${esc(p.title || p.id)}</div><div class="row-sub"><b>${esc(p.id)}</b> · ${n} Bonus · <span style="color:${CHIP[st[0]]};font-weight:800">${esc(st[1])}</span></div></div></div>`; }).join("");
    const cur = list.find(p => p.id === A.bonusSel);
    const sel = "";
    return A.note("🎁 <b>Bonus कसरी काम गर्छ?</b> Ebook छान्नुहोस् → Bonus चालु गर्नुहोस् → Items थप्नुहोस् → Offer सकिने समय राख्नुहोस् → <b>Publish</b>। समय सकिएपछि Bonus Offer Public site बाट आफैं हट्छ। <br>मूल PDF/Workbook/Template GitHub मा कहिल्यै जाँदैन — पहिलेकै तरिकाले Payment पुष्टि भएपछि हातले पठाउनुहोस्।") +
      A.card("सबै Ebook को Bonus अवस्था", `<div class="product-list">${rows || '<p class="muted">पहिले Ebook थप्नुहोस्।</p>'}</div>`) +
      A.card(cur ? "Bonus सम्पादन — " + esc(cur.title || cur.id) : "Bonus सम्पादन", sel + (cur ? A.bonusEditor(cur) : "")) +
      siteCard("home", "Homepage को Bonus खण्ड (सबै Ebook को साझा Text)") + siteCard("product", "Product पेजको Bonus खण्ड (साझा Text)") +
      A.card("साझा Labels", A.row(A.f(s.bonus, { k: "valueLabel", l: "Item को Value Label", h: "{value}" }) + A.f(s.bonus, { k: "totalLabel", l: "कुल Value वाक्य", h: "{value}" })) + A.row(A.f(s.bonus, { k: "countdownText", l: "Countdown वाक्य", h: "{time}" }) + A.f(s.bonus, { k: "limitedText", l: "सीमित-समय Tag" })) + A.f(s.bonus, { k: "untilText", l: "'…सम्म मात्र' वाक्य", h: "{date}" }));
  }
};
A.actions.bsel = el => { A.bonusSel = el.dataset.id; A.rerenderKeep(); };
})();
