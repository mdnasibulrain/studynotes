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
