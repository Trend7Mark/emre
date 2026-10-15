const $ = (id) => document.getElementById(id);
const satirlar = (metin) => metin.split("\n").map((s) => s.trim()).filter(Boolean);

let turler = [];
let aktifHaber = null; // arşivdeki kayıt { id, girdi, haber, durum, ... }

async function api(yol, secenekler = {}) {
  const yanit = await fetch(`/api${yol}`, {
    headers: { "Content-Type": "application/json" },
    ...secenekler,
    body: secenekler.body ? JSON.stringify(secenekler.body) : undefined,
  });
  if (yanit.status === 204) return null;
  const veri = await yanit.json().catch(() => ({}));
  if (!yanit.ok) throw new Error(veri.hata || `İstek başarısız (${yanit.status})`);
  return veri;
}

function bildir(mesaj) {
  const el = $("bildirim");
  el.textContent = mesaj;
  el.hidden = false;
  clearTimeout(bildir.zaman);
  bildir.zaman = setTimeout(() => (el.hidden = true), 2500);
}

async function kopyala(metin) {
  try {
    await navigator.clipboard.writeText(metin);
    bildir("Panoya kopyalandı");
  } catch {
    bildir("Kopyalanamadı; metni elle seçip kopyalayın");
  }
}

// ---------- Sekmeler ----------
function sayfaAc(ad) {
  document.querySelectorAll(".sekme").forEach((b) => b.classList.toggle("aktif", b.dataset.sayfa === ad));
  document.querySelectorAll(".sayfa").forEach((s) => s.classList.toggle("aktif", s.id === `sayfa-${ad}`));
  if (ad === "arsiv") arsiviYukle();
  if (ad === "ornekler") ornekleriYukle();
  if (ad === "ayarlar") ayarlariYukle();
}
document.querySelectorAll(".sekme").forEach((b) => b.addEventListener("click", () => sayfaAc(b.dataset.sayfa)));

document.querySelectorAll(".alt-sekme").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".alt-sekme").forEach((x) => x.classList.toggle("aktif", x === b));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("aktif", p.id === `panel-${b.dataset.panel}`));
  }),
);

// ---------- Başlangıç ----------
async function baslat() {
  const [durum, ayarlar] = await Promise.all([api("/durum"), api("/ayarlar")]);
  turler = durum.turler;
  $("tur").replaceChildren(...turler.map((t) => new Option(t.ad, t.id)));
  $("ton").replaceChildren(...durum.tonlar.map((t) => new Option(t.ad, t.id)));
  turIpucuGoster();

  const rozet = $("saglayici");
  rozet.textContent = durum.saglayici === "demo" ? "Demo modu (yapay zekâ bağlı değil)" : `Yapay zekâ: ${durum.saglayici}`;
  rozet.classList.toggle("demo", durum.saglayici === "demo");
  $("kurumAdi").textContent = ayarlar.kurumAdi;
}

function turIpucuGoster() {
  const t = turler.find((x) => x.id === $("tur").value);
  const kutu = $("turIpucu");
  kutu.replaceChildren(t.yonerge);
  if (t.ornekNot) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ikincil kucuk";
    btn.textContent = "Örnek notu yükle";
    btn.onclick = () => ($("notlar").value = t.ornekNot);
    kutu.append(document.createElement("br"), btn);
  }
}
$("tur").addEventListener("change", turIpucuGoster);

// ---------- Haber üretimi ----------
function ciktiDurumu(durum) {
  $("ciktiBos").hidden = durum !== "bos";
  $("ciktiYukleniyor").hidden = durum !== "yukleniyor";
  $("ciktiIcerik").hidden = durum !== "icerik";
}

$("haberFormu").addEventListener("submit", async (e) => {
  e.preventDefault();
  const hata = $("formHata");
  hata.hidden = true;
  $("uretBtn").disabled = true;
  ciktiDurumu("yukleniyor");
  try {
    const kayit = await api("/uret", {
      method: "POST",
      body: {
        tur: $("tur").value,
        ton: $("ton").value,
        tarih: $("tarih").value,
        yer: $("yer").value,
        notlar: $("notlar").value,
      },
    });
    haberiGoster(kayit);
  } catch (err) {
    hata.textContent = err.message;
    hata.hidden = false;
    ciktiDurumu(aktifHaber ? "icerik" : "bos");
  } finally {
    $("uretBtn").disabled = false;
  }
});

function blokOlustur(blok) {
  const kap = document.createElement("div");
  kap.className = `blok ${blok.tur === "ara_baslik" ? "ara" : ""}`;
  kap.dataset.tur = blok.tur;
  const ta = document.createElement("textarea");
  ta.value = blok.metin;
  ta.rows = blok.tur === "ara_baslik" ? 1 : Math.min(10, Math.max(3, Math.ceil(blok.metin.length / 90)));
  if (blok.tur === "ara_baslik") {
    const et = document.createElement("span");
    et.className = "blok-etiket";
    et.textContent = "Ara başlık";
    kap.append(et);
  }
  kap.append(ta);
  return kap;
}

