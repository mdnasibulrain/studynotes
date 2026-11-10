# StudyNotes — Storefront + Central Admin (Product Manager)

GitHub Pages storefront · Admin at `/mnrsnadmin/` · Cloudflare Direct Publish Worker (UNCHANGED).
Flow: `Admin input → saved data → Direct Publish Worker → GitHub → GitHub Pages → public storefront`.
Manual business flow is unchanged: Meta Ads → StudyNotes → NSPAY → manual payment check → WhatsApp/Email → manual PDF delivery.

## Files
| File | Purpose |
|---|---|
| `index.html` | NEW public storefront (approved locked design, data-driven, with Preloader) |
| `next.html` | identical copy of the new storefront, for staged testing before replacing `index.html` |
| `index-legacy.html`, `assets/js/store.js`, `assets/css/style.css` | OLD storefront, kept for rollback |
| `favicon.svg` | default favicon |
| (inside `index.html`) | Preloader: sketch-drawn logo + handwritten brand name; Admin → Store → Preloader (On/Off) |
| `mnrsnadmin.html`, `mnrsnadmin/index.html` | NEW Admin (same app, different relative paths) |
| `assets/css/admin.css` | Admin styles (mobile first) |
| `assets/js/site-core.js` | shared engine: defaults, price/offer logic, publish build, validation, message templates |
| `assets/js/admin-core.js` | Admin storage, images, import/export, publish client |
| `assets/js/admin-forms.js` | Admin form engine |
| `assets/js/admin-pages1.js`, `admin-pages2.js` | all Admin pages |
| `assets/js/admin-app.js` | Admin navigation, preview, boot |
| `extras/starter-content.json` | optional starter DRAFT products (no fake ratings/sales/scarcity) |
| `data/products.json`, `data/store-settings.json`, `assets/covers/*` | live data (written by Publish — do not edit by hand) |
| `worker/*` | Cloudflare Worker — NOT modified |

## Data model (no Worker change)
* `data/products.json` keeps `schemaVersion: 1`. Ebooks are normal products; **bundles** are `kind:"bundle"` products (`category:"Bundles"`, `includes:[ids]`); all site content (hero, ticker, FAQ, reviews, labels, messages, sections, cart, SEO, …) lives in ONE config record `{id:"__site__", kind:"site", status:"config", site:{…}}` inside `products[]`. The Worker passes unknown fields through, so it needs no change.
* `data/store-settings.json` still carries `whatsappNumber`, `supportEmail`, `paymentInstructions` (legacy keys).
* Old data without a `__site__` record still renders (safe defaults).

## Preloader
Built into `index.html`/`next.html` (plain HTML/CSS/JS, paints before React loads). Controlled from Admin → Preloader: on/off, once-per-tab or always, minimum seconds, speed, logo mode (drawn open-book + bold SN / your logo / none), typewriter lines (brand, identity, extra line), cursor, accent colour, background, progress line, Skip button text. Test on the live site with `?preloader=1`.

## Secrets
Nothing secret is in any file. The Admin password (ADMIN_SECRET) is typed on the Publish page and kept in memory only (never saved). GitHub token lives only in Cloudflare.
Original ebook PDFs must never be uploaded; the only optional PDF is a sample link (Drive) in the product's "Preview PDF" field.

## Limits (honest)
* Facebook/WhatsApp link previews don't run JavaScript: paste the 5-line OG snippet from Admin → SEO into `<head>` of `index.html` once.
* Draft/Hidden/Archived products are never published (they stay in the browser + backups). Use Backup → Export regularly.
* The locked design has no slot for a hero image, subcategory, or a separate Offers section; offers drive ticker, badges, countdown and price.
* Browser-local state: use Backup export / "Live Store data" to move between devices.

## Dummy catalog (reference)
`data/products.json` now holds the 6 dummy ebooks + 2 bundles of the approved reference design (names, prices, descriptions, ratings, sold/copies-left, sample reviews and sample chat — Reviews/Chat carry a visible "Sample" label). They are PLACEHOLDERS: replace them in Admin before advertising. Covers are the designed (generated) covers; upload real covers in Admin whenever you like.
Offers end on 31 Dec 2026 (Nepal time) — extend in Admin → Ebooks → Price/Offer. `extras/reference-dummy-backup.json` restores the same dummy catalog into Admin (Backup / Import → Replace).

---
## 🎁 Bonus Resources (नयाँ)
- Admin → **Bonus Resources** (वा Ebook खोल्दा "६. Bonus Resources") बाट प्रत्येक Ebook को आफ्नै Bonus (Workbook / Templates / Action Plan / Custom) थप्ने, सम्पादन, क्रम, लुकाउने, मेट्ने।
- Offer सुरु/अन्त्य मिति राख्दा समय सकिएपछि Bonus Offer Public site बाट आफैं हट्छ (Countdown वास्तविक अन्त्य-मितिमा आधारित)।
- 🔒 "PDF फाइलको नाम / Private Reference" Admin मै रहन्छ — Publish मा जाँदैन। मूल PDF GitHub मा Upload हुँदैन।
- Bonus नराखेको Ebook/Site जस्ताको तस्तै देखिन्छ। Worker परिवर्तन छैन।
- Rollback: `assets/js/site-core.js`, `admin-*.js`, `index.html`, `next.html`, `mnrsnadmin*.html` को अघिल्लो संस्करण फर्काउनुहोस् (`admin-bonus.js` मेटे हुन्छ)।

