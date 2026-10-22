(() => {
"use strict";
const CATALOG_URL = "data/products.json";
const SETTINGS_URL = "data/store-settings.json";
const $ = (s, root=document) => root.querySelector(s);
let allProducts = [], activeCategory = "all", settings = {};
const money = n => "NPR " + Number(n || 0).toLocaleString("en-IN");
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function live(p){return p && p.status === "published" && p.availability !== "unavailable" && p.availability !== "sold_out"}
function offerIsActive(p){if(!(p.regularPrice>0 && p.offerPrice!=null && p.offerPrice>=0 && p.offerPrice<p.regularPrice))return false;if(!p.offerEndsAt)return true;const end=new Date(p.offerEndsAt).getTime();return Number.isFinite(end)&&Date.now()<end}
function discount(p){return offerIsActive(p)?Math.round((p.regularPrice-p.offerPrice)/p.regularPrice*100):0}
function priceHtml(p){const d=discount(p), current=d?p.offerPrice:p.regularPrice;return `<div class="price-row"><span class="price-now">${money(current)}</span>${d?`<span class="price-old">${money(p.regularPrice)}</span><span class="discount-pill">${d}% OFF</span>`:""}</div>${d&&p.offerEndsAt?`<div class="offer-countdown" data-countdown="${safe(p.offerEndsAt)}">Offer ends soon</div>`:""}`}
function updateCountdowns(){document.querySelectorAll("[data-countdown]").forEach(el=>{const end=new Date(el.dataset.countdown).getTime(),left=end-Date.now();if(!Number.isFinite(end)||left<=0){el.textContent="Offer ended";return}const days=Math.floor(left/86400000),hours=Math.floor((left%86400000)/3600000),mins=Math.floor((left%3600000)/60000);el.textContent=`Offer ends in ${days?days+"d ":""}${hours}h ${mins}m`})}
function coverHtml(p){return p.cover?`<img src="${safe(p.cover)}" alt="${safe(p.coverAlt||p.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><div class="cover-fallback" hidden>📘</div>`:`<div class="cover-fallback">📘</div>`}
function renderCategories(products){
 const names=[...new Set(products.map(p=>p.category).filter(Boolean))];
 $("#categoryFilters").innerHTML=`<button class="filter-chip ${activeCategory==="all"?"active":""}" data-category="all">सबै</button>`+names.map(c=>`<button class="filter-chip ${activeCategory===c?"active":""}" data-category="${safe(c)}">${safe(c)}</button>`).join("");
 $("#categoryFilters").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.category;renderCategories(allProducts.filter(live));renderProducts()}));
}
function renderProducts(){
 const query=($("#searchInput").value||"").trim().toLocaleLowerCase();
 const list=allProducts.filter(live).filter(p=>(activeCategory==="all"||p.category===activeCategory)&&[p.title,p.subtitle,p.description,p.category,...(p.tags||[])].join(" ").toLocaleLowerCase().includes(query));
 $("#productGrid").innerHTML=list.map(p=>`<article class="product-card"><div class="cover-wrap">${coverHtml(p)}${p.badge?`<span class="product-badge">${safe(p.badge)}</span>`:p.featured?`<span class="product-badge">FEATURED</span>`:""}</div><div class="product-info"><span class="product-category">${safe(p.category)}</span><h3>${safe(p.title)}</h3><p>${safe(p.subtitle||p.description||"उपयोगी digital learning resource.")}</p>${priceHtml(p)}<div class="card-actions"><button class="btn btn-primary" data-buy="${safe(p.id)}">किन्ने तरिका</button><button class="btn card-details" data-details="${safe(p.id)}">Details</button></div></div></article>`).join("");
 $("#emptyState").hidden=!!list.length;
 if(!list.length) $("#productGrid").innerHTML="";
 $("#productGrid").querySelectorAll("[data-details]").forEach(b=>b.addEventListener("click",()=>openProduct(b.dataset.details,false)));
 $("#productGrid").querySelectorAll("[data-buy]").forEach(b=>b.addEventListener("click",()=>openProduct(b.dataset.buy,true)));
 updateCountdowns();
}
function openProduct(id,buy){
 const p=allProducts.find(x=>x.id===id);if(!p)return;
 const d=discount(p), current=d?p.offerPrice:p.regularPrice;
 const whats=settings.whatsappNumber||"", email=settings.supportEmail||"";
 const msg=encodeURIComponent(`नमस्कार, मलाई "${p.title}" ebook किन्नु छ। Price: ${money(current)}. कृपया NSPAY payment instructions पठाइदिनुहोस्।`);
 const contact=whats?`https://wa.me/${whats}?text=${msg}`:email?`mailto:${email}?subject=${encodeURIComponent("StudyNotes order: "+p.title)}&body=${msg}`:"#support";
 $("#modalContent").innerHTML=`${p.cover?`<img class="modal-cover" src="${safe(p.cover)}" alt="${safe(p.title)}">`:""}<span class="eyebrow">${safe(p.category)}</span><h2 id="modalTitle">${safe(p.title)}</h2><p>${safe(p.description||p.subtitle||"")}</p>${priceHtml(p)}${p.benefits?.length?`<h3>यस ebook बाट के सिक्नुहुन्छ?</h3><ul>${p.benefits.map(x=>`<li>${safe(x)}</li>`).join("")}</ul>`:""}${p.pages?`<p><b>Pages:</b> ${safe(p.pages)} · <b>Format:</b> ${safe(p.format||"PDF")}</p>`:""}<div class="modal-note">Payment manually verify भएपछि original PDF WhatsApp वा email बाट पठाइनेछ। Payment गर्नु अघि official instructions र final amount confirm गर्नुहोस्।</div><p><a class="btn btn-primary" style="width:100%;margin-top:12px" href="${contact}" ${whats||email?'target="_blank" rel="noopener"':""}>${buy?"Order गर्न सम्पर्क गर्नुहोस्":"यो ebook किन्नुहोस्"} ↗</a></p>`;
 $("#productModal").hidden=false;document.body.style.overflow="hidden";
}
function closeModal(){ $("#productModal").hidden=true;document.body.style.overflow=""}
async function load(){
 $("#year").textContent=new Date().getFullYear();
 try{const [cr,sr]=await Promise.all([fetch(CATALOG_URL,{cache:"no-store"}),fetch(SETTINGS_URL,{cache:"no-store"})]);if(!cr.ok)throw new Error("Catalog unavailable");const catalog=await cr.json();settings=sr.ok?await sr.json():{};allProducts=Array.isArray(catalog.products)?catalog.products:[];renderCategories(allProducts.filter(live));renderProducts();
 if(settings.whatsappNumber){$("#supportWhatsapp").href=`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent("नमस्कार, StudyNotes सम्बन्धी जानकारी चाहियो।")}`;$("#supportWhatsapp").target="_blank";$("#supportWhatsapp").rel="noopener"}else{$("#supportWhatsapp").href="#ebooks";$("#supportWhatsapp").addEventListener("click",e=>{e.preventDefault();toast("Support WhatsApp number अझै सेट गरिएको छैन।")})}
 if(settings.supportEmail){$("#supportEmail").href=`mailto:${settings.supportEmail}`}else{$("#supportEmail").href="#ebooks";$("#supportEmail").addEventListener("click",e=>{e.preventDefault();toast("Support email अझै सेट गरिएको छैन।")})}
 }catch(e){$("#productGrid").innerHTML='<div class="loading-state">Product catalog लोड हुन सकेन। कृपया पछि फेरि प्रयास गर्नुहोस्।</div>';console.error("StudyNotes catalog load failed:",e)}
}
$("#searchInput").addEventListener("input",renderProducts);
document.addEventListener("click",e=>{if(e.target.matches("[data-close-modal]"))closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
load();
setInterval(()=>{updateCountdowns();renderProducts()},60000);
})();