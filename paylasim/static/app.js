"use strict";

const MAX_PHOTOS = 10;
const IG_MIN_RATIO = 4 / 5;
const IG_MAX_RATIO = 1.91;
const PLATFORM_NAMES = { facebook: "Facebook", instagram: "Instagram", x: "X" };

const $ = (sel) => document.querySelector(sel);
let photos = []; // { file, url, w, h }
let status = {};
let lastFolder = null;

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

async function api(path, options = {}) {
  const opts = { ...options, headers: { "X-Paylasim": "1", ...(options.headers || {}) } };
  if (opts.json !== undefined) {
    opts.body = JSON.stringify(opts.json);
    opts.headers["Content-Type"] = "application/json";
    delete opts.json;
  }
  const res = await fetch(path, opts);
  let data = {};
  try { data = await res.json(); } catch { /* boş yanıt */ }
  if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);
  return data;
}

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("error", isError);
  t.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.add("hidden"), isError ? 7000 : 3500);
}

function busy(on, text = "Paylaşılıyor…") {
  $("#busy-text").textContent = text;
  $("#busy").classList.toggle("hidden", !on);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------------------------------------------------------------------------
// Sekmeler
// ---------------------------------------------------------------------------

function showTab(name) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${name}`));
  if (name === "history") loadHistory();
}
document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach((a) =>
  a.addEventListener("click", (e) => { e.preventDefault(); showTab(a.dataset.goto); })
);

// ---------------------------------------------------------------------------
// Durum
// ---------------------------------------------------------------------------

async function loadStatus() {
  status = await api("/api/status");
  const line = $("#account-line");
  if (status.connected) {
    line.textContent = `Facebook: ${status.page_name}` + (status.ig_username ? ` · Instagram: @${status.ig_username}` : " · Instagram bağlı değil");
  } else {
    line.textContent = "Facebook/Instagram bağlı değil";
  }
  $("#connect-warning").classList.toggle("hidden", status.connected);
  $("#settings-connected").classList.toggle("hidden", !status.connected);
  $("#settings-form").classList.toggle("hidden", status.connected);
  $("#set-page").textContent = status.page_name || "-";
  $("#set-ig").textContent = status.ig_username ? "@" + status.ig_username : "Bağlı Instagram İşletme hesabı yok";

  const igBox = document.querySelector('input[value="instagram"]');
  const igOk = status.connected && !!status.ig_username;
  igBox.disabled = !igOk;
  if (!igOk) igBox.checked = false;
  igBox.closest(".platform").classList.toggle("disabled", !igOk);
  const fbBox = document.querySelector('input[value="facebook"]');
  fbBox.disabled = !status.connected;
  if (!status.connected) fbBox.checked = false;
  fbBox.closest(".platform").classList.toggle("disabled", !status.connected);
}

// ---------------------------------------------------------------------------
// Fotoğraflar
// ---------------------------------------------------------------------------

function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith("image/"));
  if (photos.length + files.length > MAX_PHOTOS) {
    toast(`En fazla ${MAX_PHOTOS} fotoğraf eklenebilir.`, true);
  }
  for (const file of files.slice(0, MAX_PHOTOS - photos.length)) {
    const item = { file, url: URL.createObjectURL(file), w: 0, h: 0 };
    photos.push(item);
    const img = new Image();
    img.onload = () => { item.w = img.naturalWidth; item.h = img.naturalHeight; renderThumbs(); };
    img.src = item.url;
  }
  renderThumbs();
}

function igNeedsFit(p) {
  if (!p.w || !p.h) return false;
  const r = p.w / p.h;
  return r < IG_MIN_RATIO - 0.001 || r > IG_MAX_RATIO + 0.001;
}

function renderThumbs() {
  const ul = $("#thumbs");
  ul.innerHTML = "";
  photos.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "thumb";
    li.innerHTML = `
      <span class="num">${i + 1}</span>
      <img src="${p.url}" alt="">
      ${igNeedsFit(p) ? '<span class="badge" title="Instagram bu oranı kabul etmiyor; fotoğraf kırpılmadan kenarlarına beyaz boşluk eklenecek.">IG: kenar boşluğu eklenecek</span>' : ""}
      <div class="tools">
        <button data-act="left" title="Sola taşı" ${i === 0 ? "disabled" : ""}>◀</button>
        <button data-act="remove" title="Kaldır">✕</button>
        <button data-act="right" title="Sağa taşı" ${i === photos.length - 1 ? "disabled" : ""}>▶</button>
      </div>`;
    li.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", (e) => { e.preventDefault(); thumbAction(i, b.dataset.act); })
    );
    ul.appendChild(li);
  });
}

function thumbAction(i, act) {
  if (act === "remove") {
    URL.revokeObjectURL(photos[i].url);
    photos.splice(i, 1);
  } else {
    const j = act === "left" ? i - 1 : i + 1;
    if (j < 0 || j >= photos.length) return;
    [photos[i], photos[j]] = [photos[j], photos[i]];
  }
  renderThumbs();
}

const dz = $("#dropzone");
$("#file-input").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
dz.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
// Sayfanın herhangi bir yerine bırakılan dosya tarayıcıda açılmasın
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

// ---------------------------------------------------------------------------
// Metin ve sayaçlar
// ---------------------------------------------------------------------------

function xText() {
  return $("#x-custom").checked ? $("#x-text").value : $("#text").value;
}

let countTimer;
function scheduleCount() {
  clearTimeout(countTimer);
  countTimer = setTimeout(updateCounts, 150);
}

async function updateCounts() {
  try {
    const c = await api("/api/count", { method: "POST", json: { text: $("#text").value, x_text: xText() } });
    setCounter("#count-ig", `Instagram: ${c.instagram} / 2200`, c.instagram > 2200);
    setCounter("#count-tags", `Hashtag: ${c.hashtags} / 30`, c.hashtags > 30);
    setCounter("#count-x", `X: ${c.x} / 280`, c.x > 280);
  } catch { /* sayaç hatası paylaşımı engellemez */ }
}

function setCounter(sel, text, over) {
  const el = $(sel);
  el.textContent = text;
  el.classList.toggle("over", over);
}

$("#text").addEventListener("input", scheduleCount);
$("#x-text").addEventListener("input", scheduleCount);
$("#x-custom").addEventListener("change", (e) => {
  const box = $("#x-text");
  box.classList.toggle("hidden", !e.target.checked);
  if (e.target.checked && !box.value) box.value = $("#text").value;
  scheduleCount();
});

// ---------------------------------------------------------------------------
// Paylaşım
// ---------------------------------------------------------------------------

function selectedPlatforms() {
  return [...document.querySelectorAll('input[name="platform"]:checked')].map((i) => i.value);
}

$("#publish-btn").addEventListener("click", async () => {
  const platforms = selectedPlatforms();
  if (!platforms.length) return toast("En az bir platform seçin.", true);
  const names = platforms.map((p) => PLATFORM_NAMES[p]).join(", ");
  if (!confirm(`Bu içerik şu hesaplarda yayınlanacak:\n\n${names}\n\nDevam edilsin mi?`)) return;

  const form = new FormData();
  form.append("text", $("#text").value);
  form.append("x_text", xText());
  platforms.forEach((p) => form.append("platforms", p));
  photos.forEach((p) => form.append("photos", p.file, p.file.name));

  busy(true, "Paylaşılıyor… (Instagram birkaç saniye sürebilir)");
  try {
    const data = await api("/api/publish", { method: "POST", body: form });
    showResults(data);
  } catch (err) {
    toast(err.message, true);
  } finally {
    busy(false);
  }
});

function showResults({ results, folder }) {
  lastFolder = folder;
  const ul = $("#result-list");
  ul.innerHTML = "";
  for (const key of ["facebook", "instagram", "x"]) {
    const r = results[key];
    if (!r) continue;
    const li = document.createElement("li");
    if (r.manual) {
      li.innerHTML = `<span class="manual">⏳ ${PLATFORM_NAMES[key]}</span> – paylaşım penceresi açıldı, son adımı aşağıdan tamamlayın.`;
    } else if (r.ok) {
      li.innerHTML = `<span class="ok">✅ ${PLATFORM_NAMES[key]}</span> – yayınlandı` +
        (r.url ? ` · <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">gönderiyi aç</a>` : "");
    } else {
      li.innerHTML = `<span class="err">❌ ${PLATFORM_NAMES[key]}</span> – ${escapeHtml(r.error || "Hata")}`;
    }
    ul.appendChild(li);
  }

  const xr = results.x;
  $("#x-help").classList.toggle("hidden", !xr);
  if (xr) {
    $("#x-reopen").href = xr.url;
    const box = $("#clip-buttons");
    box.innerHTML = "";
    photos.forEach((p, i) => {
      const b = document.createElement("button");
      b.innerHTML = `<img src="${p.url}" alt=""> ${i + 1}. fotoğrafı kopyala`;
      b.addEventListener("click", () => copyImage(p));
      box.appendChild(b);
    });
  }
  $("#results").classList.remove("hidden");
  $("#results").scrollIntoView({ behavior: "smooth" });
}