### Bonus Strip (compact UI)
Product पेजमा Description/"कसका लागि" पछि, Homepage र Cart मा सानो horizontal Bonus Strip। Admin → Bonus Resources: शीर्षक, Subtitle, INCLUDED Badge, Trust लाइन, Free/Original Value Label, Cart Strip on/off र प्रत्येक Bonus को Cover/Badge/Value। नयाँ फाइल केही छैन; `index.html`, `next.html`, `assets/js/site-core.js`, `assets/js/admin-bonus.js` मात्र बदलिए।

---
## 🧾 Product Page नियन्त्रण / Preview PDF / Chapters Popup / Cover Badges (नयाँ)
- Admin → **Product Page** : Cover ४-कुने Badge (Carousel · Library · Product · Preview), Hero का बटन/chip, खण्डको क्रम र देखाउने/लुकाउने, शीर्षक, Inside the Ebook + "See all Chapters" Popup (Hook + CTA)।
- Ebooks → सम्पादन → **६. Preview Slides** : ५–१० पृष्ठको Preview PDF Upload → हरेक पृष्ठ Slide बन्छ। Browser मै PDF → Image (pdf.js, `assets/vendor/`)। Image हरू `assets/covers/` मार्फत Publish हुन्छन् (Worker परिवर्तन छैन)। पूरा PDF कहिल्यै Publish हुँदैन।
- Ebooks → सम्पादन → **८. यो Ebook को Product Page** : यही Ebook मा मात्र खण्ड लुकाउने / Chapters संख्या।
- "Publish नगरिएका परिवर्तन" पट्टी: Live site सँग Data एउटै भए आफैं हरियो हुन्छ; पट्टी थिचेर पनि जाँच्न सकिन्छ।
- नयाँ Data: `site.productPage` (Site record भित्र), product मा `preview.pages`, `pageHide`, `insideCount`। Worker जस्ताको तस्तै।

---
## ⭐ Reviews "Show all" Popup + 💬 Testimonials Slider (नयाँ)
- Admin → **Reviews / Testimonials**: जति Review पनि थप्न मिल्छ। **Homepage / Product Page** मा सुरुमा कति देखाउने (० = सबै) तोक्न मिल्छ; बीचको **Show all Reviews** बटन थिच्दा Popup मा सबै Review देखिन्छ। बटन Text, Popup शीर्षक/उपशीर्षक र बटन देखाउने/नदेखाउने Admin बाटै।
- **Testimonials**: धेरै **Chat Box** बनाउन मिल्छ (१. Chat Boxes), हरेक सन्देशमा "कुन Chat Box मा?" छान्ने। Public site मा Swipe / Arrow / Dots / Auto-slide (सबै Admin बाट On/Off)। **Show all Testimonials** बटनले सबै Chat Box Popup मा खोल्छ।
- पुरानो Data जस्ताको तस्तै चल्छ: Chat Box नबनाए सबै सन्देश एउटै Box मा। नयाँ Data `site.reviews.*`, `site.chat.boxes`, message मा `box` — Worker परिवर्तन छैन।
- बदलिएका फाइल: `index.html`, `next.html`, `assets/js/site-core.js`, `assets/js/admin-pages2.js`, `README.md`।

---
## 👤 Review / Chat Box Avatar फोटो (नयाँ)
- Review को गोलो आइकनमा नामको पहिलो अक्षर र Chat Box माथिको StudyNotes Logo को सट्टा **फोटो** देखिन्छ।
- प्राथमिकता: (१) Review / Chat Box मा राखेको Customer को **वास्तविक फोटो** (Admin → Reviews / Testimonials → ग्राहकको फोटो Upload) → (२) **Default फोटो सूची** (पुरुष/महिला) बाट नामअनुसार अनुमान गरेको Gender को फोटो (हरेक नामलाई सधैं उही फोटो) → (३) फोटो नभए पहिलेकै Letter / Logo।
- Gender अनुमान गलत भए Review/Chat Box मै Gender (पुरुष/महिला) छान्न मिल्छ। Default फोटो सूची On/Off गर्न मिल्छ।
- फोटो आफैं सानो (240×240 square) बनाइन्छ, `assets/covers/` मार्फत Publish हुन्छ। Worker परिवर्तन छैन।
- बदलिएका फाइल: `index.html`, `next.html`, `assets/js/site-core.js`, `assets/js/admin-core.js`, `assets/js/admin-pages2.js`।