function haberiGoster(kayit) {
  aktifHaber = kayit;
  const h = kayit.haber;
  $("baslik").value = h.baslik;
  $("alternatifler").replaceChildren(
    ...(h.alternatifBasliklar || []).map((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = a;
      b.title = "Bu başlığı kullan";
      b.onclick = () => {
        const eski = $("baslik").value;
        $("baslik").value = a;
        b.textContent = eski;
      };
      return b;
    }),
  );
  $("spot").value = h.spot;
  $("govde").replaceChildren(...(h.govde || []).map(blokOlustur));
  $("gorselAlti").value = h.gorselAltiYazisi || "";
  $("anahtar").value = (h.anahtarKelimeler || []).join(", ");
  $("sosyalX").value = h.sosyal?.x || "";
  $("sosyalInstagram").value = h.sosyal?.instagram || "";
  $("sosyalFacebook").value = h.sosyal?.facebook || "";
  xSay();

  const liste = h.kontrolListesi || [];
  $("kontrolSayac").textContent = liste.length || "";
  $("kontrolListesi").replaceChildren(
    ...liste.map((k) => {
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.onchange = () => li.classList.toggle("tamam", cb.checked);
      const metin = document.createElement("div");
      const ifade = document.createElement("div");
      ifade.className = "ifade";
      ifade.textContent = k.ifade;
      const neden = document.createElement("div");
      neden.className = "neden";
      neden.textContent = k.neden;
      metin.append(ifade, neden);
      li.append(cb, metin);
      return li;
    }),
  );

  $("durum").value = kayit.durum || "taslak";
  const t = new Date(kayit.guncelleme || kayit.olusturma).toLocaleString("tr-TR");
  $("ciktiMeta").textContent = `${kayit.model || ""} · ${t}`;
  ciktiDurumu("icerik");
}

function formdanHaber() {
  const h = aktifHaber.haber;
  return {
    ...h,
    baslik: $("baslik").value.trim(),
    alternatifBasliklar: [...$("alternatifler").children].map((b) => b.textContent),
    spot: $("spot").value.trim(),
    govde: [...$("govde").children].map((d) => ({ tur: d.dataset.tur, metin: d.querySelector("textarea").value.trim() })),
    gorselAltiYazisi: $("gorselAlti").value.trim(),
    anahtarKelimeler: $("anahtar").value.split(",").map((s) => s.trim()).filter(Boolean),
    sosyal: { x: $("sosyalX").value.trim(), instagram: $("sosyalInstagram").value.trim(), facebook: $("sosyalFacebook").value.trim() },
  };
}

function webMetni() {
  const h = formdanHaber();
  return [h.baslik, h.spot, ...h.govde.map((b) => b.metin)].filter(Boolean).join("\n\n");
}

document.querySelectorAll("[data-kopyala]").forEach((b) =>
  b.addEventListener("click", () => {
    const ne = b.dataset.kopyala;
    if (ne === "web") return kopyala(webMetni());
    const alan = { x: "sosyalX", instagram: "sosyalInstagram", facebook: "sosyalFacebook" }[ne];
    kopyala($(alan).value);
  }),
);

function xSay() {
  const n = [...$("sosyalX").value].length;
  const s = $("xSayac");
  s.textContent = `${n} / 280`;
  s.classList.toggle("asim", n > 280);
}
$("sosyalX").addEventListener("input", xSay);

$("kaydetBtn").addEventListener("click", async () => {
  if (!aktifHaber) return;
  try {
    const kayit = await api(`/haberler/${aktifHaber.id}`, { method: "PUT", body: { haber: formdanHaber(), durum: $("durum").value } });
    aktifHaber = kayit;
    bildir("Kaydedildi");
  } catch (err) {
    bildir(err.message);
  }
});

$("ornekYapBtn").addEventListener("click", async () => {
  if (!aktifHaber) return;
  if (!confirm("Bu haber (kaydedilmiş hâliyle) sonraki haberler için üslup örneği olarak eklensin mi?")) return;
  try {
    await api(`/haberler/${aktifHaber.id}`, { method: "PUT", body: { haber: formdanHaber(), durum: $("durum").value } });
    await api(`/haberler/${aktifHaber.id}/ornek-yap`, { method: "POST" });
    bildir("Üslup örneklerine eklendi");
  } catch (err) {
    bildir(err.message);
  }
});