async function copyImage(p) {
  try {
    const img = new Image();
    img.src = p.url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    toast("Fotoğraf panoya kopyalandı. X penceresinde Ctrl+V yapın.");
  } catch {
    toast("Kopyalanamadı. Fotoğrafı klasörden sürükleyip bırakın.", true);
  }
}

$("#folder-reopen").addEventListener("click", (e) => {
  e.preventDefault();
  if (lastFolder) api("/api/open-folder", { method: "POST", json: { folder: lastFolder } }).catch((err) => toast(err.message, true));
});

$("#new-post").addEventListener("click", () => {
  photos.forEach((p) => URL.revokeObjectURL(p.url));
  photos = [];
  renderThumbs();
  $("#text").value = "";
  $("#x-text").value = "";
  $("#x-custom").checked = false;
  $("#x-text").classList.add("hidden");
  $("#results").classList.add("hidden");
  updateCounts();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ---------------------------------------------------------------------------
// Geçmiş
// ---------------------------------------------------------------------------

async function loadHistory() {
  const ul = $("#history-list");
  try {
    const { items } = await api("/api/history");
    if (!items.length) {
      ul.innerHTML = '<li class="muted">Henüz paylaşım yok.</li>';
      return;
    }
    ul.innerHTML = "";
    for (const it of items) {
      const li = document.createElement("li");
      const date = new Date(it.created_at).toLocaleString("tr-TR");
      const sts = Object.entries(it.results).map(([k, r]) => {
        const icon = r.manual ? "⏳" : r.ok ? "✅" : "❌";
        const label = `${icon} ${PLATFORM_NAMES[k] || k}`;
        if (r.ok && !r.manual && r.url) return `<a class="st" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${label}</a>`;
        return `<span class="st" title="${escapeHtml(r.error || "")}">${label}</span>`;
      }).join("");
      li.innerHTML = `
        <div class="meta">${date} · ${it.photo_count} fotoğraf</div>
        <div class="txt">${escapeHtml(it.text || "(metin yok)")}</div>
        <div>${sts} <a href="#" class="small" data-folder="${escapeHtml(it.folder)}">klasörü aç</a></div>`;
      li.querySelector("[data-folder]").addEventListener("click", (e) => {
        e.preventDefault();
        api("/api/open-folder", { method: "POST", json: { folder: it.folder } }).catch((err) => toast(err.message, true));
      });
      ul.appendChild(li);
    }
  } catch (err) {
    ul.innerHTML = `<li class="err">${escapeHtml(err.message)}</li>`;
  }
}

// ---------------------------------------------------------------------------
// Ayarlar
// ---------------------------------------------------------------------------

$("#connect-btn").addEventListener("click", async () => {
  busy(true, "Bağlanılıyor…");
  try {
    const { pages } = await api("/api/connect", {
      method: "POST",
      json: { app_id: $("#app-id").value, app_secret: $("#app-secret").value, user_token: $("#user-token").value },
    });
    const ul = $("#page-list");
    ul.innerHTML = "";
    pages.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<label><input type="radio" name="page" value="${escapeHtml(p.id)}" ${i === 0 ? "checked" : ""}>
        <span><strong>${escapeHtml(p.name)}</strong> –
        ${p.has_ig ? "Instagram: @" + escapeHtml(p.ig_username || "") : '<span class="muted">bağlı Instagram İşletme hesabı yok</span>'}</span></label>`;
      ul.appendChild(li);
    });
    $("#page-choice").classList.remove("hidden");
  } catch (err) {
    toast(err.message, true);
  } finally {
    busy(false);
  }
});

$("#select-page-btn").addEventListener("click", async () => {
  const sel = document.querySelector('input[name="page"]:checked');
  if (!sel) return;
  try {
    await api("/api/select-page", { method: "POST", json: { page_id: sel.value } });
    $("#app-secret").value = "";
    $("#user-token").value = "";
    $("#page-choice").classList.add("hidden");
    await loadStatus();
    toast("Bağlantı kuruldu.");
    showTab("compose");
  } catch (err) {
    toast(err.message, true);
  }
});

$("#disconnect").addEventListener("click", async () => {
  if (!confirm("Facebook/Instagram bağlantısı kaldırılsın mı?")) return;
  await api("/api/disconnect", { method: "POST" });
  await loadStatus();
  toast("Bağlantı kaldırıldı.");
});

// ---------------------------------------------------------------------------
loadStatus().catch((err) => toast(err.message, true));
updateCounts();
