
const json = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });

function corsHeaders(origin, env) {
  const allowed = (env.SITE_ORIGIN || "").replace(/\/+$/, "");
  const incoming = (origin || "").replace(/\/+$/, "");

  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin"
  };

  if (allowed && incoming === allowed) {
    headers["Access-Control-Allow-Origin"] = incoming;
  }

  return headers;
}

function safePath(path) {
  return typeof path === "string" &&
    /^(data\/products\.json|data\/store-settings\.json|assets\/covers\/[a-zA-Z0-9_-]+\.(jpg|png|webp))$/.test(path);
}

function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";

  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + 0x8000)
    );
  }

  return btoa(binary);
}

function validateCatalog(catalog) {
  if (
    !catalog ||
    catalog.schemaVersion !== 1 ||
    !Array.isArray(catalog.products)
  ) return "Catalog schema invalid.";

  if (catalog.products.length > 500) {
    return "Too many products.";
  }

  const ids = new Set();

  for (const p of catalog.products) {
    if (!p || typeof p.id !== "string" || !p.id || ids.has(p.id)) {
      return "Missing or duplicate product ID.";
    }

    ids.add(p.id);

    if (
      typeof p.title !== "string" ||
      !p.title.trim() ||
      typeof p.category !== "string"
    ) return `Required fields missing for ${p.id}.`;

    if (
      !Number.isFinite(Number(p.regularPrice)) ||
      Number(p.regularPrice) < 0
    ) return `Invalid price for ${p.id}.`;

    if (
      p.offerPrice != null &&
      (
        !Number.isFinite(Number(p.offerPrice)) ||
        Number(p.offerPrice) < 0 ||
        Number(p.offerPrice) > Number(p.regularPrice)
      )
    ) return `Invalid offer price for ${p.id}.`;

    if (p.cover && !/^assets\/covers\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(p.cover)) {
      return `Invalid cover path for ${p.id}.`;
    }
  }

  return null;
}

function timingSafeEqual(a, b) {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);

  for (let i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^
      (b.charCodeAt(i) || 0);
  }

  return diff === 0;
}

async function githubRequest(url, env, method = "GET", body = null) {
  const headers = {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "StudyNotes-Publisher",
    "Content-Type": "application/json"
  };

  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `GitHub API failed (${response.status}): ${result.message || "Unknown error"}`
    );
  }

  return result;
}

