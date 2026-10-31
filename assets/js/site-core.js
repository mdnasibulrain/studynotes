/* StudyNotes shared core — used by BOTH the public storefront (index.html) and the Product Manager (mnrsnadmin).
   One definition of defaults, price/offer rules, placeholders and catalog building, so what you set in Admin
   is exactly what the storefront shows. Plain JavaScript, no dependencies, no secrets. */
(function (root) {
"use strict";
const SN = {};
SN.version = 2;
const NEPAL = "+05:45";
SN.NEPAL = NEPAL;
SN.SITE_ID = "__site__";

/* ------------------------------------------------------------------ small helpers */
const isObj = v => v && typeof v === "object" && !Array.isArray(v);
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
SN.clone = clone;
SN.isObj = isObj;
SN.num = v => { if (v === null || v === undefined || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const num = SN.num;
SN.str = v => (v === null || v === undefined ? "" : String(v).trim());
const str = SN.str;
SN.uid = (p = "x") => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
SN.pct = (r, s) => (r > 0 && s < r ? Math.round(((r - s) / r) * 100) : 0);
SN.NE_DIGITS = "०१२३४५६७८९";
SN.ne = n => String(n).replace(/\d/g, d => SN.NE_DIGITS[d]);
SN.fmt = (n, cur) => (cur === undefined ? "रु." : cur) + " " + Number(n || 0).toLocaleString("en-IN");

function deepMerge(base, over) {
  if (Array.isArray(over)) return clone(over);
  if (!isObj(over)) return over === undefined ? clone(base) : over;
  const out = isObj(base) ? clone(base) : {};
  for (const k of Object.keys(over)) {
    if (over[k] === undefined) continue;
    out[k] = isObj(out[k]) && isObj(over[k]) ? deepMerge(out[k], over[k]) : clone(over[k]);
  }
  return out;
}
SN.deepMerge = deepMerge;

/* ------------------------------------------------------------------ time (offer dates are Nepal time unless a zone is given) */
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;
SN.parseTime = v => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += "T00:00";
  if (!HAS_ZONE.test(s)) s += NEPAL;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
};
SN.toInputValue = v => { const t = SN.parseTime(v); if (t === null) return ""; return new Date(t + 345 * 60000).toISOString().slice(0, 16); };
SN.fromInputValue = s => (s ? s + NEPAL : null);
SN.nowMs = () => Date.now();
SN.inWindow = (start, end, now) => {
  const a = SN.parseTime(start), b = SN.parseTime(end);
  if (a !== null && now < a) return false;
  if (b !== null && now >= b) return false;
  return true;
};
SN.formatDateTime = ms => { // Nepal time (UTC+5:45), e.g. "31 Dec 2026, 11:59 PM"
  const d = new Date(ms + 345 * 60000), M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let h = d.getUTCHours(); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return `${d.getUTCDate()} ${M[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${h}:${String(d.getUTCMinutes()).padStart(2, "0")} ${ap}`;
};
SN.formatCountdown = ms => {
  const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const p = n => String(n).padStart(2, "0");
  return { d, h: p(h), m: p(m), s: p(x), text: (d ? d + "d " : "") + p(h) + ":" + p(m) + ":" + p(x) };
};

/* ------------------------------------------------------------------ safe urls / images / actions */
SN.safeUrl = (u) => {
  const s = str(u);
  if (!s) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s;
  return "";
};
SN.safeImage = (p, opts) => {
  const s = str(p);
  if (!s) return "";
  if (/^assets\/covers\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(s)) return s;
  if (/^https:\/\//i.test(s)) return s;
  if (opts && opts.preview && /^blob:/.test(s)) return s;
  return "";
};
SN.safeDoc = (p) => {
  const s = str(p);
  if (!s) return "";
  if (/^https:\/\//i.test(s)) {
    const m = s.match(/^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/);
    if (m) return "https://drive.google.com/file/d/" + m[1] + "/preview";
    return s;
  }
  if (/^assets\/[a-zA-Z0-9_\/.-]+\.pdf$/.test(s)) return s;
  return "";
};
SN.waDigits = v => String(v || "").replace(/\D/g, "").slice(0, 16);
SN.waDisplay = d => { d = SN.waDigits(d); if (!d) return ""; if (d.startsWith("977") && d.length > 3) return "+977 " + d.slice(3); return "+" + d; };
/* action strings: "section:<id>" | "product:<id>" | "cart" | "whatsapp" | "nspay" | "url:<https://..>" | "none" */
SN.parseAction = a => {
  const s = str(a);
  if (!s || s === "none") return { type: "none" };
  const i = s.indexOf(":");
  if (i < 0) return { type: s };
  return { type: s.slice(0, i), value: s.slice(i + 1) };
};
SN.SECTION_TARGETS = { hero: "hero", explore: "explore", combos: "combos", bundles: "bundles", reviews: "reviews", how: "how", faqs: "faqs", author: "author", chat: "chat" };

/* ------------------------------------------------------------------ placeholders: {name}
   mode "sentence": a sentence whose placeholder is empty is removed;  "line": same for a whole line;  default: empty -> "" */
SN.fill = (text, vars, mode) => {
  if (mode === "keep") mode = undefined;
  if (text === null || text === undefined) return "";
  const t = String(text);
  vars = vars || {};
  const has = k => vars[k] !== undefined && vars[k] !== null && vars[k] !== "" && vars[k] !== 0;
  const unit = seg => {
    let drop = false;
    const out = seg.replace(/\{(\w+)\}/g, (m, k) => {
      if (!(k in vars)) return m;
      if (!has(k)) { if (vars[k] === 0 && !mode) return "0"; drop = true; return ""; }
      return String(vars[k]);
    });
    return mode && drop ? null : out;
  };
  if (mode === "line") {
    const lines = t.split("\n").map(unit).filter(x => x !== null);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  if (mode === "sentence") {
    const parts = []; let cur = "";
    for (let i = 0; i < t.length; i++) {
      cur += t[i];
      const c = t[i], n = t[i + 1];
      if (c === "।" || c === "!" || c === "?" || (c === "." && (n === " " || n === "\n" || n === undefined))) {
        while (t[i + 1] === " ") { i++; cur += " "; }
        parts.push(cur); cur = "";
      }
    }
    if (cur) parts.push(cur);
    return parts.map(unit).filter(x => x !== null).join("").trim();
  }
  return unit(t).replace(/[ \t]+([,।!.])/g, "$1");
};

/* ------------------------------------------------------------------ palettes / icons / badges */
SN.PALETTES = {
  orange: ["#F97316", "#C2410C"], sky: ["#0EA5E9", "#0369A1"], emerald: ["#10B981", "#047857"], violet: ["#8B5CF6", "#5B21B6"],
  rose: ["#F43F5E", "#BE123C"], amber: ["#F59E0B", "#B45309"], teal: ["#14B8A6", "#0F766E"], indigo: ["#6366F1", "#4338CA"]
};
SN.ICON_LIST = [["laptop", "💻 Laptop"], ["globe", "🌐 Globe"], ["book", "📖 Book"], ["trend", "📈 Trend"], ["user", "👤 User"], ["compass", "🧭 Compass"], ["layers", "🗂 Layers"], ["zap", "⚡ Zap"], ["gift", "🎁 Gift"], ["award", "🏅 Award"], ["target", "🎯 Target"], ["file", "📄 File"], ["star", "⭐ Star"], ["flame", "🔥 Flame"], ["tag", "🏷 Tag"], ["shield", "🛡 Shield"], ["phone", "📱 Phone"], ["help", "❓ Help"], ["clock", "🕒 Clock"], ["card", "💳 Card"], ["wa", "💬 WhatsApp"], ["mail", "✉️ Mail"], ["eye", "👁 Eye"], ["checkc", "✅ Check"]];
SN.BADGES = ["BESTSELLER", "NEW", "POPULAR", "LIMITED", "RECOMMENDED", "HOT", "LAUNCH OFFER"];
SN.SECTIONS = [
  ["announcement", "Announcement (माथिको Offer bar + Ticker)", true],
  ["hero", "Hero (पहिलो स्क्रिन)", true],
  ["trust", "Hooks / फाइदा पट्टी", true],
  ["goals", "Categories / Goals (तपाईंको Goal के हो?)", true],
  ["library", "Featured Ebooks / Library (सबै Ebook)", false],
  ["combo", "Custom Combo", true],
  ["bundles", "Bundles / Offers", true],
  ["bonus", "Bonus Resources (Ebook सँगको Bonus Package)", true],
  ["reviews", "Reviews (पाठकहरूको भरोसा)", true],
  ["steps", "Steps (कसरी किन्ने)", true],
  ["chat", "Testimonials (WhatsApp कुराकानी)", true],
  ["faq", "FAQ", true],
  ["about", "Career / Mission (About)", true],
  ["finalcta", "Final CTA", true],
  ["footer", "Footer", true]
];
SN.SECTION_IDS = SN.SECTIONS.map(s => s[0]);

/* ------------------------------------------------------------------ DEFAULT content = exactly the approved design's text */
const D = {
  v: 1,
  preloader: { enabled: true, frequency: "session", name: "{storeName}", tagline: "{tagline}", note: "सफलताको पहिलो कदम", mark: "SN", speed: "normal", logoMode: "draw", accent: "orange", theme: "light", cursor: true, progress: true, minSeconds: 2.5, skipText: "" },
  store: { name: "StudyNotes", tagline: "Your First Step to Success", taglineNe: "नेपाली युवा, विद्यार्थी र प्रोफेसनलहरूका लागि Digital Learning Resources।", founder: "MD. NS (MD. NASA)", logo: null, currency: "रु.", copyright: "© {year} {storeName}. All rights reserved." },
  topbar: { liveBadge: "LIVE •", liveLabel: "आजको Offer", stockText: "🔥 केवल {left} बाँकी · {short}", discountText: "{discount}% सम्म OFF", tickerLabel: "OFFERS" },
  ticker: { autoOffers: true, autoCombo: true, comboText: "🧩 {comboMin} वा सोभन्दा बढी Ebook छान्दा थप {comboPercent}% Combo Discount!", items: [] },
  hero: {
    carouselMode: "all",
    badge: "{storeName} • {tagline}", headBefore: "सफलताको", headHighlight: "पहिलो कदम", headAfter: "आजै यहीँबाट सुरु गर्नुहोस्",
    description: "Skill, Exam र Career तिर स्पष्ट बाटो देखाउने Practical Ebooks — सरल नेपाली भाषामा, मोबाइलमै पढ्न मिल्ने। यो खर्च होइन, तपाईंको **पहिलो उपलब्धि** हो।",
    cta1: { text: "Ebooks हेर्नुहोस्", action: "section:explore" }, cta2: { text: "Bundle Offers", action: "section:bundles" },
    cardNote: "🏆 यो तपाईंको सफलतातर्फको पहिलो उपलब्धि — आजै सुरु गर्नुहोस्।"
  },
  trust: { items: [
    { id: "t1", icon: "book", title: "Practical Learning", text: "उपयोगी र व्यवस्थित Content", visible: true },
    { id: "t2", icon: "card", title: "NSPAY / WhatsApp", text: "सजिलो र सुरक्षित Order", visible: true },
    { id: "t3", icon: "zap", title: "{delivery} Delivery", text: "{deliveryMethod} मा PDF", visible: true },
    { id: "t4", icon: "wa", title: "Direct Support", text: "{whatsappDisplay}", visible: true }] },
  goals: { eyebrow: "YOUR GOAL", title: "तपाईंको Goal के हो?", sub: "लक्ष्य छान्नुहोस् — सही Ebook आफैं फिल्टर हुन्छ।", items: [
    { id: "g1", title: "Computer Skills सिक्ने", icon: "laptop", category: "Computer Skills", text: "Word, Excel र Typing", visible: true },
    { id: "g2", title: "Digital Income सिक्ने", icon: "globe", category: "Digital Skills & Online Income", text: "Freelancing र Remote Work", visible: true },
    { id: "g3", title: "LokSewa तयारी गर्ने", icon: "book", category: "LokSewa Preparation", text: "GK & IQ र रणनीति", visible: true },
    { id: "g4", title: "Share Market बुझ्ने", icon: "trend", category: "Share Market Fundamentals", text: "IPO र NEPSE", visible: true },
    { id: "g5", title: "Interview मा सफल हुने", icon: "user", category: "Personality Development", text: "आत्मविश्वास र बोल्ने कला", visible: true },
    { id: "g6", title: "Job Ready हुने", icon: "target", category: "Nepali Youth Career Guides", text: "CV र Job Search", visible: true },
    { id: "g7", title: "Career Path स्पष्ट पार्ने", icon: "compass", category: "Nepali Youth Career Guides", text: "नेपालमै अवसर खोज्ने", visible: true },
    { id: "g8", title: "Personal Growth बढाउने", icon: "zap", category: "Personality Development", text: "निरन्तर सिकाइ", visible: true }] },
  library: { eyebrow: "STUDYNOTES LIBRARY", title: "Explore Ebook Library" },
  combo: { eyebrow: "CUSTOM COMBO", title: "आफ्नो Custom Combo बनाउनुहोस्", sub: "कम्तीमा {comboMinN} Ebook छान्नुहोस् र आजको Price मा थप {comboPercent}% Combo Discount पाउनुहोस्।" },
  bundles: { eyebrow: "CURATED PACKAGES", title: "Best Bundle Offers", sub: "तयार गरिएका Ebook Bundles — सर्वाधिक बचत, एकै पटकमा पूरा Success Kit।" },
  reviews: { eyebrow: "RATINGS & REVIEWS", title: "पाठकहरूको भरोसा", sub: "हरेक Ebook को Rating र Reviews एकै ठाउँमा।", sampleNote: "ℹ️ देखाइएका समीक्षा नमुना (Sample) हुन् — वास्तविक ग्राहक feedback थपेपछि “Verified” देखिन्छ।", productSampleNote: "ℹ️ नमुना (Sample) समीक्षा — वास्तविक ग्राहक feedback थपेपछि “Verified” देखिन्छ।", sampleBadge: "Sample", items: [] },
  steps: { eyebrow: "EBOOK RECEIVING PROCESS", title: "Ebook कसरी प्राप्त गर्ने?", sub: "सरल {stepCount} चरण — Payment पुष्टि भएपछि {deliveryNe}मै Delivery।", items: [
    { id: "s1", icon: "book", title: "Ebook छान्नुहोस्", text: "Ebook, Custom Combo वा Bundle रोज्नुहोस्।", visible: true },
    { id: "s2", icon: "eye", title: "Preview हेर्नुहोस्", text: "नमुना अध्याय र Chapter Outline हेर्नुहोस्।", visible: true },
    { id: "s3", icon: "cart", title: "Cart मा थप्नुहोस्", text: "कुल रकम र बचत एकै ठाउँमा हेर्नुहोस्।", visible: true },
    { id: "s4", icon: "card", title: "NSPAY / WhatsApp", text: "NSPAY बाट Payment वा WhatsApp मा Order गर्नुहोस्।", visible: true },
    { id: "s5", icon: "file", title: "Screenshot + ID पठाउनुहोस्", text: "Payment Screenshot र Product ID WhatsApp मा पठाउनुहोस्।", visible: true },
    { id: "s6", icon: "zap", title: "{delivery} मा Delivery", text: "पुष्टि भएपछि PDF WhatsApp/Email मा प्राप्त गर्नुहोस्।", visible: true }] },
  chat: { eyebrow: "CUSTOMER TESTIMONIALS", title: "ग्राहकसँगको कुराकानी", sub: "Order देखि Delivery सम्म — WhatsApp मा यसरी हुन्छ।", headerName: "{storeName} Support", status: "online", inputText: "WhatsApp मा Message गर्नुहोस्...", sampleNote: "ℹ️ नमुना (Sample) कुराकानी — वास्तविक ग्राहक सन्देश (अनुमति सहित) थपेर यो खण्ड अपडेट गर्नुहोस्।", items: [] },
  faq: { eyebrow: "FAQ", title: "अक्सर सोधिने प्रश्नहरू", productTitle: "सामान्य प्रश्नहरू", items: [
    { id: "f1", q: "Ebook भनेको के हो र यो कसरी प्राप्त हुन्छ?", a: "Ebook (Electronic Book) डिजिटल पुस्तक हो जसलाई तपाईं आफ्नो मोबाइल, ट्याब्लेट वा कम्प्युटरमा सजिलै पढ्न सक्नुहुन्छ। Payment पुष्टि भएपछि PDF फाइल तपाईंको WhatsApp वा Email मा {deliveryNe}भित्र पठाइन्छ।", visible: true, onProduct: false },
    { id: "f2", q: "कुन-कुन विषयका Ebook उपलब्ध छन्?", a: "हाल यी विधाका Ebook उपलब्ध छन्: {categories}।", visible: true, onProduct: false },
    { id: "f3", q: "Order कसरी गर्ने?", a: "दुई तरिका: (१) Cart मा Ebook थपेर 'NSPAY मा Payment' क्लिक गर्नुहोस्, वा (२) 'WhatsApp मा Order' क्लिक गर्नुहोस् — Product ID सहितको Order सन्देश आफैं तयार हुन्छ।", visible: true, onProduct: true },
    { id: "f4", q: "Payment गरेपछि के गर्नुपर्छ?", a: "Payment सफल भएपछि Screenshot तथा Product ID हाम्रो WhatsApp ({whatsappDisplay}) मा पठाउनुहोस्। पुष्टि भएपछि {delivery}मा Ebook प्राप्त हुन्छ।", visible: true, onProduct: true },
    { id: "f5", q: "Ebook किन्नुअघि Preview हेर्न मिल्छ?", a: "हरेक Ebook पेजमा 'Preview PDF' खण्ड छ। नमुना अध्याय चाहिएमा WhatsApp मा अनुरोध गर्न पनि सक्नुहुन्छ।", visible: true, onProduct: true },
    { id: "f6", q: "Combo Discount कसरी पाइन्छ?", a: "{comboMin} वा सोभन्दा बढी Ebook छान्दा Today Price मा थप {comboPercent}% Combo Discount स्वतः लाग्छ। 'Custom Combo' बनाउन सक्नुहुन्छ वा तयार Bundle छान्न सक्नुहुन्छ।", visible: true, onProduct: false },
    { id: "f7", q: "एउटै Ebook एकभन्दा बढी किन्न मिल्छ?", a: "डिजिटल Ebook एउटै खरिद गर्दा पुग्छ, त्यसैले एउटै Ebook को Quantity बढाउने सुविधा छैन। Bundle मा समावेश Ebook अलग्गै थप्न पनि पर्दैन।", visible: true, onProduct: false },
    { id: "f8", q: "के Ebook मोबाइलमा पढ्न सकिन्छ?", a: "सकिन्छ। Ebook साधारण PDF ढाँचामा हुन्छ — Android, iPhone वा Laptop जुनसुकैमा पढ्न मिल्छ।", visible: true, onProduct: false },
    { id: "f9", q: "के Ebook पढेपछि जागिर वा आम्दानीको १००% guarantee हुन्छ?", a: "हुँदैन। Ebook ले व्यवहारिक ज्ञान, सीप र तयारीको बाटो देखाउँछ। वास्तविक सफलता तपाईंको निरन्तर अभ्यास, मिहिनेत र बजारको अवस्थामा निर्भर हुन्छ। कुनै भ्रामक ग्यारेन्टी दिइँदैन।", visible: true, onProduct: true },
    { id: "f10", q: "Share Market Ebook ले निश्चित Profit guarantee गर्छ?", a: "गर्दैन। शेयर बजार जोखिमयुक्त हुन्छ। सामग्री केवल शैक्षिक प्रयोजनका लागि हो। लगानी सम्बन्धी निर्णय आफ्नै जोखिममा लिनुहोस्।", visible: true, onProduct: false },
    { id: "f11", q: "समस्या परे कसरी सम्पर्क गर्ने?", a: "WhatsApp {whatsappDisplay} वा Email: {email} मा जुनसुकै बेला सम्पर्क गर्नुहोस्।", visible: true, onProduct: false }] },
  about: { eyebrow: "ABOUT {storeNameUpper}", heading: "{storeName} — by {founder}", text: "StudyNotes को उद्देश्य नेपाली युवा, विद्यार्थी र रोजगारी खोजीमा रहेका व्यक्तिहरूलाई Computer Skills, Digital Skills, परीक्षा तयारी, Share Market र Personality Development सम्बन्धी व्यावहारिक र गुणस्तरीय Ebooks उपलब्ध गराउनु हो।" },
  finalcta: { pill: "🏁 आजको निर्णय, भोलिको बाटो", heading: "तपाईंको सफलताको पहिलो उपलब्धि\nआजै हासिल गर्नुहोस्", text: "धेरैले “पछि गर्छु” भन्दै समय गुमाउँछन्। आज {maxDiscount}% सम्मको छुटमा सुरु गर्नुहोस् — सिक्ने बानीको पहिलो पाइला यहीँबाट।", countdownLabel: "Offer सकिन्छ:", buttons: [
    { text: "Best Bundle हेर्नुहोस्", action: "section:bundles", visible: true },
    { text: "Ebooks Browse", action: "section:explore", visible: true },
    { text: "WhatsApp मा Order", action: "whatsapp", visible: true }] },
  footer: { quickTitle: "Quick Links", contactTitle: "Contact", policiesTitle: "Policies", links: [], policies: [
    { id: "p1", title: "Privacy Policy", content: "हामी तपाईंको सम्पर्क विवरण र गोपनीयताको सम्मान गर्छौं। कुनै पनि व्यक्तिगत डेटा तेस्रो पक्षलाई बिक्री वा सेयर गरिँदैन।", visible: true },
    { id: "p2", title: "Terms & Conditions", content: "Ebooks केवल व्यक्तिगत अध्ययनका लागि हुन्। प्रतिलिपि अधिकार सुरक्षित छ। अनधिकृत पुनःबिक्री वा सेयर गर्न मनाही छ।", visible: true },
    { id: "p3", title: "Educational Disclaimer", content: "सामग्री अध्ययन र ज्ञान साक्षरताका लागि हो। यसले शतप्रतिशत रोजगारी, परीक्षा सफलता वा निश्चित आम्दानी/नाफाको ग्यारेन्टी गर्दैन।", visible: true }] },
  contact: { whatsapp: "9779702784684", whatsappDisplay: "", supportEmail: "mdnasibulrain4@gmail.com", businessEmail: "", supportText: "", supportHours: "", whatsappCta: "WhatsApp", emailCta: "Email", contactMessage: "Hello {storeName}! मलाई Ebook बारे जानकारी चाहिएको थियो 🙏" },
  payment: { nspayUrl: "https://www.nasibul.com.np/nspay", ctaText: "NSPAY मा Payment गर्नुहोस्", ctaShort: "NSPAY", ctaNow: "NSPAY मा अहिल्यै Payment", instructions: "Payment पछि Screenshot र माथिका Product ID हाम्रो WhatsApp ({whatsappDisplay}) मा पठाउनुहोस्।", copiedToast: "📋 Order विवरण Copy भयो — Payment पछि Screenshot र ID WhatsApp मा पठाउनुहोस्", steps: [
    { id: "ps1", icon: "card", title: "Payment गर्नुहोस्", text: "NSPAY वा WhatsApp" },
    { id: "ps2", icon: "file", title: "Screenshot + ID पठाउनुहोस्", text: "{productId}" },
    { id: "ps3", icon: "zap", title: "Ebook पाउनुहोस्", text: "{delivery}" }] },
  delivery: { time: "3–5 मिनेट", short: "3–5 min", method: "WhatsApp / Email", text: "Payment verify भएपछि {delivery} भित्र WhatsApp वा Email बाट ebook प्राप्त गर्नुहोस्।" },
  cart: { enabled: true, comboEnabled: true, comboMin: 3, comboPercent: 15 },
  bonus: {
    valueLabel: "Value {value}", totalLabel: "🎁 कुल Bonus Value: {value} — Ebook सँगै", countdownText: "Bonus Offer सकिन बाँकी: {time}", limitedText: "सीमित समयको Bonus Offer", untilText: "यो Bonus Offer {date} सम्म मात्र।",
    home: {
      enabled: true,
      eyebrow: "🎁 EXCLUSIVE BONUS RESOURCES", title: "एउटा Ebook मात्र होइन, Complete Learning & Practice Package!", sub: "Read It. Practice It. Apply It. Get Skilled.",
      tagline: "One Book. Multiple Resources. Real Results.", mainTitle: "MAIN EBOOK", mainDesc: "PDF: Complete Guide, Theory, Practical Steps",
      hooks: ["Buy Before the Offer Ends & Unlock Your Exclusive Bonuses!"], cta: "Bonus सहित Order गर्नुहोस्", viewCta: "Bonus हेर्नुहोस्",
      eligibility: "Offer सकिनु अघि Purchase गर्ने Buyer ले मात्र यी Bonus पाउँछन्। Payment पुष्टि भएपछि Ebook सँगै WhatsApp / Email मा पठाइन्छ।",
      showValue: true, maxProducts: 6
    },
    product: {
      enabled: true,
      eyebrow: "🎁 EXCLUSIVE BONUSES", title: "यो Ebook सँग तपाईंले पाउने Bonus Resources", sub: "Read It. Practice It. Apply It. Get Skilled.",
      tagline: "One Book. Multiple Resources. Real Results.", mainTitle: "MAIN EBOOK", mainDesc: "PDF: Complete Guide, Theory, Practical Steps",
      hooks: ["Buy Before the Offer Ends & Unlock Your Exclusive Bonuses!"], cta: "Bonus सहित Order गर्नुहोस्",
      eligibility: "Offer सकिनु अघि Purchase गर्ने Buyer ले मात्र यी Bonus पाउँछन्। Payment पुष्टि भएपछि Ebook सँगै WhatsApp / Email मा पठाइन्छ।",
      showValue: true
    }
  },
  messages: {
    order: "Hello {storeName}! मैले यी Ebook Order गर्न चाहन्छु 👇\n\n{items}\n\n{priceSummary}\n\nPayment: NSPAY / WhatsApp\nकृपया Payment विवरण पठाइदिनुहोस् 🙏",
    paymentInstruction: "नमस्कार {customerName}! 🙏\n\n{productName} (ID: {productId}) को लागि जम्मा रकम: {total}\n\nNSPAY बाट Payment गर्नुहोस्: {nspayUrl}\nPayment पछि Screenshot र Product ID यहीँ पठाउनुहोस्।",
    paymentVerified: "नमस्कार {customerName}! ✅\n\nतपाईंको Payment (Ref: {paymentReference}) पुष्टि भयो।\nProduct: {productName} (ID: {productId})\nरकम: {total}\n\nअब तपाईंको Ebook पठाउँदैछु। धन्यवाद!",
    delivery: "नमस्कार {customerName}! 📘\n\nतपाईंको Ebook यो रह्यो: {productName} (ID: {productId}).\nPDF यही सन्देशसँगै संलग्न छ। पढ्दै जानुहोस्, केही सोध्नु परे यहीँ लेख्नुहोस्।\n\nधन्यवाद, {storeName}!",
    support: "नमस्कार {customerName}! 🙏 {storeName} Support मा सम्पर्क गर्नुभएकोमा धन्यवाद। तपाईंको {productName} सम्बन्धी समस्या बताउनुहोस्, हामी छिट्टै सहयोग गर्छौं।",
    followUp: "नमस्कार {customerName}! 😊 तपाईंले {productName} पढ्न थाल्नुभयो होला। कस्तो लाग्यो? केही सोध्नु छ भने यहीँ लेख्नुहोस्।"
  },
  social: [
    { id: "facebook", name: "Facebook", enabled: false, url: "" }, { id: "instagram", name: "Instagram", enabled: false, url: "" },
    { id: "tiktok", name: "TikTok", enabled: false, url: "" }, { id: "youtube", name: "YouTube", enabled: false, url: "" },
    { id: "linkedin", name: "LinkedIn", enabled: false, url: "" }, { id: "whatsapp", name: "WhatsApp", enabled: true, url: "" }],
  seo: { title: "StudyNotes — Your First Step to Success | Practical Ebooks", description: "StudyNotes — Computer Skills, Digital Income, LokSewa, Share Market, Personality & Career Ebooks for Nepali youth.", keywords: "", ogTitle: "", ogDescription: "", ogImage: null, favicon: null, siteUrl: "" },
  product: { disclaimer: "⚠️ यो Ebook शैक्षिक प्रयोजनका लागि हो। जागिर, परीक्षा सफलता वा आम्दानी/नाफाको कुनै ग्यारेन्टी छैन; नतिजा तपाईंको अभ्यास र परिस्थितिमा निर्भर हुन्छ।" },
  categories: [
    { id: "computer-skills", name: "Computer Skills", short: "Computer", code: "CS", icon: "laptop", palette: "orange", visible: true },
    { id: "digital-skills-online-income", name: "Digital Skills & Online Income", short: "Digital Income", code: "DS", icon: "globe", palette: "sky", visible: true },
    { id: "loksewa", name: "LokSewa Preparation", short: "LokSewa", code: "LS", icon: "book", palette: "emerald", visible: true },
    { id: "share-market", name: "Share Market Fundamentals", short: "Share Market", code: "SM", icon: "trend", palette: "violet", visible: true },
    { id: "personality-development", name: "Personality Development", short: "Personality", code: "PD", icon: "user", palette: "rose", visible: true },
    { id: "nepali-youth-career-guides", name: "Nepali Youth Career Guides", short: "Career", code: "NY", icon: "compass", palette: "amber", visible: true }],
  offers: [],
  sections: SN.SECTIONS.map(s => ({ id: s[0], enabled: true })),
  labels: {}
};
/* LABEL_META: [key, group, description (Nepali), default text]. Admin → "Button / Text" page edits these; storefront reads SITE.labels[key]. */
SN.LABEL_META = [
  ["searchPlaceholder","Search","Search box को placeholder","Ebook, Skill, Tag वा ID खोज्नुहोस् (Computer, NEPSE, CV...)"],
  ["searchCount","Search","Search नतिजा संख्या ({n})","{n} नतिजा"],
  ["searchPopular","Search","Search खाली हुँदा शीर्षक","🔥 लोकप्रिय Ebooks"],
  ["searchNone","Search","नतिजा नभेटिएको सन्देश","कुनै Ebook भेटिएन।"],
  ["searchAll","Search","सबै नतिजा button","Library मा सबै नतिजा हेर्नुहोस् ➔"],
  ["libAll","Library","'सबै' filter नाम","All Ebooks"],
  ["libSearch","Library","Library search placeholder","Search title, skill, tag, ID..."],
  ["libEmpty","Library","Library खाली सन्देश","कुनै Ebook भेटिएन।"],
  ["libReset","Library","Filter reset button","Filter Reset गर्नुहोस्"],
  ["addToCart","Buttons","Cart मा थप्ने button","Cart मा थप्नुहोस्"],
  ["inCart","Buttons","Cart मा भएको button","Cart मा छ"],
  ["covered","Buttons","Bundle मा समावेश button","Bundle मा समावेश"],
  ["waOrder","Buttons","WhatsApp Order button","WhatsApp Order"],
  ["lblRegular","Price","Regular price नाम","Regular Price"],
  ["lblDiscount","Price","Discount नाम","Today Discount"],
  ["lblToday","Price","आजको price नाम","Today Price"],
  ["lblCombo","Price","Combo discount नाम","Combo Discount"],
  ["lblFinal","Price","Final amount नाम","Final Amount"],
  ["newTag","Cards","NEW tag","NEW"],
  ["tagEbook","Cards","EBOOK tag","EBOOK"],
  ["tagBundle","Cards","BUNDLE tag","BUNDLE"],
  ["tagBundleN","Cards","BUNDLE tag संख्या सहित ({n})","BUNDLE • {n} EBOOKS"],
  ["heroPages","Cards","Pages ({n})","{n} Pages"],
  ["heroChapters","Cards","Chapters ({n})","{n} Chapters"],
  ["heroSold","Cards","Sold ({n}) — Admin ले राखेको वास्तविक संख्या","{n} Sold"],
  ["leftCopies","Cards","बाँकी Copies ({n}) — Admin ले राखेको मात्र","⏳ केवल {n} Copies बाँकी"],
  ["claimed","Cards","Claimed % ({n})","{n}% Claimed"],
  ["heroDetails","Hero","Ebook विवरण button","पूरा विवरण र Preview हेर्नुहोस्"],
  ["heroBundleDetails","Hero","Bundle विवरण button","Bundle विवरण हेर्नुहोस्"],
  ["statSold","Hero","Hero stat: Sold नाम","Copies Sold"],
  ["statReviews","Hero","Hero stat: Reviews ({n})","{n} Reviews"],
  ["statDelivery","Hero","Hero stat: Delivery नाम","Delivery"],
  ["comboYour","Combo","Combo box शीर्षक","Your Custom Combo"],
  ["comboPick","Combo","Combo खाली हुँदा","तलका Ebook छान्नुहोस्..."],
  ["comboChosen","Combo","छानिएको संख्या ({n},{min})","{n}/{min} Ebooks छानिए"],
  ["comboActive","Combo","Combo सक्रिय ({percent})","✓ {percent}% Combo Discount Active"],
  ["comboNeed","Combo","थप कति छान्ने ({n})","थप {n} छान्नुहोस्"],
  ["comboSaved","Combo","कुल बचत ({amount})","कुल बचत: {amount}"],
  ["comboOnly","Combo","Combo निष्क्रिय सन्देश ({min})","{min}+ Ebook छान्दा मात्र Combo Discount सक्रिय हुन्छ।"],
  ["bundleIncludes","Bundles","Bundle मा समावेश ({n})","समावेश Ebooks ({n}):"],
  ["bundleLeft","Bundles","Bundle बाँकी ({n})","⏳ केवल {n} Bundles बाँकी"],
  ["bundleSave","Bundles","बचत ({amount})","बचत {amount}"],
  ["revVerified","Reviews","Verified tag","Verified"],
  ["revCount","Reviews","Reviews संख्या ({n})","{n} Reviews"],
  ["revSold","Reviews","Sold ({n})","{n}+ Copies Sold"],
  ["revDelivery","Reviews","Delivery ({delivery})","{delivery} Delivery"],
  ["revSupport","Reviews","Support line","Direct WhatsApp Support"],
  ["chatToday","Chat","Chat मितिको चिन्ह","TODAY"],
  ["stepWord","Steps","STEP शब्द","STEP"],
  ["footHome","Footer","Quick link: Home","Home"],
  ["footEbooks","Footer","Quick link: Ebooks","Ebooks"],
  ["footCombo","Footer","Quick link: Combo","Custom Combo"],
  ["footBundles","Footer","Quick link: Bundles","Bundles"],
  ["footFaq","Footer","Quick link: FAQ","FAQ"],
  ["footNspay","Footer","Footer NSPAY link","NSPAY Payment"],
  ["footWhatsapp","Footer","Footer WhatsApp ({n})","WhatsApp {n}"],
  ["cartTitle","Cart","Cart शीर्षक","Your Success Kit"],
  ["cartCount","Cart","Cart संख्या ({items},{ebooks})","{items} Item{s} • {ebooks} Ebook{es}"],
  ["cartEmpty","Cart","Cart खाली शीर्षक","तपाईंको Success Kit खाली छ"],
  ["cartEmptyText","Cart","Cart खाली वर्णन","पहिलो Ebook थपेर आजै सफलताको पहिलो कदम चाल्नुहोस्।"],
  ["cartBrowse","Cart","Cart खाली button","Ebooks Browse गर्नुहोस्"],
  ["cartTip","Cart","Combo सुझाव ({n},{percent})","🎁 थप {n} Ebook थप्नुहोस् र {percent}% Combo Discount पाउनुहोस्!"],
  ["cartAddMore","Cart","Ebook थप्नुहोस् link","Ebook थप्नुहोस्"],
  ["cartTypeEbook","Cart","Type: Ebook","EBOOK"],
  ["cartTypeCombo","Cart","Type: Combo","CUSTOM COMBO"],
  ["cartTypeBundle","Cart","Type: Bundle","BUNDLE"],
  ["cartIncludes","Cart","समावेश ({ids})","समावेश: {ids}"],
  ["cartNoQty","Cart","Quantity सन्देश","ℹ️ डिजिटल Ebook एउटै मात्र किनिन्छ — Quantity थप्न मिल्दैन।"],
  ["cartSaved","Cart","बचत सन्देश ({amount})","🎉 तपाईंले {amount} बचत गर्दै हुनुहुन्छ"],
  ["cartWa","Cart","WhatsApp Order button","WhatsApp मा Order गर्नुहोस्"],
  ["cartCopy","Cart","Order copy button","Order विवरण Copy गर्नुहोस्"],
  ["toastCopied","Toast","Copy भएको सन्देश","📋 Order विवरण Copy भयो"],
  ["toastRemoved","Toast","Cart बाट हटाइयो","Cart बाट हटाइयो"],
  ["toastAdded","Toast","Cart मा थपियो ({id})","🎯 राम्रो निर्णय! {id} तपाईंको Success Kit मा थपियो"],
  ["toastReplaced","Toast","Combo/Bundle ले replace ({id},{n})","🎯 {id} थपियो — {n} अलग Ebook यसैमा समावेश भए (दोहोरो भुक्तानी छैन)"],
  ["toastBlocked","Toast","दोहोरो Ebook ({title})","⚠️ यसमा भएका केही Ebook \"{title}\" मा पहिले नै छन्।"],
  ["toastNoWa","Toast","WhatsApp नम्बर नभएको सन्देश","WhatsApp नम्बर सेट गरिएको छैन।"],
  ["toastNoNspay","Toast","NSPAY link नभएको सन्देश","NSPAY link सेट गरिएको छैन — WhatsApp मा Order गर्नुहोस्।"],
  ["prevTitle","Preview","Preview modal शीर्षक ({name})","📄 Sample Chapter Preview — {name}"],
  ["prevSoon","Preview","Preview नभएको शीर्षक","नमुना अध्याय तयार हुँदैछ"],
  ["prevText","Preview","Preview नभएको वर्णन","यो Ebook को Sample Chapter WhatsApp मार्फत तुरुन्तै पठाइन्छ। तलको बटन थिचेर अनुरोध गर्नुहोस्।"],
  ["prevAsk","Preview","Sample माग्ने button","Sample माग्नुहोस्"],
  ["prevMsg","Preview","Sample माग्ने WhatsApp message ({storeName},{id},{title})","Hello {storeName}! कृपया [{id}] {title} को Sample Chapter पठाइदिनुहोस् 🙏"],
  ["policyClose","Policy","Policy बन्द button","बुझें (Close)"],
  ["navHome","Menu","Bottom menu: Home","Home"],
  ["navEbooks","Menu","Bottom menu: Ebooks","Ebooks"],
  ["navMenu","Menu","Bottom menu: Menu","Menu"],
  ["navOffers","Menu","Bottom menu: Offers","Offers"],
  ["navHelp","Menu","Bottom menu: Help","Help"],
  ["fanCombos","Menu","Fan menu: Combos","Combos"],
  ["fanBundles","Menu","Fan menu: Bundles","Bundles"],
  ["fanReviews","Menu","Fan menu: Reviews","Reviews"],
  ["fanFaq","Menu","Fan menu: FAQ","FAQ"],
  ["fanCart","Menu","Fan menu: Cart","Cart"],
  ["ppBack","Product page","पछाडि button","सबै Ebooks"],
  ["ppSold","Product page","Sold ({n})","{n} Sold"],
  ["ppReviewsN","Product page","Rating ({rating},{n})","{rating} ({n} reviews)"],
  ["ppOfferEnds","Product page","Offer countdown (उत्पादनमा अलग लेखिएन भने) — {time}","{time} मा Offer सकिन्छ"],
  ["ppLeft","Product page","बाँकी ({n})","केवल {n} बाँकी!"],
  ["ppClaimed","Product page","Claimed ({n})","{n}% Copies Claimed"],
  ["ppTaken","Product page","पहिले नै लिएका ({n})","{n} जनाले पहिले नै लिइसके"],
  ["ppTileFormat","Product page","Format tile (Product मा Format राखेको छैन भने)","Mobile PDF"],
  ["ppTileSupport","Product page","Support tile","Direct Support"],
  ["ppHookTag","Product page","Hook tag","🏁 तपाईंको पहिलो उपलब्धि"],
  ["ppForWho","Product page","'कसका लागि' शीर्षक","यो Ebook तपाईंका लागि हो यदि…"],
  ["ppOutcomes","Product page","Learning Outcomes शीर्षक","Learning Outcomes"],
  ["ppCareer","Product page","Career Relevance शीर्षक","Career Relevance"],
  ["ppInside","Product page","Chapters शीर्षक","Inside the Ebook"],
  ["ppChaptersNote","Product page","Chapters टिप्पणी ({n})","कुल {n} अध्यायमध्ये मुख्य अध्यायहरू देखाइएको।"],
  ["ppPreviewTitle","Product page","Preview card शीर्षक","Preview PDF"],
  ["ppPreviewText","Product page","Preview card वर्णन","किन्नुअघि नमुना अध्याय हेर्नुहोस् र निर्धक्क निर्णय लिनुहोस्।"],
  ["ppPreviewBtn","Product page","Preview button","Preview PDF हेर्नुहोस्"],
  ["ppReviewsSold","Product page","Reviews box: Sold ({n})","🔥 {n} जनाले यो Ebook लिएका छन्"],
  ["ppDeliveryLine","Product page","Reviews box: Delivery ({delivery})","⚡ {delivery} मा Delivery"],
  ["ppPriceTitle","Product page","Price विवरण शीर्षक","आजको Price विवरण"],
  ["ppDiscountRow","Product page","Discount row ({n})","Today Discount ({n}%)"],
  ["ppComboNote","Product page","Combo टिप्पणी ({min},{percent})","{min}+ Ebook छान्दा थप {percent}% Combo Discount स्वतः लाग्छ।"],
  ["upKicker","Product page","Bundle सुझाव: सानो शीर्षक","🎁 अझ बढी बचत"],
  ["upTitle","Product page","Bundle सुझाव शीर्षक ({short},{title},{nNe},{n},{price})","{short} — {nNe} Ebooks मात्र {price}"],
  ["upText","Product page","Bundle सुझाव वर्णन ({regular},{discount})","सबै Ebook अलग्गै किन्दा {regular}, Bundle मा {discount}% सम्म बचत।"],
  ["upCombo","Product page","Custom Combo button","Custom Combo"],
  ["ppSuggested","Product page","अन्य Ebook शीर्षक","यी Ebook पनि हेर्नुहोस्"],
  ["ppCartShort","Product page","Sticky: Cart","Cart"],
  ["ppCovered","Product page","Sticky: Bundle मा","Bundle मा"],
  ["ppLeftShort","Product page","Sticky: बाँकी ({n})","{n} left"],
  ["loadFail","Errors","Data लोड नभएको सन्देश","Store लोड हुन सकेन। Internet check गरेर फेरि प्रयास गर्नुहोस्।"],
  ["loadRetry","Errors","फेरि प्रयास button","फेरि प्रयास गर्नुहोस्"],
  ["emptyStore","Errors","Ebook नभएको सन्देश","हाम्रो Store अहिले अपडेट हुँदैछ। कृपया केही समयपछि फेरि हेर्नुहोस् वा WhatsApp मा सम्पर्क गर्नुहोस्।"]
];
D.labels = {};
SN.LABEL_META.forEach(m => { D.labels[m[0]] = m[3]; });

SN.DEFAULTS = D;
SN.defaults = () => clone(D);

/* ------------------------------------------------------------------ site config normalisation (always safe to render) */
function arr(v) { return Array.isArray(v) ? v : []; }
function sortByOrder(list) { return list.map((x, i) => [x, i]).sort((a, b) => ((num(a[0].order) ?? 1e6) - (num(b[0].order) ?? 1e6)) || a[1] - b[1]).map(x => x[0]); }
SN.sortByOrder = sortByOrder;
SN.mergeSite = pub => {
  const s = deepMerge(D, isObj(pub) ? pub : {});
  // sections: keep admin order, add any missing, drop unknown
  const seen = new Set(), list = [];
  for (const it of arr(pub && pub.sections)) if (it && SN.SECTION_IDS.includes(it.id) && !seen.has(it.id)) { seen.add(it.id); list.push({ id: it.id, enabled: it.enabled !== false }); }
  for (const id of SN.SECTION_IDS) if (!seen.has(id)) {
    if (id === "bonus") { const bi = list.findIndex(x => x.id === "bundles"); list.splice(bi >= 0 ? bi + 1 : list.length, 0, { id, enabled: true }); } else list.push({ id, enabled: true });
  }
  s.sections = list.map(x => (x.id === "library" ? { id: "library", enabled: true } : x));
  s.cart.comboMin = Math.max(2, Math.round(num(s.cart.comboMin) || 3));
  s.cart.comboPercent = Math.min(90, Math.max(0, num(s.cart.comboPercent) ?? 15));
  s.contact.whatsapp = SN.waDigits(s.contact.whatsapp);
  s.contact.whatsappDisplay = str(s.contact.whatsappDisplay) || SN.waDisplay(s.contact.whatsapp);
  for (const k of ["items"]) { /* collections stay as given */ }
  return s;
};

/* ------------------------------------------------------------------ products / bundles */
SN.CATEGORY_NAME_BUNDLE = "Bundles";
SN.normalizeProduct = (p) => {
  const o = clone(p) || {};
  o.kind = o.kind === "bundle" ? "bundle" : o.kind === "site" ? "site" : "ebook";
  for (const k of ["title", "short", "subtitle", "summary", "description", "hook", "category", "language", "coverAlt", "badge", "format", "offerLabel", "offerDescription", "urgencyLabel", "countdownText", "previewPdf", "cover"]) o[k] = str(o[k]);
  for (const k of ["tags", "forWho", "learningOutcomes", "careerRelevance", "benefits", "includes"]) o[k] = arr(o[k]).map(x => str(x)).filter(Boolean);
  if (!o.learningOutcomes.length && o.benefits.length) o.learningOutcomes = o.benefits.slice();
  o.chapterOutline = arr(o.chapterOutline).map((c, i) => ({ number: i + 1, title: str(c && c.title), description: str(c && c.description) })).filter(c => c.title);
  for (const k of ["regularPrice", "offerPrice", "rating", "reviewCount", "soldCopies", "copiesLeft", "pages", "chapters", "order"]) o[k] = num(o[k]);
  o.status = ["published", "draft", "hidden", "archived", "config"].includes(o.status) ? o.status : "draft";
  o.availability = ["available", "unavailable", "sold_out"].includes(o.availability) ? o.availability : "available";
  o.featured = !!(o.featured || o.isFeatured);
  o.isNew = !!o.isNew;
  o.offerActive = o.offerActive !== false;
  o.countdownVisible = o.countdownVisible !== false;
  o.offerStart = o.offerStart || null; o.offerEndsAt = o.offerEndsAt || null;
  if (o.kind === "ebook") o.bonus = SN.normBonus(o.bonus); else delete o.bonus;
  return o;
};
/* ------------------------------------------------------------------ BONUS RESOURCES (per Ebook; additive, off by default) */
SN.BONUS_TYPES = [["workbook", "BONUS: Workbook", "book"], ["templates", "BONUS: Templates", "file"], ["action", "BONUS: Action Plan & Roadmap", "target"], ["custom", "BONUS: Custom", "gift"]];
SN.BONUS_TYPE_IDS = SN.BONUS_TYPES.map(x => x[0]);
SN.normBonus = b => {
  b = isObj(b) ? b : {};
  const items = arr(b.items).filter(isObj).map((x, i) => ({
    id: str(x.id) || "bn" + (i + 1), type: SN.BONUS_TYPE_IDS.includes(x.type) ? x.type : "custom", title: str(x.title), description: str(x.description),
    icon: str(x.icon), cover: str(x.cover), file: str(x.file), value: num(x.value), order: num(x.order), visible: x.visible !== false, tag: str(x.tag)
  }));
  return {
    enabled: !!b.enabled, showOnHome: b.showOnHome !== false, showOnProduct: b.showOnProduct !== false, start: str(b.start) || null, end: str(b.end) || null,
    showCountdown: b.showCountdown !== false, headline: str(b.headline), hook: str(b.hook), cta: str(b.cta), eligibility: str(b.eligibility), items
  };
};
/* public (publishable) form — the private "file" reference never leaves Admin */
SN.publicBonus = b => {
  b = SN.normBonus(b);
  const items = sortByOrder(b.items.filter(x => x.visible && x.title)).map(x => { const o = { id: x.id, type: x.type, title: x.title }; for (const k of ["description", "icon", "cover", "tag"]) if (x[k]) o[k] = x[k]; if (x.value !== null && x.value > 0) o.value = x.value; return o; });
  if (!b.enabled || !items.length) return null;
  const o = { enabled: true, items };
  if (b.start) o.start = b.start;
  if (b.end) o.end = b.end;
  if (!b.showOnHome) o.showOnHome = false;
  if (!b.showOnProduct) o.showOnProduct = false;
  if (!b.showCountdown) o.showCountdown = false;
  for (const k of ["headline", "hook", "cta", "eligibility"]) if (b[k]) o[k] = b[k];
  return o;
};
/* runtime: active bonus at time `now` (or null). Expired / not-yet-started / disabled => null (the limited offer disappears automatically) */
SN.bonusRuntime = (raw, now, img) => {
  const b = SN.normBonus(raw);
  if (!b.enabled) return null;
  const items = sortByOrder(b.items.filter(x => x.visible && x.title)).map((x, i) => { const o = { ...x, cover: (img ? img(x.cover) : x.cover) || null, n: i + 1 }; delete o.file; return o; });
  if (!items.length || !SN.inWindow(b.start, b.end, now)) return null;
  const endMs = SN.parseTime(b.end);
  const total = items.reduce((a, x) => a + (x.value > 0 ? x.value : 0), 0);
  return { items, endMs: endMs || null, limited: !!endMs, showCountdown: !!endMs && b.showCountdown, totalValue: total > 0 ? total : null, headline: b.headline, hook: b.hook, cta: b.cta, eligibility: b.eligibility, showOnHome: b.showOnHome, showOnProduct: b.showOnProduct };
};
SN.isLive = p => p && p.status === "published" && p.availability !== "unavailable" && p.availability !== "sold_out";

/* price + offer state for ONE item at time `now`. offers = site.offers (campaigns) */
SN.priceInfo = (item, offers, now) => {
  const regular = num(item.regularPrice) || 0;
  const own = item.offerActive !== false && num(item.offerPrice) !== null && num(item.offerPrice) < regular && SN.inWindow(item.offerStart, item.offerEndsAt, now) ? num(item.offerPrice) : null;
  const linked = arr(offers).filter(o => o && o.active !== false && SN.inWindow(o.start, o.end, now) && (arr(o.productIds).includes(item.id) || arr(o.bundleIds).includes(item.id)));
  let price = regular, win = null;
  if (own !== null) { price = own; win = { own: true }; }
  for (const o of linked) { const pc = num(o.discountPercent); if (pc > 0 && pc < 100) { const p = Math.round(regular * (100 - pc) / 100); if (p < price) { price = p; win = { offer: o }; } } }
  const has = price < regular;
  const camp = (win && win.offer) || linked[0] || null;
  let endMs = null;
  if (has && win && win.own) endMs = SN.parseTime(item.offerEndsAt);
  else if (has && win && win.offer) endMs = SN.parseTime(win.offer.end);
  if (endMs === null && camp) endMs = SN.parseTime(camp.end);
  if (endMs === null && has) endMs = SN.parseTime(item.offerEndsAt);
  if (endMs !== null && endMs <= now) endMs = null;
  const label = (has && win && win.own && str(item.offerLabel)) || (camp && str(camp.badge)) || str(item.badge) || (has ? str(item.offerLabel) : "");
  return {
    regular, price, has, discount: has ? SN.pct(regular, price) : 0, label, endMs,
    showCountdown: !!(endMs && item.countdownVisible !== false && (has || camp)),
    countdownText: str(item.countdownText), offerDescription: str(item.offerDescription) || (camp ? str(camp.description) : ""), offer: camp
  };
};

/* ------------------------------------------------------------------ RUNTIME BUILD (storefront) */
SN.runtime = (catalog, settings, now, opts) => {
  opts = opts || {};
  const rawList = arr(catalog && catalog.products);
  const siteRec = rawList.find(p => p && p.id === SN.SITE_ID && p.site);
  const site = SN.mergeSite(siteRec ? siteRec.site : {});
  // legacy settings fallback (only when the site record doesn't set the value)
  const pubContact = siteRec && siteRec.site && siteRec.site.contact || {};
  if (settings && !str(pubContact.whatsapp) && settings.whatsappNumber) { site.contact.whatsapp = SN.waDigits(settings.whatsappNumber); site.contact.whatsappDisplay = str(pubContact.whatsappDisplay) || SN.waDisplay(site.contact.whatsapp); }
  if (settings && !str(pubContact.supportEmail) && settings.supportEmail) site.contact.supportEmail = str(settings.supportEmail);
  const img = p => SN.safeImage(p, opts);
  // categories
  let cats = sortByOrder(arr(site.categories)).filter(c => c && c.name);
  const byName = new Map(cats.map(c => [c.name.toLowerCase(), c]));
  const byId = new Map(cats.map(c => [c.id, c]));
  const catList = cats.map(c => { const p = SN.PALETTES[c.palette] || SN.PALETTES.orange; return { id: c.id, name: c.name, short: str(c.short) || c.name, code: str(c.code) || "XX", icon: c.icon || "book", from: p[0], to: p[1], visible: c.visible !== false, hidden: c.visible === false }; });
  const catByName = new Map(catList.map(c => [c.name.toLowerCase(), c]));
  const catById = new Map(catList.map(c => [c.id, c]));
  const unknown = [];
  const pickCat = name => {
    const k = str(name).toLowerCase();
    let c = catByName.get(k) || catById.get(str(name));
    if (!c) {
      c = { id: "x-" + (k.replace(/[^a-z0-9]+/g, "-") || "other"), name: str(name) || "Other", short: str(name) || "Other", code: "XX", icon: "book", from: SN.PALETTES.orange[0], to: SN.PALETTES.orange[1], visible: true, hidden: false, auto: true };
      catByName.set(k, c); catById.set(c.id, c); unknown.push(c);
    }
    return c;
  };
  // ebooks
  const ebooks = [];
  for (const r of rawList) {
    if (!r || r.id === SN.SITE_ID || r.kind === "bundle" || r.kind === "site") continue;
    const p = SN.normalizeProduct(r);
    if (!SN.isLive(p) || !p.id || !p.title) continue;
    const c = pickCat(p.category), pi = SN.priceInfo(p, site.offers, now);
    ebooks.push({
      ...p, kind: "ebook", category: c.id, categoryName: c.name, code: c.code,
      short: p.short || p.title, subtitle: p.subtitle, summary: p.summary || p.subtitle || p.description.slice(0, 140),
      bonus: SN.bonusRuntime(p.bonus, now, img), cover: img(p.cover) || null, previewPdf: SN.safeDoc(p.previewPdf) || null, pages: p.pages, chapters: p.chapters || (p.chapterOutline.length || null),
      regularPrice: pi.regular, salePrice: pi.price, hasOffer: pi.has, discount: pi.discount, offerLabel: pi.label, urgencyLabel: p.urgencyLabel,
      endMs: pi.endMs, showCountdown: pi.showCountdown, countdownText: pi.countdownText, offerDescription: pi.offerDescription,
      rating: p.rating, reviewCount: p.reviewCount, soldCopies: p.soldCopies, copiesLeft: p.copiesLeft, isFeatured: p.featured, isNew: p.isNew, _order: p.order
    });
  }
  const sorted = sortByOrder(ebooks.map(e => ({ ...e, order: e._order })));
  ebooks.length = 0; sorted.forEach(e => { delete e.order; ebooks.push(e); });
  const EBYID = Object.fromEntries(ebooks.map(e => [e.id, e]));
  // bundles
  const bundles = [];
  for (const r of rawList) {
    if (!r || r.kind !== "bundle") continue;
    const b = SN.normalizeProduct(r);
    if (!SN.isLive(b) || !b.id || !b.title) continue;
    const inc = b.includes.filter(id => EBYID[id]);
    if (!inc.length) continue;
    const eb = inc.map(id => EBYID[id]);
    const sum = eb.reduce((a, p) => a + p.regularPrice, 0);
    const reg = (num(b.regularPrice) && b.regularPrice > 0) ? b.regularPrice : sum;
    const pi = SN.priceInfo({ ...b, regularPrice: reg }, site.offers, now);
    const rated = eb.filter(p => p.rating !== null && p.reviewCount > 0);
    const rc = rated.reduce((a, p) => a + p.reviewCount, 0);
    bundles.push({
      ...b, kind: "bundle", includes: inc, ebooks: eb, short: b.short || b.title, subtitle: b.subtitle, summary: b.summary || b.subtitle || b.description.slice(0, 140),
      cover: img(b.cover) || null, regularPrice: pi.regular, salePrice: pi.price, hasOffer: pi.has, discount: pi.discount, offerLabel: pi.label, badge: b.badge,
      endMs: pi.endMs, showCountdown: pi.showCountdown, countdownText: pi.countdownText, offerDescription: pi.offerDescription,
      reviewCount: rc || null, rating: rc ? Math.round(rated.reduce((a, p) => a + p.rating * p.reviewCount, 0) / rc * 10) / 10 : null, soldCopies: null, copiesLeft: b.copiesLeft, isFeatured: b.featured, _order: b.order
    });
  }
  const sb = sortByOrder(bundles.map(e => ({ ...e, order: e._order })));
  bundles.length = 0; sb.forEach(e => { delete e.order; bundles.push(e); });
  // site-wide numbers (only real values; empty -> hidden)
  const all = ebooks.concat(bundles);
  const sold = ebooks.reduce((a, p) => a + (p.soldCopies || 0), 0);
  const rv = ebooks.filter(p => p.rating !== null && p.reviewCount > 0);
  const reviewCount = rv.reduce((a, p) => a + p.reviewCount, 0);
  const stats = {
    totalSold: sold, totalReviews: reviewCount, avgRating: reviewCount ? Math.round(rv.reduce((a, p) => a + p.rating * p.reviewCount, 0) / reviewCount * 10) / 10 : null,
    maxDiscount: all.reduce((a, p) => Math.max(a, p.discount || 0), 0)
  };
  const stocked = ebooks.filter(p => p.copiesLeft !== null && p.copiesLeft > 0);
  const lowStock = stocked.length ? stocked.reduce((a, b) => (b.copiesLeft < a.copiesLeft ? b : a)) : null;
  const ends = [];
  all.forEach(p => { if (p.showCountdown && p.endMs) ends.push(p.endMs); });
  arr(site.offers).forEach(o => { if (o && o.active !== false && SN.inWindow(o.start, o.end, now)) { const e = SN.parseTime(o.end); if (e && e > now) ends.push(e); } });
  const nearestEnd = ends.length ? Math.min(...ends) : null;
  const chg = [];
  rawList.forEach(r => { if (r && r.bonus && r.bonus.enabled) { const bb = SN.normBonus(r.bonus); [SN.parseTime(bb.start), SN.parseTime(bb.end)].forEach(t => { if (t && t > now) chg.push(t); }); } });
  const changeAt = chg.length ? Math.min(...chg) : null;
  // reviews / chat
  const reviews = sortByOrder(arr(site.reviews.items).filter(r => r && r.visible !== false && str(r.text) && str(r.name))).map(r => ({ name: str(r.name), place: str(r.place), rating: Math.min(5, Math.max(1, num(r.rating) || 5)), productId: EBYID[r.productId] ? r.productId : null, date: str(r.date), text: str(r.text), verified: !!r.verified, sample: !!r.sample }));
  const chat = sortByOrder(arr(site.chat.items).filter(m => m && m.visible !== false && str(m.text))).map(m => ({ from: m.from === "out" ? "out" : "in", name: str(m.name), time: str(m.time), text: str(m.text), sample: !!m.sample }));
  const goals = sortByOrder(arr(site.goals.items).filter(g => g && g.visible !== false && str(g.title)));
  // variables usable inside texts
  const catNames = catList.filter(c => c.visible && ebooks.some(e => e.category === c.id)).map(c => c.name);
  const vars = {
    storeName: site.store.name, storeNameUpper: String(site.store.name).toUpperCase(), tagline: site.store.tagline, founder: site.store.founder,
    delivery: site.delivery.time, deliveryNe: SN.ne(site.delivery.time), deliveryMethod: site.delivery.method, deliveryText: SN.fill(site.delivery.text, { delivery: site.delivery.time }, "keep"), whatsappDisplay: site.contact.whatsappDisplay, whatsapp: site.contact.whatsappDisplay, email: site.contact.supportEmail,
    comboMin: SN.ne(site.cart.comboMin), comboMinN: site.cart.comboMin, comboPercent: site.cart.comboPercent, maxDiscount: stats.maxDiscount || null, categories: catNames.join(", "),
    year: new Date(now).getFullYear(), nspayUrl: site.payment.nspayUrl, supportHours: site.contact.supportHours, stepCount: SN.ne(arr(site.steps.items).filter(s => s.visible !== false).length)
  };
  // ticker lines
  const lines = [];
  arr(site.ticker.items).forEach(t => { if (t && t.visible !== false && str(t.text) && SN.inWindow(t.start, t.end, now)) lines.push({ order: num(t.order) ?? 500, text: str(t.text), cta: str(t.ctaText), action: t.ctaAction || (SN.safeUrl(t.ctaUrl) ? "url:" + t.ctaUrl : "section:explore") }); });
  if (site.ticker.autoOffers) arr(site.offers).forEach(o => { if (o && o.active !== false && o.showInTicker !== false && SN.inWindow(o.start, o.end, now) && str(o.title)) lines.push({ order: num(o.order) ?? 500, text: [str(o.badge), str(o.title) + (str(o.subtitle) ? " — " + str(o.subtitle) : "")].filter(Boolean).join(" ").trim(), cta: str(o.ctaText), action: o.ctaAction || (arr(o.bundleIds)[0] ? "section:bundles" : arr(o.productIds)[0] ? "product:" + o.productIds[0] : "section:explore") }); });
  if (site.ticker.autoCombo && site.cart.comboEnabled && ebooks.length >= site.cart.comboMin) lines.push({ order: 99999, text: SN.fill(site.ticker.comboText, vars), cta: "", action: "section:combos" });
  const ticker = sortByOrder(lines);
  const sectionOn = id => !!(site.sections.find(s => s.id === id) || { enabled: true }).enabled;
  return { site, vars, categories: catList, ebooks, bundles, EBYID, stats, lowStock, nearestEnd, changeAt, reviews, chat, goals, ticker, unknownCategories: unknown, sectionOn, now };
};

/* ------------------------------------------------------------------ ORDER MESSAGE (cart -> WhatsApp) */
SN.msgVars = (site, list, totals, fmtFn, extra) => {
  const f = fmtFn || (n => SN.fmt(n, site.store.currency));
  const items = list.map((it, i) => {
    const price = it.todayPrice - (it.comboOff || 0);
    return `${i + 1}. [${it.id}] ${it.title} — ${f(price)}` + (it.kind !== "ebook" && it.ebookIds ? `\n    समावेश: ${it.ebookIds.join(", ")}` : "") + (arr(it.bonus).length ? `\n    🎁 Bonus: ${it.bonus.join(", ")}` : "");
  }).join("\n");
  const t = totals;
  const summary = [`Regular Price: ${f(t.regular)}`, `Today Discount: -${f(t.todayDiscount)}`, `Today Price: ${f(t.today)}`, t.comboDiscount > 0 ? `Combo Discount: -${f(t.comboDiscount)}` : null, `Final Amount: ${f(t.final)}`].filter(Boolean).join("\n");
  return Object.assign({
    storeName: site.store.name, items, bonusList: list.filter(it => arr(it.bonus).length).map(it => `🎁 ${it.title}: ${it.bonus.join(", ")}`).join("\n"), priceSummary: summary, regularPrice: f(t.regular), todayDiscount: t.todayDiscount > 0 ? "-" + f(t.todayDiscount) : "", todayPrice: f(t.today),
    comboDiscount: t.comboDiscount > 0 ? "-" + f(t.comboDiscount) : "", total: f(t.final), quantity: t.ebookCount,
    productName: list.map(i => i.title).join(", "), productId: list.map(i => i.id).join(", "), customerName: "", paymentReference: "",
    nspayUrl: site.payment.nspayUrl, delivery: site.delivery.time, deliveryMethod: site.delivery.method, deliveryText: SN.fill(site.delivery.text, { delivery: site.delivery.time }, "keep"), whatsappDisplay: site.contact.whatsappDisplay
  }, extra || {});
};
SN.renderMessage = (template, vars) => SN.fill(template, vars, "line");
SN.MESSAGE_KEYS = [["order", "WhatsApp Order message (Customer ले पठाउने)"], ["paymentInstruction", "Payment instruction message"], ["paymentVerified", "Payment verification message"], ["delivery", "Ebook delivery message"], ["support", "Support message"], ["followUp", "Follow-up message"]];
SN.PLACEHOLDERS = [["{bonusList}", "Order मा समावेश Bonus Resources (भए मात्र)"], ["{customerName}", "ग्राहकको नाम"], ["{productName}", "Ebook / Bundle को नाम"], ["{productId}", "Product ID (जस्तै SN001CS)"], ["{quantity}", "कति वटा Ebook"], ["{total}", "कुल रकम"], ["{paymentReference}", "Payment Reference / Transaction ID"], ["{storeName}", "Store को नाम"], ["{items}", "Order का सबै items (ID सहित)"], ["{priceSummary}", "Regular / Discount / Final रकम"], ["{nspayUrl}", "NSPAY link"], ["{delivery}", "Delivery समय"], ["{whatsappDisplay}", "WhatsApp नम्बर"]];

/* ------------------------------------------------------------------ IDs */
SN.categoryCode = (name, used) => {
  const letters = String(name || "").replace(/[^A-Za-z ]/g, " ").trim().split(/\s+/).filter(Boolean);
  let c = letters.length > 1 ? (letters[0][0] + letters[1][0]) : (letters[0] || "XX").slice(0, 2);
  c = (c + "XX").slice(0, 2).toUpperCase();
  const u = new Set((used || []).map(x => String(x).toUpperCase()));
  if (!u.has(c)) return c;
  for (const a of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") for (const b of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") if (!u.has(a + b)) return a + b;
  return c;
};
SN.nextEbookId = (products, code) => {
  code = String(code || "XX").toUpperCase();
  let max = 0;
  for (const p of products) { const m = String(p.id || "").match(new RegExp("^SN(\\d{3})" + code + "$")); if (m) max = Math.max(max, +m[1]); }
  return "SN" + String(max + 1).padStart(3, "0") + code;
};
SN.nextBundleId = products => { let max = 0; for (const p of products) { const m = String(p.id || "").match(/^SNB(\d{3})$/); if (m) max = Math.max(max, +m[1]); } return "SNB" + String(max + 1).padStart(3, "0"); };
SN.slug = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || SN.uid("c");

/* ------------------------------------------------------------------ PUBLIC DATA BUILD (admin -> Worker payload) */
const PRODUCT_FIELDS = ["id", "kind", "title", "short", "subtitle", "summary", "description", "hook", "category", "language", "tags", "cover", "coverAlt", "badge", "status", "availability", "featured", "isNew", "order", "pages", "chapters", "format", "previewPdf", "forWho", "learningOutcomes", "careerRelevance", "chapterOutline", "regularPrice", "offerPrice", "offerActive", "offerStart", "offerEndsAt", "offerLabel", "offerDescription", "urgencyLabel", "countdownVisible", "countdownText", "rating", "reviewCount", "soldCopies", "copiesLeft", "includes", "bonus", "createdAt", "updatedAt"];
SN.IMAGE_FIELDS = (site) => {
  const out = [];
  const add = (obj, key, where) => { if (obj && obj[key]) out.push({ obj, key, where }); };
  add(site.store, "logo", "logo"); add(site.seo, "ogImage", "og"); add(site.seo, "favicon", "favicon");
  arr(site.offers).forEach(o => add(o, "image", "offer"));
  return out;
};
SN.cleanProduct = p => {
  const n = SN.normalizeProduct(p), o = {};
  for (const k of PRODUCT_FIELDS) {
    let v = n[k];
    if (k === "featured") v = !!n.featured;
    if (k === "bonus") { const pb = SN.publicBonus(n.bonus); if (pb) o.bonus = pb; continue; }
    if (v === "" || v === undefined || (Array.isArray(v) && !v.length && k !== "tags")) continue;
    if (v === null && !["offerPrice", "pages"].includes(k)) continue;
    o[k] = v;
  }
  if (n.kind === "ebook") delete o.kind;
  o.isFeatured = !!n.featured; // storefront-friendly alias; Worker passes unknown fields through
  return o;
};
function pruneSite(site, now) {
  const s = clone(site);
  const vis = list => arr(list).filter(x => x && x.visible !== false);
  s.reviews.items = vis(s.reviews.items); s.chat.items = vis(s.chat.items); s.faq.items = vis(s.faq.items);
  s.trust.items = vis(s.trust.items); s.goals.items = vis(s.goals.items); s.steps.items = vis(s.steps.items);
  s.footer.policies = vis(s.footer.policies); s.footer.links = vis(s.footer.links); s.ticker.items = vis(s.ticker.items);
  s.categories = arr(s.categories).filter(c => c && c.name); // hidden categories stay published so their products keep a group
  s.offers = arr(s.offers).filter(o => o && o.active !== false);
  s.social = arr(s.social).filter(x => x && x.enabled && (x.id === "whatsapp" || SN.safeUrl(x.url)));
  return s;
}
SN.pruneSite = pruneSite;
/* state = { products:[...all local records], site:{...} } */
SN.buildPublic = (state, opts) => {
  opts = opts || {};
  const now = opts.now || Date.now();
  const site = SN.mergeSite(state.site);
  const force = new Set(opts.forceInclude || []);
  const recs = [];
  const eligible = p => { const n = SN.normalizeProduct(p); return force.has(n.id) ? { ...n, status: "published", availability: "available" } : n; };
  const live = arr(state.products).map(eligible).filter(SN.isLive);
  const liveIds = new Set(live.map(p => p.id));
  const sumReg = ids => ids.reduce((a, id) => a + (num((live.find(x => x.id === id) || {}).regularPrice) || 0), 0);
  for (const p of live) {
    if (p.kind === "bundle") {
      const b = { ...p, category: SN.CATEGORY_NAME_BUNDLE, includes: p.includes.filter(id => liveIds.has(id)) };
      if (!(num(b.regularPrice) > 0)) b.regularPrice = sumReg(b.includes);
      recs.push(SN.cleanProduct(b));
    } else recs.push(SN.cleanProduct(p));
  }
  const pub = pruneSite(site, now);
  recs.push({ id: SN.SITE_ID, kind: "site", title: "StudyNotes site settings", category: "_site", status: "config", availability: "available", regularPrice: 0, updatedAt: new Date(now).toISOString(), site: pub });
  const catalog = { schemaVersion: 1, updatedAt: new Date(now).toISOString(), products: recs };
  const settings = { whatsappNumber: site.contact.whatsapp, supportEmail: site.contact.supportEmail, paymentInstructions: String(site.payment.instructions || "").slice(0, 2000) };
  // every image path that the public data points at
  const paths = new Set();
  recs.forEach(r => { if (r.cover) paths.add(r.cover); if (r.bonus) r.bonus.items.forEach(x => { if (x.cover) paths.add(x.cover); }); });
  SN.IMAGE_FIELDS(pub).forEach(f => paths.add(f.obj[f.key]));
  return { catalog, settings, imagePaths: [...paths].filter(p => /^assets\/covers\//.test(p)), counts: { ebooks: live.filter(p => p.kind !== "bundle").length, bundles: live.filter(p => p.kind === "bundle").length } };
};

/* ------------------------------------------------------------------ VALIDATION (beginner friendly, Nepali) */
SN.validate = (state, now) => {
  now = now || Date.now();
  const errs = [], warns = [];
  const E = (msg, where) => errs.push({ msg, where }), W = (msg, where) => warns.push({ msg, where });
  const site = SN.mergeSite(state.site);
  const prods = arr(state.products).map(SN.normalizeProduct);
  const ids = new Map();
  prods.forEach(p => { if (ids.has(p.id)) E(`ID दोहोरिएको छ: ${p.id}`, "products"); ids.set(p.id, true); });
  const live = prods.filter(SN.isLive);
  const liveEbooks = live.filter(p => p.kind === "ebook"), liveB = live.filter(p => p.kind === "bundle");
  if (!liveEbooks.length) E("कम्तीमा एउटा Ebook 'Published' र 'Available' हुनुपर्छ।", "products");
  const catNames = new Set(arr(site.categories).map(c => String(c.name).toLowerCase()));
  for (const p of liveEbooks) {
    const nm = p.title || p.id;
    if (!p.title) E(`${p.id}: Title चाहिन्छ।`, "products");
    if (!p.category) E(`${nm}: Category छान्नुहोस्।`, "products");
    else if (!catNames.has(p.category.toLowerCase())) W(`${nm}: "${p.category}" category सूचीमा छैन — Categories पेजमा थप्नुहोस्।`, "categories");
    if (!(p.regularPrice >= 0) || p.regularPrice === null) E(`${nm}: Regular price राख्नुहोस्।`, "products");
    if (p.offerPrice !== null && p.offerPrice > p.regularPrice) E(`${nm}: Offer price Regular price भन्दा बढी हुनु हुँदैन।`, "products");
    if (!p.cover) W(`${nm}: Cover image छैन — Website मा Designed (अक्षर/रङ) Cover देखिन्छ। असली Cover राख्न Edit गर्नुहोस्।`, "products");
    if (p.offerEndsAt && SN.parseTime(p.offerEndsAt) !== null && SN.parseTime(p.offerEndsAt) <= now && p.offerPrice !== null && p.offerActive) W(`${nm}: Offer को समय सकिसकेको छ — Public site मा अब Regular price देखिन्छ।`, "products");
    if (p.offerStart && p.offerEndsAt && SN.parseTime(p.offerStart) >= SN.parseTime(p.offerEndsAt)) E(`${nm}: Offer सुरु हुने समय अन्त्यभन्दा अघि हुनुपर्छ।`, "products");
    if (p.rating !== null && (p.rating < 0 || p.rating > 5)) E(`${nm}: Rating 0 देखि 5 बीच हुनुपर्छ।`, "products");
    if (p.previewPdf && !SN.safeDoc(p.previewPdf)) E(`${nm}: Preview link https:// बाट सुरु हुनुपर्छ।`, "products");
  }
  for (const p of live) {
    if (p.kind !== "ebook" || !p.bonus || !p.bonus.enabled) continue;
    const nm = p.title || p.id, bn = p.bonus, vis = bn.items.filter(x => x.visible);
    if (!vis.length) W(`${nm}: Bonus चालु छ तर देखिने Bonus Item छैन — Public site मा Bonus देखिँदैन।`, "bonus");
    vis.forEach(x => { if (!x.title) E(`${nm}: Bonus Item को Title चाहिन्छ।`, "bonus"); if (x.cover && !/^assets\/covers\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(x.cover)) E(`${nm}: Bonus "${x.title}" को Image सही देखिएन (फेरि Upload गर्नुहोस्)।`, "bonus"); });
    if (bn.start && bn.end && SN.parseTime(bn.start) >= SN.parseTime(bn.end)) E(`${nm}: Bonus Offer सुरु हुने समय अन्त्यभन्दा अघि हुनुपर्छ।`, "bonus");
    else if (bn.end && SN.parseTime(bn.end) <= now) W(`${nm}: Bonus Offer को समय सकिसकेको — Public site मा Bonus देखिँदैन।`, "bonus");
    if (!bn.end) W(`${nm}: Bonus Offer सकिने मिति राखिएको छैन — "सीमित समय" वाक्य र Countdown देखिँदैन (Bonus सधैं देखिन्छ)।`, "bonus");
  }
  for (const b of liveB) {
    const nm = b.title || b.id;
    if (!b.title) E(`${b.id}: Bundle Title चाहिन्छ।`, "bundles");
    const inc = b.includes.filter(id => live.find(p => p.id === id && p.kind === "ebook"));
    if (inc.length < 2) E(`${nm}: Bundle मा कम्तीमा २ Published Ebook चाहिन्छ।`, "bundles");
    if (b.includes.length !== inc.length) W(`${nm}: केही Ebook Published छैनन् — ती Bundle बाट हटाइनेछन्।`, "bundles");
    const reg = (b.regularPrice > 0) ? b.regularPrice : inc.reduce((a, id) => a + (live.find(p => p.id === id).regularPrice || 0), 0);
    if (b.offerPrice === null) W(`${nm}: Bundle sale price राखिएको छैन — Regular price नै देखिन्छ।`, "bundles");
    if (b.offerPrice !== null && b.offerPrice > reg) E(`${nm}: Bundle sale price Regular price भन्दा बढी हुनु हुँदैन।`, "bundles");
  }
  if (!SN.waDigits(site.contact.whatsapp)) W("WhatsApp नम्बर राखिएको छैन — Customer ले Order पठाउन सक्दैनन्।", "whatsapp");
  else if (SN.waDigits(site.contact.whatsapp).length < 8) E("WhatsApp नम्बर देश कोड सहित (जस्तै 9779XXXXXXXXX) राख्नुहोस्।", "whatsapp");
  if (site.payment.nspayUrl && !SN.safeUrl(site.payment.nspayUrl)) E("NSPAY link https:// बाट सुरु हुनुपर्छ।", "payment");
  if (site.contact.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contact.supportEmail)) E("Support email सही देखिएन।", "email");
  arr(site.social).forEach(s => { if (s.enabled && s.id !== "whatsapp" && !SN.safeUrl(s.url)) E(`${s.name}: Link https:// बाट सुरु हुनुपर्छ (वा Social Links मा Off गर्नुहोस्)।`, "social"); });
  arr(site.offers).forEach(o => { if (o.active !== false && o.start && o.end && SN.parseTime(o.start) >= SN.parseTime(o.end)) E(`Offer "${o.title || ""}": सुरु हुने समय अन्त्यभन्दा अघि हुनुपर्छ।`, "offers"); });
  arr(site.footer.links).forEach(l => { if (l.visible !== false && !SN.safeUrl(l.url)) E(`Footer link "${l.label || ""}": https:// link चाहिन्छ।`, "store"); });
  arr(site.ticker.items).forEach(t => { if (t.ctaUrl && !SN.safeUrl(t.ctaUrl)) E(`Ticker CTA link https:// बाट सुरु हुनुपर्छ।`, "marketing"); });
  if (!SN.parseAction(site.hero.cta1.action).type) W("Hero button को action छानिएको छैन।", "homepage");
  const b64 = JSON.stringify(SN.buildPublic(state, { now }).catalog).length;
  if (b64 > 900000) W("Catalog धेरै ठूलो हुँदैछ। केही पुराना items हटाउनुहोस्।", "publishing");
  return { errors: errs, warnings: warns };
};

root.SN = SN;
if (typeof module !== "undefined" && module.exports) module.exports = SN;
})(typeof window !== "undefined" ? window : globalThis);
