/* StudyNotes Product Manager — pages (part 2): Marketing, Steps, Reviews, FAQ, Payment, Delivery, WhatsApp, Email, Social, SEO, Messages, Labels, Publishing, Backup */
(function () {
"use strict";
const A = window.ADM, SN = window.SN, esc = A.esc, P = A.pages;
const ebooks = () => A.state.products.filter(p => p.kind !== "bundle");
const PH = (list) => `<div class="phs">${list.map(x => `<code>${x}</code>`).join(" ")}</div>`;

/* ------------------------------------------------------------ MARKETING */
P.marketing = {
  title: "Marketing", sub: "Ticker, Hooks, Mission/Career, Final CTA, माथिको Offer पट्टी",
  render() {
    const s = A.site(), t = s.ticker;
    return A.card("माथिको Offer पट्टी", A.note("यो पट्टी तब मात्र देखिन्छ जब वास्तविक आधार हुन्छ — चालु Offer को Countdown, वास्तविक बाँकी Copies (Product मा राखेको), वा Discount %। केही नभए आफैं लुक्छ।") + A.row(A.f(s, { k: "topbar.liveBadge", l: "सानो अक्षर (Live badge)" }) + A.f(s, { k: "topbar.liveLabel", l: "शीर्षक" }) + A.f(s, { k: "topbar.tickerLabel", l: "Ticker को लेबल" })) + A.row(A.f(s, { k: "topbar.stockText", l: "बाँकी Copies वाक्य", h: "{left} र {short} प्रयोग गर्नुहोस्" }) + A.f(s, { k: "topbar.discountText", l: "Discount वाक्य", h: "{discount} प्रयोग गर्नुहोस्" }))) +
      A.card("Announcement Ticker (घुम्ने सन्देश)", A.f(t, { k: "autoOffers", l: "Offers पेजका चालु Offer हरू Ticker मा आफैं देखाउने", t: "bool" }) + A.f(t, { k: "autoCombo", l: "Combo Discount को सन्देश आफैं देखाउने", t: "bool" }) + A.f(t, { k: "comboText", l: "Combo सन्देश", h: "{comboMin} र {comboPercent}" }) +
        A.coll({ id: "ticker", list: t.items, label: i => i.text, vis: "visible", addText: "Ticker सन्देश थप्नुहोस्", empty: "अतिरिक्त सन्देश छैन।", make: () => ({ text: "", visible: true, start: null, end: null, ctaText: "", ctaAction: "section:explore" }), item: i => A.f(i, { k: "text", l: "सन्देश" }) + A.row(A.f(i, { k: "start", l: "देखाउन सुरु (वैकल्पिक)", t: "dt" }) + A.f(i, { k: "end", l: "देखाउन बन्द (वैकल्पिक)", t: "dt" })) + A.row(A.f(i, { k: "ctaText", l: "Link शब्द", ph: "हेर्नुहोस्" }) + A.f(i, { k: "ctaAction", l: "क्लिक गर्दा के हुने?", t: "action" })) })) +
      A.card("Hooks / फाइदा पट्टी (Hero तलका ४ बक्स)", A.note("Placeholder: <code>{delivery}</code> Delivery समय, <code>{deliveryMethod}</code>, <code>{whatsappDisplay}</code>, <code>{email}</code>") +
        A.coll({ id: "trust", list: s.trust.items, label: i => i.title, vis: "visible", addText: "Hook थप्नुहोस्", make: () => ({ icon: "star", title: "", text: "", visible: true }), item: i => A.row(A.f(i, { k: "icon", l: "Icon", t: "icon" }) + A.f(i, { k: "title", l: "शीर्षक" })) + A.f(i, { k: "text", l: "वर्णन" }) })) +
      A.card("Mission / Career (About खण्ड)", A.row(A.f(s, { k: "about.eyebrow", l: "सानो शीर्षक", h: "{storeNameUpper}" }) + A.f(s, { k: "about.heading", l: "शीर्षक", h: "{storeName}, {founder}" })) + A.f(s, { k: "about.text", l: "Mission / Career सन्देश", t: "area", rows: 5 })) +
      A.card("Final CTA (अन्तिम निर्णय बक्स)", A.f(s, { k: "finalcta.pill", l: "सानो Pill" }) + A.f(s, { k: "finalcta.heading", l: "ठूलो शीर्षक (नयाँ लाइनका लागि Enter)", t: "area", rows: 2 }) + A.f(s, { k: "finalcta.text", l: "वर्णन", t: "area", rows: 2, h: "{maxDiscount} = हाल सबैभन्दा बढी Discount % (नभए यो वाक्य आफैं हट्छ)" }) + A.f(s, { k: "finalcta.countdownLabel", l: "Countdown को शब्द", h: "Countdown तब मात्र देखिन्छ जब कुनै Offer को वास्तविक अन्त्य मिति छ।" }) +
        A.coll({ id: "cta", list: s.finalcta.buttons, max: 3, label: b => b.text, vis: "visible", addText: "Button थप्नुहोस्", make: () => ({ text: "", action: "section:explore", visible: true }), item: b => A.row(A.f(b, { k: "text", l: "Button को शब्द" }) + A.f(b, { k: "action", l: "के गर्ने?", t: "action" })) }));
  }
};

/* ------------------------------------------------------------ STEPS */
P.steps = {
  title: "Steps (कसरी किन्ने)", sub: "Ebook कसरी प्राप्त गर्ने भन्ने चरणहरू",
  render() {
    const s = A.site();
    return A.card("शीर्षक", A.row(A.f(s, { k: "steps.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "steps.title", l: "शीर्षक" })) + A.f(s, { k: "steps.sub", l: "उपशीर्षक", h: "{stepCount} चरण संख्या, {delivery} Delivery समय" })) +
      A.card("चरणहरू", A.coll({ id: "steps", list: s.steps.items, label: i => i.title, vis: "visible", addText: "चरण थप्नुहोस्", make: () => ({ icon: "star", title: "", text: "", visible: true }), item: i => A.row(A.f(i, { k: "icon", l: "Icon", t: "icon" }) + A.f(i, { k: "title", l: "शीर्षक" })) + A.f(i, { k: "text", l: "वर्णन", t: "area", rows: 2 }) }));
  }
};

/* ------------------------------------------------------------ REVIEWS */
P.reviews = {
  title: "Reviews / Testimonials", sub: "वास्तविक ग्राहकको Review र WhatsApp कुराकानी",
  render() {
    const s = A.site(), pOpts = [["", "(कुनै Ebook होइन)"]].concat(ebooks().map(e => [e.id, e.id + " — " + (e.title || "")]));
    return A.note("⚠️ <b>वास्तविक ग्राहकको, उनीहरूको अनुमति सहितको</b> Review मात्र राख्नुहोस्। नक्कली Review नराख्नुहोस्। यहाँ केही नराखे Reviews/Testimonial खण्ड Public site मा <b>आफैं लुक्छ</b>।") +
      A.card("Reviews खण्डको शीर्षक", A.row(A.f(s, { k: "reviews.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "reviews.title", l: "शीर्षक" })) + A.f(s, { k: "reviews.sub", l: "उपशीर्षक" })) +
      A.card("Reviews", A.coll({ id: "reviews", list: s.reviews.items, label: r => (r.name || "(नाम छैन)") + (r.text ? " — " + r.text.slice(0, 40) : ""), vis: "visible", addText: "Review थप्नुहोस्", empty: "अहिले Review छैन।", make: () => ({ name: "", place: "", rating: 5, productId: "", date: "", text: "", verified: false, visible: true }),
        item: r => A.row(A.f(r, { k: "name", l: "ग्राहकको नाम" }) + A.f(r, { k: "place", l: "ठाउँ" })) + A.f(r, { k: "text", l: "Review", t: "area", rows: 3 }) + A.row(A.f(r, { k: "rating", l: "Rating (१–५)", t: "num", min: 1, max: 5, step: 1 }) + A.f(r, { k: "productId", l: "कुन Ebook को?", t: "select", o: pOpts }) + A.f(r, { k: "date", l: "मिति/समय (वैकल्पिक)" })) + A.f(r, { k: "verified", l: "✅ “Verified” चिन्ह (वास्तविक खरिदकर्ता पुष्टि भए मात्र)", t: "bool" }) })) +
      A.card("WhatsApp Testimonial कुराकानी", A.row(A.f(s, { k: "chat.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "chat.title", l: "शीर्षक" })) + A.f(s, { k: "chat.sub", l: "उपशीर्षक" }) + A.row(A.f(s, { k: "chat.headerName", l: "Chat माथिको नाम" }) + A.f(s, { k: "chat.status", l: "Status" }) + A.f(s, { k: "chat.inputText", l: "तलको Input शब्द" })) +
        A.coll({ id: "chat", list: s.chat.items, label: m => (m.from === "out" ? "→ " : "← ") + (m.text || "").slice(0, 40), vis: "visible", addText: "सन्देश थप्नुहोस्", empty: "कुराकानी छैन — खण्ड लुकेको छ।", make: () => ({ from: "in", name: "", time: "", text: "", visible: true }), item: m => A.row(A.f(m, { k: "from", l: "कसले?", t: "select", o: [["in", "ग्राहक (सेतो)"], ["out", "हामी (हरियो)"]] }) + A.f(m, { k: "name", l: "ग्राहकको नाम" }) + A.f(m, { k: "time", l: "समय (10:21)" })) + A.f(m, { k: "text", l: "सन्देश", t: "area", rows: 2 }) }), { sub: "वास्तविक कुराकानीको Screenshot बाट, ग्राहकको अनुमति सहित मात्र।" });
  }
};

/* ------------------------------------------------------------ FAQ */
P.faq = {
  title: "FAQ", sub: "अक्सर सोधिने प्रश्न",
  render() {
    const s = A.site();
    return A.card("शीर्षक", A.row(A.f(s, { k: "faq.eyebrow", l: "सानो शीर्षक" }) + A.f(s, { k: "faq.title", l: "शीर्षक" }) + A.f(s, { k: "faq.productTitle", l: "Product पेजको FAQ शीर्षक" }))) +
      A.card("प्रश्न र उत्तर", PH(["{delivery}", "{whatsappDisplay}", "{email}", "{comboMin}", "{comboPercent}", "{categories}", "{storeName}"]) + `<p class="muted">माथिका Placeholder ले Admin का मान आफैं भर्छन्। खाली मान भएमा त्यो वाक्य आफैं हट्छ।</p>` +
        A.coll({ id: "faq", list: s.faq.items, label: f => f.q, vis: "visible", addText: "प्रश्न थप्नुहोस्", make: () => ({ q: "", a: "", visible: true, onProduct: false }), item: f => A.f(f, { k: "q", l: "प्रश्न" }) + A.f(f, { k: "a", l: "उत्तर", t: "area", rows: 4 }) + A.f(f, { k: "onProduct", l: "Product पेजमा पनि देखाउने", t: "bool" }) }));
  }
};

/* ------------------------------------------------------------ PAYMENT + CART */
P.payment = {
  title: "Payment / NSPAY / Cart", sub: "Payment निर्देशन, Button शब्द र Cart नियम",
  render() {
    const s = A.site();
    return A.note("ℹ️ Payment <b>म्यानुअल</b> रूपमा नै जाँचिन्छ: Customer NSPAY मा Payment गर्छ → Screenshot + Product ID WhatsApp मा पठाउँछ → तपाईं आफैं पुष्टि गरी Ebook पठाउनुहुन्छ। यहाँ केवल Link र शब्द राखिन्छ — कुनै Secret/Key होइन।") +
      A.card("NSPAY", A.f(s, { k: "payment.nspayUrl", l: "NSPAY Payment Link", h: "खाली राखे NSPAY Button आफैं लुक्छ (WhatsApp Order मात्र रहन्छ)।" }) + A.row(A.f(s, { k: "payment.ctaText", l: "Cart को Button शब्द" }) + A.f(s, { k: "payment.ctaNow", l: "Product पेजको ठूलो Button" }) + A.f(s, { k: "payment.ctaShort", l: "तलको छोटो Button" })) +
        A.f(s, { k: "payment.instructions", l: "Payment पछिको निर्देशन (Cart मुनि)", t: "area", rows: 3, h: "{whatsappDisplay} प्रयोग गर्न सकिन्छ।" }) + A.f(s, { k: "payment.copiedToast", l: "Order Copy भएपछि देखिने सन्देश" })) +
      A.card("Product पेजका ३ चरण (Payment → Screenshot → Ebook)", A.coll({ id: "paysteps", list: s.payment.steps, max: 4, label: i => i.title, addText: "चरण थप्नुहोस्", make: () => ({ icon: "star", title: "", text: "" }), item: i => A.row(A.f(i, { k: "icon", l: "Icon", t: "icon" }) + A.f(i, { k: "title", l: "शीर्षक" })) + A.f(i, { k: "text", l: "वर्णन", h: "{productId} = त्यो Ebook को ID, {delivery} = Delivery समय" }) })) +
      A.card("Cart सेटिङ", A.f(s, { k: "cart.enabled", l: "🛒 Cart प्रयोग गर्ने (Off गरे सीधा WhatsApp/NSPAY Order मात्र)", t: "bool" }) + A.f(s, { k: "cart.comboEnabled", l: "🧩 Combo Discount चालु", t: "bool" }) + A.row(A.f(s, { k: "cart.comboMin", l: "कम्तीमा कति Ebook छान्दा Combo Discount?", t: "num", min: 2, step: 1 }) + A.f(s, { k: "cart.comboPercent", l: "Combo Discount %", t: "num", min: 0, max: 90, step: 1 })) + `<p class="muted">यो नियम Cart, Custom Combo, FAQ, Ticker र WhatsApp Order Message सबैमा आफैं लाग्छ।</p>`);
  }
};

/* ------------------------------------------------------------ DELIVERY */
P.delivery = {
  title: "Delivery", sub: "Ebook कसरी र कति समयमा पठाइन्छ",
  render() {
    const s = A.site();
    return A.note("Delivery म्यानुअल हो — Payment पुष्टि गरेपछि तपाईं WhatsApp/Email बाट PDF पठाउनुहुन्छ। यहाँको समय Website का सबै ठाउँमा (Hook, FAQ, Steps, Product पेज) देखिन्छ। <b>मूल PDF यहाँ/GitHub मा कहिल्यै राखिँदैन।</b>") +
      A.card("Delivery विवरण", A.row(A.f(s, { k: "delivery.time", l: "Delivery समय", h: "{delivery} बाट सबै वाक्यमा प्रयोग हुन्छ। जस्तै: 3–5 मिनेट" }) + A.f(s, { k: "delivery.short", l: "छोटो रूप (Hero बक्स)", h: "जस्तै: 3–5 min। खाली = लुक्छ" })) + A.f(s, { k: "delivery.method", l: "Delivery माध्यम", h: "{deliveryMethod}" }) + A.f(s, { k: "delivery.text", l: "Delivery को पूरा वाक्य", t: "area", rows: 2, h: "वाक्यहरूमा <code>{deliveryText}</code> लेखेर प्रयोग गर्न सकिन्छ।" })) +
      A.card("Ebook को Disclaimer (Product पेजको तल)", A.f(s, { k: "product.disclaimer", l: "Disclaimer", t: "area", rows: 3, h: "खाली = लुक्छ" }));
  }
};

/* ------------------------------------------------------------ WHATSAPP / EMAIL / SOCIAL */
P.whatsapp = {
  title: "WhatsApp", sub: "Order आउने नम्बर र Button",
  render() {
    const s = A.site(), c = s.contact;
    return A.card("WhatsApp", A.row(A.f(c, { k: "whatsapp", l: "WhatsApp नम्बर (देश कोड सहित, अङ्क मात्र)", ph: "9779702784684", h: "जस्तै: 977 + नम्बर। यही नम्बरमा सबै Order Message जान्छ।" }) + A.f(c, { k: "whatsappDisplay", l: "देखाउने रूप (वैकल्पिक)", ph: "+977 9702784684", h: "खाली भए आफैं बन्छ" })) +
      A.row(A.f(c, { k: "whatsappCta", l: "WhatsApp Button को शब्द" }) + A.f(c, { k: "supportHours", l: "Support समय (वैकल्पिक)", ph: "बिहान ८ – राति ९" })) + A.f(c, { k: "supportText", l: "Support को थप वाक्य (वैकल्पिक)" }) +
      A.f(c, { k: "contactMessage", l: "“Message गर्नुहोस्” थिच्दा पहिले नै लेखिने सन्देश", t: "area", rows: 2, h: "{storeName}" })) + A.note("WhatsApp Order को पूरा Message ढाँचा <b>Messages</b> पेजमा सम्पादन गर्न सकिन्छ।");
  }
};
P.email = {
  title: "Email", sub: "Support Email",
  render() { const c = A.site().contact; return A.card("Email", A.row(A.f(c, { k: "supportEmail", l: "Support Email" }) + A.f(c, { k: "businessEmail", l: "Business Email (वैकल्पिक)" })) + A.f(c, { k: "emailCta", l: "Email Button को शब्द" })); }
};
P.social = {
  title: "Social Links", sub: "Footer मा देखिने Social Link",
  render() {
    const s = A.site();
    return A.card("Social Links", A.note("Link राखेर <b>Off/On</b> गर्नुहोस्। बन्द वा Link नभएको Public site मा देखिँदैन। (WhatsApp छुट्टै 'WhatsApp' पेजबाट चल्छ।)") + A.coll({ id: "social", list: s.social, vis: "enabled", label: i => i.name + (i.enabled && i.id !== "whatsapp" ? " ✓" : ""), addText: "अर्को Link थप्नुहोस्", make: () => ({ name: "", enabled: true, url: "https://" }), item: i => A.row(A.f(i, { k: "name", l: "नाम" }) + (i.id === "whatsapp" ? "" : A.f(i, { k: "url", l: "Link (https://...)" }))) }));
  }
};

/* ------------------------------------------------------------ SEO */
P.seo = {
  title: "SEO / Share", sub: "Google र Social Media मा देखिने विवरण",
  render() {
    const s = A.site(), sc = s.seo;
    const url = (sc.siteUrl || "").replace(/\/+$/, "");
    const ogAbs = sc.ogImage ? (url ? url + "/" + sc.ogImage : "(Site URL राख्नुहोस्)") : "";
    const snip = `<!-- StudyNotes share preview (WhatsApp/Facebook): index.html को <head> भित्र राख्नुहोस् -->\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="${esc(s.store.name)}">\n<meta property="og:title" content="${esc(SN.fill(sc.ogTitle || sc.title, { storeName: s.store.name, tagline: s.store.tagline }, "keep"))}">\n<meta property="og:description" content="${esc(SN.fill(sc.ogDescription || sc.description, { storeName: s.store.name }, "keep"))}">\n${url ? `<meta property="og:url" content="${esc(url)}/">\n` : ""}${ogAbs ? `<meta property="og:image" content="${esc(ogAbs)}">\n` : ""}<meta name="twitter:card" content="summary_large_image">`;
    return A.card("Browser र Google", A.f(sc, { k: "title", l: "Page Title (Browser tab / Google)" }) + A.f(sc, { k: "description", l: "Description", t: "area", rows: 3 }) + A.f(sc, { k: "keywords", l: "Keywords (वैकल्पिक)" }) + A.f(sc, { k: "favicon", l: "Favicon (सानो चिन्ह)", t: "image", kind: "favicon", prefix: "site-favicon", h: "नराखे Logo वा Default चिन्ह प्रयोग हुन्छ।" })) +
      A.card("Social Share (Facebook / WhatsApp)", A.f(sc, { k: "ogTitle", l: "Share Title (खाली = Page Title)" }) + A.f(sc, { k: "ogDescription", l: "Share Description (खाली = Description)", t: "area", rows: 2 }) + A.f(sc, { k: "ogImage", l: "Share Image (१२००×६३० आफैं बन्छ)", t: "image", kind: "og", prefix: "site-og" }) + A.f(sc, { k: "siteUrl", l: "तपाईंको Website को पूरा Address", ph: "https://studynotes.example.com", h: "Share Image को पूरा Link बनाउन चाहिन्छ।" })) +
      A.note("⚠️ <b>एक कुरा इमान्दारीसँग:</b> Browser Tab, Google Title/Description र Favicon यहाँबाट आफैं अपडेट हुन्छन्। तर <b>Facebook/WhatsApp ले Page को JavaScript चलाउँदैनन्</b>, त्यसैले उनीहरूको Share Preview का लागि तलको ५ लाइन <b>एक पटक</b> GitHub मा <code>index.html</code> को <code>&lt;head&gt;</code> भित्र राख्नुपर्छ (यो Worker बाट हुँदैन)। परिवर्तन गरेपछि फेरि Copy गरेर राख्नुहोस्।") + A.card("एक पटक राख्ने Share Code", `<textarea readonly rows="8" class="code" id="ogSnip">${snip}</textarea><div class="button-row"><button class="btn btn-ghost" data-do="copySnip">📋 Copy</button></div>`);
  }
};

/* ------------------------------------------------------------ MESSAGES */
A.msg = { key: "order", ids: [], customer: "", ref: "", phone: "" };
A.msgOutput = () => {
  const s = A.site(), m = A.msg;
  const all = A.state.products.map(p => p.id);
  const pub = A.publicBuild({ forceInclude: all });
  const rt = SN.runtime(pub.catalog, pub.settings, Date.now());
  const by = Object.assign({}, rt.EBYID, Object.fromEntries(rt.bundles.map(b => [b.id, b])));
  const list = m.ids.map(id => by[id]).filter(Boolean).map(it => ({ id: it.id, kind: it.kind, title: it.title, ebookIds: it.kind === "ebook" ? [it.id] : it.includes, regularPrice: it.regularPrice, todayPrice: it.salePrice, comboOff: 0 }));
  const sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
  const regular = sum(list, i => i.regularPrice), today = sum(list, i => i.todayPrice), singles = list.filter(i => i.kind === "ebook");
  const comboD = s.cart.comboEnabled && singles.length >= s.cart.comboMin ? Math.round(sum(singles, i => i.todayPrice) * s.cart.comboPercent / 100) : 0;
  const t = { regular, today, todayDiscount: regular - today, comboDiscount: comboD, final: today - comboD, saved: regular - (today - comboD), ebookCount: sum(list, i => i.ebookIds.length) };
  const f = n => SN.fmt(n, s.store.currency);
  const vars = SN.msgVars(s, list, t, f, { customerName: m.customer, paymentReference: m.ref, deliveryText: s.delivery.text, deliveryMethod: s.delivery.method });
  if (!list.length) { vars.productName = ""; vars.productId = ""; vars.total = ""; }
  return SN.renderMessage(s.messages[m.key] || "", vars);
};
A.updateMsg = () => { const o = A.$("#msgOut"); if (o) o.value = A.msgOutput(); };
P.messages = {
  title: "Messages (Templates)", sub: "WhatsApp Order, Payment, Delivery, Support Message ढाँचा",
  render() {
    const s = A.site(), m = A.msg;
    const picks = A.state.products.filter(p => p.kind !== "site").map(p => [p.id, p.id + " — " + (p.title || "") + (p.kind === "bundle" ? " (Bundle)" : "")]);
    return A.note("📨 <b>Order Message</b> (पहिलो) Customer ले WhatsApp Button थिच्दा Public site बाट जान्छ। अन्य ५ वटा तपाईंले आफैं (म्यानुअल) ग्राहकलाई पठाउन प्रयोग गर्ने ढाँचा हुन् — तलको “Message बनाउनुहोस्” बाट तयार गरी Copy/WhatsApp गर्नुहोस्। यी Message का शब्द Public data मा पनि जान्छन् (गोप्य कुरा नलेख्नुहोस्)।") +
      A.card("Placeholder सूची", `<div class="phs">${SN.PLACEHOLDERS.map(p => `<span title="${esc(p[1])}"><code>${esc(p[0])}</code> ${esc(p[1])}</span>`).join("")}</div><p class="muted">खाली मान भएको लाइन आफैं हट्छ (जस्तै Combo Discount नभए त्यो लाइन)।</p>`) +
      A.card("ढाँचाहरू", SN.MESSAGE_KEYS.map(k => `<div class="field"><label>${esc(k[1])}</label>${A.f(s.messages, { k: k[0], t: "area", rows: 6, after: A.updateMsg }).replace('<div class="field ">', "<div>")}<div class="button-row"><button class="small-btn" type="button" data-do="msgReset" data-k="${k[0]}">Default फर्काउनुहोस्</button></div></div>`).join("")) +
      A.card("Message बनाउनुहोस् (Copy / WhatsApp)", A.f(m, { k: "key", l: "कुन Message?", t: "select", o: SN.MESSAGE_KEYS.map(k => [k[0], k[1]]), after: A.updateMsg }) + A.f(m, { k: "ids", l: "Product / Bundle छान्नुहोस्", t: "multi", o: picks, after: A.updateMsg }) + A.row(A.f(m, { k: "customer", l: "ग्राहकको नाम", after: A.updateMsg }) + A.f(m, { k: "ref", l: "Payment Reference (भए)", after: A.updateMsg })) + A.f(m, { k: "phone", l: "ग्राहकको WhatsApp नम्बर (देश कोड सहित, वैकल्पिक)", after: A.updateMsg }) + `<div class="field"><label>तयार Message</label><textarea id="msgOut" rows="9" readonly class="code">${esc(A.msgOutput())}</textarea></div><div class="button-row"><button class="btn btn-primary" data-do="msgCopy">📋 Copy</button><button class="btn btn-ghost" data-do="msgWa">💬 WhatsApp मा खोल्नुहोस्</button></div>`);
  }
};
A.actions.msgReset = el => { const k = el.dataset.k; A.site().messages[k] = SN.DEFAULTS.messages[k]; A.save(); A.rerender(); };
A.actions.msgCopy = () => { const t = A.$("#msgOut").value; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => A.toast("✓ Copy भयो"), () => { A.$("#msgOut").select(); document.execCommand("copy"); A.toast("✓ Copy भयो"); }); };
A.actions.msgWa = () => { const t = A.$("#msgOut").value; const n = SN.waDigits(A.msg.phone); window.open((n ? "https://wa.me/" + n : "https://wa.me/") + "?text=" + encodeURIComponent(t), "_blank", "noopener"); };
A.actions.copySnip = () => { const e = A.$("#ogSnip"); e.select(); document.execCommand("copy"); A.toast("✓ Copy भयो"); };

/* ------------------------------------------------------------ LABELS */
A.labelFilter = "";
P.labels = {
  title: "Button / Text", sub: "Website का Button र सानातिना शब्दहरू",
  render() {
    const s = A.site(), q = A.labelFilter.toLowerCase();
    const groups = {};
    SN.LABEL_META.forEach(m => { if (!q || (m[1] + m[2] + m[3] + (s.labels[m[0]] || "")).toLowerCase().includes(q)) (groups[m[1]] = groups[m[1]] || []).push(m); });
    const qid = A.reg(() => A.labelFilter, v => { A.labelFilter = v; }, "text", { after: () => { clearTimeout(A._lt); A._lt = setTimeout(() => { const el = A.$("#labelBody"); if (el) { const sel = document.activeElement; A.rerenderKeep(); } }, 600); } });
    return A.note("यहाँबाट Cart, Search, Product पेज आदिका Button र सानातिना शब्द बदल्न सकिन्छ। <code>{n}</code> जस्ता चिन्ह Website ले आफैं भर्छ — हटाउनुहुन्न। खाली राखे सो ठाउँ खाली देखिन्छ, त्यसैले ‘Default’ बटन प्रयोग गर्नुहोस्।") +
      `<div class="toolbar tb1"><input data-b="${qid}" value="${esc(A.labelFilter)}" placeholder="🔍 शब्द खोज्नुहोस्"></div><div id="labelBody">` +
      Object.keys(groups).map(g => A.card(esc(g), groups[g].map(m => `<div class="field"><label>${esc(m[2])} <code class="k">${esc(m[0])}</code></label><div class="inline-act">${A.f(s.labels, { k: m[0] }).replace(/^<div class="field ">|<\/div>$/g, "")}<button class="small-btn" type="button" data-do="labelReset" data-k="${m[0]}">Default</button></div></div>`).join(""))).join("") + "</div>";
  }
};
A.actions.labelReset = el => { const k = el.dataset.k, m = SN.LABEL_META.find(x => x[0] === k); if (m) { A.site().labels[k] = m[3]; A.save(); A.rerenderKeep(); } };

/* ------------------------------------------------------------ PUBLISHING */
const pubBox = (html, cls) => { const b = A.$("#pubResult"); if (b) { b.className = "result-box " + (cls || ""); b.innerHTML = html; } };
P.publishing = {
  title: "Publish", sub: "Website मा परिवर्तन पठाउनुहोस्",
  render() {
    const v = SN.validate(A.state), pub = A.publicBuild(), h = A.state.history || [];
    const lp = A.state.lastPublish;
    const wid = A.reg(() => A.workerUrl(), val => A.setWorkerUrl(val), "text");
    const sid = A.reg(() => A.SECRET, val => { A.SECRET = val; }, "text");
    return A.card("१. जडान (Connection)", `<div class="field"><label>Cloudflare Worker URL</label><input data-b="${wid}" value="${esc(A.workerUrl())}" placeholder="https://studynotes-publisher.xxxx.workers.dev"><small>यो Link एक पटक राखे यही Browser मा सम्झिन्छ।</small></div>
      <div class="field"><label>Admin Publishing Secret</label><input data-b="${sid}" type="password" autocomplete="off" value="${esc(A.SECRET)}" placeholder="Cloudflare मा राखेको ADMIN_SECRET"><small>🔒 यो गोप्य कुरा कहिल्यै बचत हुँदैन — Page बन्द गरेपछि मेटिन्छ र हरेक पटक फेरि लेख्नुपर्छ। यो Page मा कतै छापिँदैन।</small></div>
      <div class="button-row"><button class="btn btn-ghost" data-do="pubTest">🔌 Connection जाँच्नुहोस्</button></div><div id="testResult" class="result-box"></div>`) +
      A.card("२. Publish अघि जाँच", `<div class="publish-summary">Public मा जाने: <b>${pub.counts.ebooks}</b> Ebook · <b>${pub.counts.bundles}</b> Bundle · <b>${pub.imagePaths.length}</b> Image · ${A.hasUnpublished() ? "⚠️ <b>नयाँ परिवर्तन छन्</b>" : "✓ अन्तिम Publish पछि परिवर्तन छैन"}</div>${v.errors.length ? `<ul class="check-list">${v.errors.map(e => `<li class="err">❌ ${esc(e.msg)} <button class="small-btn" data-go="${esc(e.where)}">जानुहोस्</button></li>`).join("")}</ul>` : '<p class="okline">✅ कुनै त्रुटि छैन।</p>'}${v.warnings.length ? `<ul class="check-list">${v.warnings.map(e => `<li>⚠️ ${esc(e.msg)} <button class="small-btn" data-go="${esc(e.where)}">जानुहोस्</button></li>`).join("")}</ul>` : ""}<p class="muted">Draft / Hidden / Archived Product Public मा जाँदैनन् (तिनीहरू यही Browser र Backup मा सुरक्षित रहन्छन्)।</p>`) +
      A.card("३. Publish", `<div class="button-row"><button class="btn btn-primary" data-do="pubNow" id="pubBtn" ${v.errors.length ? "" : ""}>🚀 Website मा Publish गर्नुहोस्</button><button class="btn btn-ghost" data-do="previewHome">👁 पहिले Preview हेर्नुहोस्</button></div><div id="pubResult" class="result-box"></div>${lp ? `<p class="muted">अन्तिम सफल Publish: ${esc(A.fmtDate(lp.at))}${lp.commit ? " · <code>" + esc(lp.commit.slice(0, 7)) + "</code>" : ""}</p>` : ""}`) +
      A.card("Publish इतिहास", h.length ? `<div class="hist">${h.map(x => `<div class="hrow ${x.ok ? "ok" : "bad"}"><span>${x.ok ? "✅" : "❌"}</span><div><b>${esc(A.fmtDate(x.at))}</b><br><small>${x.ok ? esc((x.counts ? x.counts.ebooks + " Ebook, " + x.counts.bundles + " Bundle" : "") + " · " + (x.assets || 0) + " Image" + (x.commit ? " · Commit " + x.commit.slice(0, 7) : "")) : esc(x.error || "त्रुटि")}</small></div></div>`).join("")}</div>` : '<p class="muted">अहिलेसम्म कुनै Publish छैन।</p>') +
      A.note("↩️ <b>गल्ती भएमा:</b> Backup पेजबाट अघिल्लो Snapshot फर्काएर फेरि Publish गर्नुहोस् — वा GitHub मा <code>data/products.json</code> को अघिल्लो Version (History) Restore गर्नुहोस्।");
  }
};
A.actions.pubTest = async () => {
  const b = A.$("#testResult"); b.className = "result-box"; b.textContent = "जाँच हुँदैछ…";
  try { const d = await A.worker("/health"); b.className = "result-box success"; b.textContent = "✅ " + (d.message || "Worker भेटियो।") + (A.SECRET ? " (Secret Publish गर्दा जाँचिन्छ।)" : " — Secret नराखेसम्म Publish हुँदैन।"); }
  catch (e) { b.className = "result-box error"; b.textContent = e.status === -1 ? e.message : A.friendlyError(e, e.status); }
};
A.actions.pubNow = async () => {
  const btn = A.$("#pubBtn");
  const v = SN.validate(A.state);
  if (v.errors.length) { pubBox("❌ पहिले यी सच्याउनुहोस्:<ul>" + v.errors.map(e => `<li>${esc(e.msg)}</li>`).join("") + "</ul>", "error"); return; }
  if (!A.SECRET) { pubBox("Admin Publishing Secret राख्नुहोस्।", "error"); return; }
  if (!A.workerUrl()) { pubBox("पहिले Cloudflare Worker URL राख्नुहोस्।", "error"); return; }
  const b = A.publicBuild();
  if (!confirm(`Website मा Publish गर्ने?\n\n${b.counts.ebooks} Ebook, ${b.counts.bundles} Bundle र सबै Setting Public हुनेछन्।`)) return;
  btn.disabled = true; btn.textContent = "Publishing…";
  try {
    const { pub } = await A.publish(m => pubBox("⏳ " + esc(m)));
    pubBox("✅ <b>GitHub मा Publish भयो।</b> अब GitHub Pages ले Public site अपडेट गर्दैछ (१–३ मिनेट)… <span id='vtick'></span>", "success");
    A.rerenderSoft();
    const ok = await A.verifyLive(pub.catalog.updatedAt, n => { const e = A.$("#vtick"); if (e) e.textContent = " जाँच #" + n; });
    pubBox(ok ? "✅ <b>Public Website मा नयाँ Data देखियो।</b> सबै पूरा भयो।" : "⏳ GitHub Pages ले अझै अपडेट गर्दै छ। केही मिनेटपछि Website खोलेर हेर्नुहोस् (Ctrl+F5)।", ok ? "success" : "");
  } catch (e) {
    if (e.validation) pubBox("❌ पहिले सच्याउनुहोस्:<ul>" + e.validation.errors.map(x => `<li>${esc(x.msg)}</li>`).join("") + "</ul>", "error");
    else if (e.missing) pubBox("❌ यी Image Upload हुन सकेनन् (यो Browser मा फेला परेन र Website मा पनि छैन) — Product मा Image फेरि छान्नुहोस्:<ul>" + e.missing.map(x => `<li>${esc(x)}</li>`).join("") + "</ul>", "error");
    else pubBox("❌ " + esc(e.status === -1 || e.message === "Admin secret राख्नुहोस्।" ? e.message : A.friendlyError(e, e.status)), "error");
  } finally { btn.disabled = false; btn.textContent = "🚀 Website मा Publish गर्नुहोस्"; }
};

/* ------------------------------------------------------------ BACKUP */
P.backup = {
  title: "Backup / Import", sub: "सुरक्षित प्रतिलिपि, पुनर्स्थापना र Data ल्याउने",
  render() {
    const imp = A._imp;
    const snaps = (A.state.backups || []);
    return A.note("💾 Draft/Hidden Product, Offer, Template आदि केवल यही Browser मा हुन्छन् — त्यसैले नियमित <b>Backup Export</b> गर्नुहोस्। Backup मा <b>कुनै Secret हुँदैन</b>।") +
      A.card("Export", `<div class="button-row"><button class="btn btn-primary" data-do="expData">⬇️ Backup (Data मात्र)</button><button class="btn btn-ghost" data-do="expFull">⬇️ Backup + Images</button><button class="btn btn-ghost" data-do="expPublic">⬇️ Public data (products.json जस्तै)</button></div><p class="muted">“Data मात्र” सानो हुन्छ। “+ Images” मा Cover आदि पनि हुन्छन् (ठूलो हुन सक्छ)।</p>`) +
      A.card("Import / Restore", `<div class="field"><label>Backup file छान्नुहोस् (.json)</label><label class="btn btn-ghost file-button">📁 File छान्नुहोस्<input type="file" accept=".json,application/json" data-impfile="1"></label><small>नयाँ Backup, पुरानो Manager को Export, वा Live products.json — सबै चल्छ।</small></div>${imp ? `<div class="notice-box"><b>${esc(imp.name)}</b>: ${imp.r.products.length} Product${imp.r.site ? " + Site Settings" : ""}${imp.r.images ? " + " + Object.keys(imp.r.images).length + " Image" : ""}<div class="button-row"><button class="btn btn-primary" data-do="impMerge">नयाँ थप्ने + पुराना अपडेट</button><button class="btn btn-ghost" data-do="impKeep">केवल नयाँ थप्ने</button><button class="btn btn-danger" data-do="impReplace">सबै बदल्ने (Replace)</button></div></div>` : ""}`) +
      A.card("Live Store / Starter", `<div class="button-row"><button class="btn btn-ghost" data-do="loadLive">🌐 Live Store को Data ल्याउनुहोस्</button><button class="btn btn-ghost" data-do="loadStarter">✨ Starter सामग्री (Draft)</button></div><p class="muted">Live Data = अन्तिम पटक Publish भएको Public data। अर्को फोन/Computer बाट काम सुरु गर्दा यही प्रयोग गर्नुहोस् (Draft बाहेक सबै आउँछ)।</p>`) +
      A.card("स्वचालित Snapshot (Publish अघि)", snaps.length ? snaps.map((x, i) => `<div class="hrow"><div><b>${esc(A.fmtDate(x.at))}</b><br><small>${x.products.length} Product</small></div><button class="small-btn" data-do="snapRestore" data-i="${i}">फर्काउनुहोस्</button></div>`).join("") : '<p class="muted">अहिले Snapshot छैन।</p>') +
      A.card("खतरा क्षेत्र", `<button class="btn btn-danger" data-do="wipe">यो Browser को सबै Admin Data मेट्नुहोस्</button><p class="muted">Website मा Publish भइसकेको कुरा मेटिँदैन। पहिले Backup लिनुहोस्।</p>`);
  }
};
const stamp = () => new Date().toISOString().slice(0, 10);
Object.assign(A.actions, {
  async expData() { A.download("studynotes-backup-" + stamp() + ".json", JSON.stringify(await A.exportData(false), null, 2)); },
  async expFull() { A.toast("तयार हुँदैछ…"); A.download("studynotes-backup-images-" + stamp() + ".json", JSON.stringify(await A.exportData(true))); },
  expPublic() { const b = A.publicBuild(); A.download("products-" + stamp() + ".json", JSON.stringify(b.catalog, null, 2)); },
  async impMerge() { const r = await A.applyImport(A._imp.r, "merge"); A._imp = null; A.toast(`✓ ${r.added} नयाँ, ${r.updated} अपडेट`); A.rerender(); },
  async impKeep() { const r = await A.applyImport(A._imp.r, "merge-keep"); A._imp = null; A.toast(`✓ ${r.added} नयाँ थपियो`); A.rerender(); },
  async impReplace() { if (!confirm("अहिलेका सबै Product र Setting बदलिन्छन्। पक्का?")) return; await A.applyImport(A._imp.r, "replace"); A._imp = null; A.toast("✓ बदलियो"); A.rerender(); },
  async loadLive() { try { A.toast("Live Data ल्याउँदैछ…"); const j = await A.fetchLive(); const r = A.parseImport(j); const res = await A.applyImport(r, A.state.products.length ? "merge-keep" : "replace", { live: true, siteReplace: !A.state.products.length }); if (!A.state.lastPublish) { A.state.publishedHash = A.publicHash(); A.saveNow(); } A.toast(`✓ ${res.added} Product ल्याइयो`); A.rerender(); } catch (e) { A.toast("⚠️ Live Data ल्याउन सकिएन: " + e.message, 5000); } },
  async loadStarter() { try { const j = await A.fetchStarter(); const r = A.parseImport(j); const res = await A.applyImport(r, "merge-keep", { siteReplace: false }); A.toast(`✓ ${res.added} Draft Product थपियो — Cover र वास्तविक विवरण थप्नुहोस्`, 5000); A.rerender(); } catch (e) { A.toast("⚠️ " + e.message, 5000); } },
  snapRestore(el) { const x = A.state.backups[+el.dataset.i]; if (!x || !confirm("यो Snapshot फर्काउने? अहिलेको Data बदलिन्छ।")) return; A.state.products = SN.clone(x.products); A.state.site = SN.mergeSite(x.site); A.saveNow(); A.toast("✓ फर्कियो"); A.rerender(); },
  wipe() { if (!confirm("यो Browser को सबै Admin Data (Draft सहित) मेटिन्छ। Backup लिनुभएको छ?")) return; if (!confirm("अन्तिम पुष्टि: मेट्ने?")) return; try { localStorage.removeItem("studynotes_admin_v2"); } catch (e) {} location.reload(); }
});
A.onFile = async el => {
  const f = el.files && el.files[0]; if (!f) return;
  try { const j = JSON.parse(await f.text()); const r = A.parseImport(j); if (!r.products.length && !r.site) throw new Error("File मा Product/Setting भेटिएन"); A._imp = { name: f.name, r }; A.rerender(); }
  catch (e) { A.toast("⚠️ File पढ्न सकिएन: " + e.message, 4500); }
};
})();