async function publishGitCommit(env, files) {
  const base = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;

  const branch = env.GITHUB_BRANCH
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  // 1. Get current branch commit
  const ref = await githubRequest(
    `${base}/git/ref/heads/${branch}`,
    env
  );

  const parentSha = ref.object.sha;

  if (!parentSha) {
    throw new Error("Could not find current branch commit.");
  }

  // 2. Get current tree
  const parent = await githubRequest(
    `${base}/git/commits/${parentSha}`,
    env
  );

  const baseTree = parent.tree?.sha;

  if (!baseTree) {
    throw new Error("Could not find base Git tree.");
  }

  // 3. Create blobs for all files
  const treeEntries = [];

  for (const file of files) {
    const blob = await githubRequest(
      `${base}/git/blobs`,
      env,
      "POST",
      {
        content: file.contentBase64,
        encoding: "base64"
      }
    );

    treeEntries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha
    });
  }

  // 4. Create one tree containing all changes
  const tree = await githubRequest(
    `${base}/git/trees`,
    env,
    "POST",
    {
      base_tree: baseTree,
      tree: treeEntries
    }
  );

  // 5. Create one commit
  const commit = await githubRequest(
    `${base}/git/commits`,
    env,
    "POST",
    {
      message: "StudyNotes: publish catalog, settings and cover assets",
      tree: tree.sha,
      parents: [parentSha]
    }
  );

  // 6. Update branch only after everything succeeds
  await githubRequest(
    `${base}/git/refs/heads/${branch}`,
    env,
    "PATCH",
    {
      sha: commit.sha,
      force: false
    }
  );

  return commit.sha;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      if (!cors["Access-Control-Allow-Origin"]) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        ok: true,
        message: "StudyNotes publishing service is reachable."
      }, 200, cors);
    }

    if (url.pathname !== "/publish" || request.method !== "POST") {
      return json({ error: "Not found." }, 404, cors);
    }

    if (!cors["Access-Control-Allow-Origin"]) {
      return json({ error: "Origin not allowed." }, 403, cors);
    }

    if (
      !env.ADMIN_SECRET ||
      !env.GITHUB_TOKEN ||
      !env.GITHUB_OWNER ||
      !env.GITHUB_REPO ||
      !env.GITHUB_BRANCH
    ) {
      return json({
        error: "Publishing service is not fully configured."
      }, 500, cors);
    }

    const auth = request.headers.get("Authorization") || "";
    const supplied = auth.startsWith("Bearer ")
      ? auth.slice(7)
      : "";

    if (
      supplied.length !== env.ADMIN_SECRET.length ||
      !timingSafeEqual(supplied, env.ADMIN_SECRET)
    ) {
      return json({
        error: "Unauthorized. Check the admin publishing secret."
      }, 401, cors);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400, cors);
    }

    const error = validateCatalog(body.catalog);

    if (error) {
      return json({ error }, 400, cors);
    }

    const assets = Array.isArray(body.assets)
      ? body.assets
      : [];

    // Keep enough subrequest headroom on Workers Free.
    if (assets.length > 40) {
      return json({
        error: "Maximum 40 cover assets per publish. Publish fewer covers at once."
      }, 400, cors);
    }

    let totalBytes = 0;
    const paths = new Set();

    for (const a of assets) {
      if (
        !a ||
        !safePath(a.path) ||
        !a.path.startsWith("assets/covers/") ||
        typeof a.contentBase64 !== "string" ||
        !a.contentBase64.length
      ) {
        return json({ error: "Invalid cover asset." }, 400, cors);
      }

      if (paths.has(a.path)) {
        return json({
          error: `Duplicate cover path: ${a.path}`
        }, 400, cors);
      }

      paths.add(a.path);

      totalBytes += a.contentBase64.length;

      if (a.contentBase64.length > 7_000_000) {
        return json({
          error: "A cover image is too large."
        }, 413, cors);
      }
    }

    if (totalBytes > 18_000_000) {
      return json({
        error: "Total image payload is too large. Publish fewer/smaller covers at once."
      }, 413, cors);
    }

    try {
      const catalogText = JSON.stringify({
        schemaVersion: 1,
        updatedAt: body.catalog.updatedAt || new Date().toISOString(),
        products: body.catalog.products
      }, null, 2);

      const settings = body.settings &&
        typeof body.settings === "object" &&
        !Array.isArray(body.settings)
        ? {
            storeName: "StudyNotes",
            currency: "NPR",
            whatsappNumber: String(
              body.settings.whatsappNumber || ""
            ).replace(/\D/g, "").slice(0, 16),
            supportEmail: String(
              body.settings.supportEmail || ""
            ).slice(0, 254),
            paymentInstructions: String(
              body.settings.paymentInstructions || ""
            ).slice(0, 2000)
          }
        : {
            storeName: "StudyNotes",
            currency: "NPR",
            whatsappNumber: "",
            supportEmail: "",
            paymentInstructions: ""
          };

      const files = [
        ...assets,
        {
          path: "data/products.json",
          contentBase64: b64utf8(catalogText)
        },
        {
          path: "data/store-settings.json",
          contentBase64: b64utf8(
            JSON.stringify(settings, null, 2)
          )
        }
      ];

      const commitSha = await publishGitCommit(env, files);

      return json({
        ok: true,
        commit: commitSha,
        publishedProducts: body.catalog.products.length,
        uploadedAssets: assets.length,
        publishedFiles: files.length,
        message: "StudyNotes successfully published to GitHub. GitHub Pages deployment may take a few minutes."
      }, 200, cors);

    } catch (e) {
      return json({
        error: e.message || "Publishing failed."
      }, 502, cors);
    }
  }
};
