# StudyNotes Launch Kit

A starter implementation for a Nepali-first ebook storefront and a separate product manager, designed for GitHub Pages and Android-phone operation.

## Included

- `index.html`: public storefront.
- `mnrsnadmin.html`: unlisted product manager.
- `mnrsnadmin/index.html`: same manager at the clean `/mnrsnadmin/` path on GitHub Pages.
- `assets/css/style.css`: storefront styling.
- `assets/css/admin.css`: manager styling.
- `assets/js/store.js`: public catalog renderer.
- `assets/js/admin.js`: local product CRUD, IndexedDB cover storage, import/export, publish client.
- `data/products.json`: public product catalog.
- `data/store-settings.json`: public support settings.
- `worker/src/index.js`: Cloudflare Worker publishing API.
- `worker/wrangler.toml`: Worker project config.

## Important limitations and security

1. This starter is not a secure customer checkout or payment processor. NSPAY payments are manual; PDF delivery remains manual.
2. The manager route is unlisted, not hidden from the internet. The Worker requires an admin secret and only accepts requests from `SITE_ORIGIN`.
3. Never put a GitHub token in `mnrsnadmin.html`, JavaScript, or any public repository file.
4. The Worker secret is a shared publishing secret, not a full identity/login system. Keep it private and rotate it if exposed.
5. GitHub Pages may take a few minutes to deploy a commit.
6. The browser stores draft product data locally. It does not automatically sync across devices. Export backups regularly.
7. Cover files are stored in IndexedDB in the same browser. If browser data is cleared, unexported cover files can be lost.
8. Offer timers use the `offerEndsAt` date. A timer ending does not modify the catalog; the storefront switches to the regular price after the deadline.
9. This kit needs testing on the actual GitHub Pages project before advertising. Do not treat it as fully production-certified.
10. The Worker writes files sequentially through the GitHub Contents API, so a multi-file publish may create several commits rather than one atomic commit.

## A. Create the GitHub repository from Android

1. In the GitHub app or browser, create a new repository. For a normal project website, a repository such as `studynotes-store` works.
2. Upload the contents of this kit to the repository root, preserving folders.
3. In repository Settings → Pages, select deployment from the `main` branch and `/ (root)` (adjust branch if yours differs).
4. Wait for GitHub Pages to show the deployed website URL.
5. Open the website and verify the storefront loads. Empty catalog is expected until you add products.
6. The manager is available at both the deployed base URL plus `mnrsnadmin.html` and `/mnrsnadmin/`. For a project site, examples are `https://OWNER.github.io/REPO/mnrsnadmin.html` and `https://OWNER.github.io/REPO/mnrsnadmin/`. GitHub Pages may canonicalize the clean route with a trailing slash.

## B. Deploy the publishing Worker

You can deploy from the Cloudflare dashboard or Wrangler. Dashboard labels can change over time.

1. Create a Cloudflare account and open Workers & Pages.
2. Create a Worker named `studynotes-publisher`.
3. Paste the contents of `worker/src/index.js` into the Worker editor and deploy.
4. Open Worker Settings → Variables and Secrets. Add these as **secrets** where indicated:
   - `GITHUB_TOKEN`: fine-grained GitHub token, restricted to only the target repository, with Contents read/write permission. Do not use a classic broad token if a fine-grained token will work.
   - `ADMIN_SECRET`: a long, random secret used only for the manager's Publish request.
5. Add these as ordinary variables:
   - `GITHUB_OWNER`: your GitHub username or organization.
   - `GITHUB_REPO`: repository name.
   - `GITHUB_BRANCH`: branch used by Pages, commonly `main`.
   - `SITE_ORIGIN`: exact storefront origin, with scheme and no trailing slash. Example for a custom domain: `https://example.com.np`. For a GitHub project site, origin is `https://OWNER.github.io` (path is not part of the origin).
6. Deploy again after setting variables/secrets.
7. Test `https://YOUR-WORKER.workers.dev/health` in a browser. It should return a small JSON health message.

Important: browser CORS is origin-based. For a GitHub Pages project site, `SITE_ORIGIN` is `https://OWNER.github.io`, not the full `/REPO` path. Only use the exact real origin of the storefront.

## C. Use the Product Manager

1. Open the manager URL on your Android phone.
2. Go to Settings and enter the real WhatsApp number in international digits-only format (e.g. country code followed by number) and support email.
3. Save settings locally.
4. Go to Add Product.
5. Fill title, description, category and regular price.
6. Optionally enter an offer price and end time.
7. Choose a cover image from the phone. Keep it under 5 MB; smaller optimized images are recommended.
8. Set status to `published` only when the product is ready to appear publicly.
9. Tap Save Draft / Changes.
10. Open Publish to Website, enter the Worker URL and the same `ADMIN_SECRET` configured in Cloudflare.
11. Tap Test connection, then Validate & Publish.
12. Confirm the action. Wait for GitHub Pages deployment and verify the public page.
13. Export backups regularly. Draft data is browser-local.

## D. Manual order workflow

- Customer selects a product and contacts the configured support channel.
- You manually send/confirm NSPAY instructions.
- Verify the payment yourself.
- Send the original PDF from your phone via WhatsApp or email.
- Never upload original PDFs to this repository.

## E. Before production advertising

- Replace all placeholder support contact details.
- Confirm your payment instructions and refund/delivery policies.
- Test with a non-critical sample product.
- Check mobile rendering, image paths, price math, offer expiry, and publishing errors.
- Confirm that a non-admin request to `/publish` is rejected.
- Keep GitHub token and admin secret private.
- Consider stronger identity protection (for example Cloudflare Access) if you need a more secure admin login. A shared secret is a lightweight first control, not full multi-user authentication.
