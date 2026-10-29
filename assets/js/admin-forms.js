/* StudyNotes Product Manager — form engine (fields, collections, pickers, image widget). */
(function () {
"use strict";
const A = window.ADM, SN = window.SN, esc = A.esc;
let bn = 0;
A.colls = {}; A.openItems = new Set();
A.gen = 0;
A.resetBindings = () => { A.bind = {}; A.colls = {}; bn = 0; A.gen++; }; // generation in every id: a late "change" from an old, removed control can never hit a new binding
const reg = (get, set, kind, extra) => { const id = "b" + A.gen + "_" + (++bn); A.bind[id] = Object.assign({ get, set, kind }, extra || {}); return id; };
A.reg = reg;
const objBind = (obj, k) => [() => A.getPath(obj, k), v => A.setPath(obj, k, v)];

const ui = {
  label: (l, h, req) => (l ? `<label>${esc(l)}${req ? ' <span class="req">*</span>' : ""}</label>` : ""),
  help: h => (h ? `<small>${h}</small>` : "")
};

/* single field: spec = {k,l,t,h,o,ph,rows,min,max,step,cls,req,get,set} ; get/set optional (else obj+path) */
A.f = (obj, s) => {
  const [g0, s0] = s.k ? objBind(obj, s.k) : [null, null];
  const get = s.get || g0, set = s.set || s0, t = s.t || "text";
  const id = reg(get, set, t, { after: s.after, rerender: s.rerender });
  const v = get();
  const cls = "field " + (s.cls || "");
  const ph = s.ph ? ` placeholder="${esc(s.ph)}"` : "";
  if (t === "bool") return `<label class="toggle-row ${s.cls || ""}"><span>${esc(s.l)}${s.h ? `<small class="inl">${s.h}</small>` : ""}</span><input type="checkbox" data-b="${id}" ${v ? "checked" : ""}></label>`;
  let ctl = "";
  if (t === "area") ctl = `<textarea data-b="${id}" rows="${s.rows || 3}"${ph}>${esc(v)}</textarea>`;
  else if (t === "lines") ctl = `<textarea data-b="${id}" rows="${s.rows || 4}"${ph}>${esc((Array.isArray(v) ? v : []).join("\n"))}</textarea>`;
  else if (t === "csv") ctl = `<input data-b="${id}" value="${esc((Array.isArray(v) ? v : []).join(", "))}"${ph}>`;
  else if (t === "num") ctl = `<input data-b="${id}" type="number" inputmode="decimal" ${s.min !== undefined ? `min="${s.min}"` : ""} ${s.max !== undefined ? `max="${s.max}"` : ""} step="${s.step || "any"}" value="${v === null || v === undefined ? "" : esc(v)}"${ph}>`;
  else if (t === "dt") ctl = `<input data-b="${id}" type="datetime-local" value="${esc(SN.toInputValue(v))}">`;
  else if (t === "select") ctl = `<select data-b="${id}">${(s.o || []).map(o => `<option value="${esc(o[0])}" ${String(v === null || v === undefined ? "" : v) === String(o[0]) ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`;
  else if (t === "icon") ctl = `<select data-b="${id}">${SN.ICON_LIST.map(o => `<option value="${o[0]}" ${v === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`;
  else if (t === "palette") ctl = `<select data-b="${id}">${Object.keys(SN.PALETTES).map(k => `<option value="${k}" ${v === k ? "selected" : ""}>${k}</option>`).join("")}</select>`;
  else if (t === "action") return A.actionField(s, get, set);
  else if (t === "image") return A.imageField(s, get, set);
  else if (t === "multi") { // checklist of [value,label]
    const cur = Array.isArray(v) ? v : [];
    ctl = `<div class="checks">${(s.o || []).map(o => `<label class="chk"><input type="checkbox" data-b="${id}" value="${esc(o[0])}" ${cur.includes(o[0]) ? "checked" : ""}><span>${esc(o[1])}</span></label>`).join("") || '<span class="muted">कुनै option छैन</span>'}</div>`;
  } else ctl = `<input data-b="${id}" type="${s.type || "text"}" ${s.max ? `maxlength="${s.max}"` : ""} value="${esc(v)}"${ph} ${s.type === "password" ? 'autocomplete="off"' : ""}>`;
  return `<div class="${cls}">${ui.label(s.l, s.h, s.req)}${ctl}${ui.help(s.h)}</div>`;
};
A.fs = (obj, specs) => specs.map(s => A.f(obj, s)).join("");
A.row = html => `<div class="field-row">${html}</div>`;
A.card = (title, body, opt) => { opt = opt || {}; return `<section class="panel-card ${opt.cls || ""}"><div class="panel-title"><div><h2>${title}</h2>${opt.sub ? `<p>${opt.sub}</p>` : ""}</div>${opt.right || ""}</div>${body}</section>`; };
A.note = (html, cls) => `<div class="notice-box ${cls || ""}">${html}</div>`;

/* delegated input handling: text-like controls react to "input", choice controls to "change" */
const CHOICE = ["select", "icon", "palette", "dt", "action-type", "action-val", "bool", "multi"];
A.onInput = (ev) => {
  const el = ev.target; const id = el.dataset && el.dataset.b; if (!id) return;
  const b = A.bind[id]; if (!b) return;
  const k = b.kind;
  const isChoice = CHOICE.includes(k) || el.tagName === "SELECT";
  if (isChoice !== (ev.type === "change")) return;
  if (k === "multi") { const cur = new Set(b.get() || []); if (el.checked) cur.add(el.value); else cur.delete(el.value); b.set(Array.from(cur)); }
  else if (k === "bool") b.set(!!el.checked);
  else {
    let v = el.value;
    if (k === "num") { v = v === "" ? null : Number(v); if (v !== null && !Number.isFinite(v)) v = null; }
    else if (k === "dt") v = SN.fromInputValue(v);
    else if (k === "lines") v = v.split("\n").map(x => x.trim()).filter(Boolean);
    else if (k === "csv") v = v.split(",").map(x => x.trim()).filter(Boolean);
    else if (k === "action-type") { b.set(v); A.save(); A.rerender(); return; }
    b.set(v);
  }
  if (b.after) b.after(el);
  A.save();
  if (b.rerender) A.rerender();
  if (A.livePreview) A.livePreview();
};

/* ---------- action picker ---------- */
const SECTION_TARGETS = [["hero", "Hero (सुरुको भाग)"], ["explore", "Ebook Library"], ["combos", "Custom Combo"], ["bundles", "Bundles / Offers"], ["reviews", "Reviews"], ["how", "Steps (कसरी किन्ने)"], ["chat", "Testimonials"], ["faqs", "FAQ"], ["author", "About / Mission"]];
A.actionField = (s, get, set) => {
  const cur = SN.parseAction(get()), type = cur.type || "none";
  const idT = reg(() => type, v => { set(v === "none" ? "none" : v === "section" ? "section:explore" : v === "product" ? "product:" + ((A.state.products.find(p => p.kind !== "bundle") || {}).id || "") : v === "url" ? "url:https://" : v); }, "action-type");
  let second = "";
  if (type === "section") { const id = reg(() => cur.value, v => set("section:" + v), "action-val"); second = `<select data-b="${id}">${SECTION_TARGETS.map(o => `<option value="${o[0]}" ${cur.value === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`; }
  else if (type === "product") { const id = reg(() => cur.value, v => set("product:" + v), "action-val"); second = `<select data-b="${id}">${A.state.products.filter(p => p.kind !== "site").map(p => `<option value="${esc(p.id)}" ${cur.value === p.id ? "selected" : ""}>${esc(p.id)} — ${esc((p.title || "").slice(0, 50))}</option>`).join("")}</select>`; }
  else if (type === "url") { const id = reg(() => cur.value, v => set("url:" + v.trim()), "text"); second = `<input data-b="${id}" value="${esc(cur.value || "")}" placeholder="https://...">`; }
  const opts = [["none", "कुनै Action छैन"], ["section", "Homepage को भाग मा जाने"], ["product", "Ebook / Bundle खोल्ने"], ["cart", "Cart खोल्ने"], ["whatsapp", "WhatsApp Order"], ["nspay", "NSPAY Payment"], ["url", "बाहिरी Link खोल्ने"]];
  return `<div class="field ${s.cls || ""}">${ui.label(s.l)}<div class="action-pick"><select data-b="${idT}">${opts.map(o => `<option value="${o[0]}" ${type === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>${second}</div>${ui.help(s.h)}</div>`;
};

/* ---------- image widget ---------- */
A.imageField = (s, get, set) => {
  const v = get(), id = reg(get, set, "image", { imgKind: s.kind || "cover", prefix: () => (typeof s.prefix === "function" ? s.prefix() : s.prefix || s.kind || "img") });
  const live = v && !A.blobData[v] && !(A.state.liveAssets || []).includes(v);
  return `<div class="field ${s.cls || ""}">${ui.label(s.l)}<div class="imgbox ${s.kind === "cover" ? "tall" : ""}"><div class="imgprev">${v ? `<img src="${esc(A.imgUrl(v))}" alt="" onerror="this.parentNode.classList.add('broken')">` : `<span>🖼</span>`}</div><div class="imgbtns"><label class="btn btn-ghost file-button">📁 Image छान्नुहोस्<input type="file" accept="image/*" data-imgpick="${id}"></label>${v ? `<button class="btn btn-danger" type="button" data-imgclear="${id}">हटाउनुहोस्</button>` : ""}${v ? `<small>${A.blobData[v] ? ((A.state.liveAssets || []).includes(v) ? "Website मा छ" : "Publish गर्दा Upload हुन्छ") : "Website मा भएको Image"}</small>` : ""}</div></div>${ui.help(s.h)}</div>`;
};
A.onImagePick = async el => {
  const b = A.bind[el.dataset.imgpick]; const f = el.files && el.files[0]; if (!b || !f) return;
  try { A.toast("Image तयार हुँदैछ…"); const p = await A.addImage(f, b.imgKind, b.prefix()); b.set(p); A.saveNow(); A.rerender(); A.toast("✓ Image थपियो"); }
  catch (e) { A.toast("⚠️ " + e.message, 4500); }
};
/* ---------- collections ---------- */
/* c = { id, list(array ref), item(item,i)=>html fields, label(item,i)=>text, make()=>newItem, vis:'visible'|'enabled'|null, max, addText, empty } */
A.coll = c => {
  A.colls[c.id] = c;
  const list = c.list;
  const items = list.map((it, i) => {
    const key = c.id + ":" + (it.id || i);
    const hidden = c.vis && it[c.vis] === false;
    const tb = `<span class="citem-tools">
      ${c.vis ? `<button type="button" class="small-btn" data-coll="${c.id}" data-act="vis" data-i="${i}" title="Public site मा देखाउने/लुकाउने">${hidden ? "👁‍🗨 लुकेको" : "👁 देखिन्छ"}</button>` : ""}
      <button type="button" class="small-btn" data-coll="${c.id}" data-act="up" data-i="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
      <button type="button" class="small-btn" data-coll="${c.id}" data-act="dn" data-i="${i}" ${i === list.length - 1 ? "disabled" : ""}>↓</button>
      <button type="button" class="small-btn" data-coll="${c.id}" data-act="dup" data-i="${i}">Copy</button>
      <button type="button" class="small-btn danger" data-coll="${c.id}" data-act="del" data-i="${i}">हटाउनुहोस्</button></span>`;
    return `<details class="citem ${hidden ? "is-hidden" : ""}" data-key="${esc(key)}" ${A.openItems.has(key) ? "open" : ""}><summary><span class="cn">${i + 1}</span><span class="ct">${esc(c.label(it, i) || "(खाली)")}</span>${hidden ? '<span class="status-pill status-hidden">लुकेको</span>' : ""}</summary><div class="citem-body">${tb}${c.item(it, i)}</div></details>`;
  }).join("");
  const addable = !c.max || list.length < c.max;
  return `<div class="coll" data-cid="${c.id}">${items || `<p class="muted">${c.empty || "अहिले केही छैन।"}</p>`}${addable ? `<button type="button" class="btn btn-ghost" data-coll="${c.id}" data-act="add">＋ ${esc(c.addText || "नयाँ थप्नुहोस्")}</button>` : ""}</div>`;
};
A.onCollClick = (btn) => {
  const c = A.colls[btn.dataset.coll]; if (!c) return;
  const i = +btn.dataset.i, list = c.list, act = btn.dataset.act;
  if (act === "add") { const n = c.make(); if (n.id === undefined && c.useId !== false) n.id = SN.uid(c.id.slice(0, 3)); list.push(n); A.openItems.add(c.id + ":" + (n.id || list.length - 1)); }
  else if (act === "del") { if (!confirm("यो हटाउने? (यो काम फर्काउन मिल्दैन)")) return; if (c.onDelete && c.onDelete(list[i]) === false) return; list.splice(i, 1); }
  else if (act === "up" && i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; }
  else if (act === "dn" && i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; }
  else if (act === "dup") { const n = SN.clone(list[i]); n.id = SN.uid(c.id.slice(0, 3)); list.splice(i + 1, 0, n); }
  else if (act === "vis") { const k = c.vis; list[i][k] = list[i][k] === false ? true : false; }
  if (c.after) c.after();
  A.save(); A.rerender();
};
document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("citem")) { if (d.open) A.openItems.add(d.dataset.key); else A.openItems.delete(d.dataset.key); } }, true);

/* generic small tools */
A.statusPill = s => `<span class="status-pill status-${esc(s)}">${esc({ published: "Published", draft: "Draft", hidden: "Hidden", archived: "Archived" }[s] || s)}</span>`;
A.categoryOptions = (extra) => A.site().categories.map(c => [c.name, c.name]).concat(extra || []);
})();