// ---------- Arşiv ----------
const DURUM_ADI = { taslak: "Taslak", onaylandi: "Onaylandı", yayimlandi: "Yayımlandı" };

async function arsiviYukle() {
  const liste = await api("/haberler");
  $("arsivBos").hidden = liste.length > 0;
  $("arsivListesi").replaceChildren(
    ...liste.map((h) => {
      const tr = document.createElement("tr");
      const td = (icerik) => {
        const c = document.createElement("td");
        c.append(icerik);
        return c;
      };
      const durum = document.createElement("span");
      durum.className = `etiket ${h.durum}`;
      durum.textContent = DURUM_ADI[h.durum] || h.durum;
      const ac = document.createElement("button");
      ac.className = "ikincil kucuk";
      ac.textContent = "Aç";
      ac.onclick = async () => {
        haberiGoster(await api(`/haberler/${h.id}`));
        sayfaAc("yaz");
      };
      const sil = document.createElement("button");
      sil.className = "ikincil kucuk tehlike";
      sil.textContent = "Sil";
      sil.onclick = async () => {
        if (!confirm("Bu haber arşivden silinsin mi?")) return;
        await api(`/haberler/${h.id}`, { method: "DELETE" });
        if (aktifHaber?.id === h.id) {
          aktifHaber = null;
          ciktiDurumu("bos");
        }
        arsiviYukle();
      };
      const islemler = document.createElement("td");
      islemler.append(ac, " ", sil);
      tr.append(
        td(h.baslik || "(başlıksız)"),
        td(turler.find((t) => t.id === h.tur)?.ad || h.tur || ""),
        td(durum),
        td(new Date(h.guncelleme).toLocaleString("tr-TR")),
        islemler,
      );
      return tr;
    }),
  );
}

// ---------- Üslup örnekleri ----------
async function ornekleriYukle() {
  const liste = await api("/ornekler");
  $("ornekListesi").replaceChildren(
    ...liste.map((o, i) => {
      const li = document.createElement("li");
      const ust = document.createElement("div");
      ust.className = "ust-satir";
      const b = document.createElement("strong");
      b.textContent = `${i < 8 ? "" : "(kullanılmıyor) "}${o.baslik}`;
      const sil = document.createElement("button");
      sil.className = "ikincil kucuk tehlike";
      sil.textContent = "Sil";
      sil.onclick = async () => {
        if (!confirm("Bu örnek silinsin mi?")) return;
        await api(`/ornekler/${o.id}`, { method: "DELETE" });
        ornekleriYukle();
      };
      ust.append(b, sil);
      const p = document.createElement("p");
      p.textContent = o.metin;
      li.append(ust, p);
      return li;
    }),
  );
  if (!liste.length) $("ornekListesi").innerHTML = '<li class="bos-satir">Henüz örnek yok.</li>';
}

$("ornekFormu").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/ornekler", {
      method: "POST",
      body: { baslik: $("ornekBaslik").value, metin: $("ornekMetin").value, kaynak: $("ornekKaynak").value },
    });
    e.target.reset();
    bildir("Örnek eklendi");
    ornekleriYukle();
  } catch (err) {
    bildir(err.message);
  }
});

// ---------- Kurum ayarları ----------
async function ayarlariYukle() {
  const a = await api("/ayarlar");
  $("aDuzey").value = a.duzey;
  $("aIl").value = a.il;
  $("aIlce").value = a.ilce || "";
  $("aKurumAdi").value = a.kurumAdi;
  $("aMudur").value = a.mudurAnilis;
  $("aProtokol").value = (a.protokol || []).join("\n");
  $("aKurallar").value = (a.ekKurallar || []).join("\n");
  $("aEtiketler").value = (a.sosyal?.etiketler || []).join("\n");
  $("aHesaplar").value = (a.sosyal?.hesaplar || []).join("\n");
  ilceAlani();
}

function ilceAlani() {
  $("aIlceAlan").hidden = $("aDuzey").value !== "ilce";
}
$("aDuzey").addEventListener("change", ilceAlani);

$("ayarFormu").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const a = await api("/ayarlar", {
      method: "PUT",
      body: {
        duzey: $("aDuzey").value,
        il: $("aIl").value,
        ilce: $("aIlce").value,
        kurumAdi: $("aKurumAdi").value,
        mudurAnilis: $("aMudur").value,
        protokol: satirlar($("aProtokol").value),
        ekKurallar: satirlar($("aKurallar").value),
        sosyal: { etiketler: satirlar($("aEtiketler").value), hesaplar: satirlar($("aHesaplar").value) },
      },
    });
    $("kurumAdi").textContent = a.kurumAdi;
    bildir("Ayarlar kaydedildi");
  } catch (err) {
    bildir(err.message);
  }
});

baslat().catch((err) => bildir(err.message));
