import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import express from "express";
import * as store from "./store.js";
import { HABER_TURLERI, HABER_TONLARI } from "./templates.js";
import { sistemTalimati, kullaniciMesaji } from "./prompt.js";
import { haberDuzMetin } from "./format.js";

const SAGLAYICILAR = {
  claude: () => import("./providers/claude.js"),
  gemini: () => import("./providers/gemini.js"),
  demo: () => import("./providers/demo.js"),
};

const saglayiciAdi = () => {
  const ad = (process.env.AI_PROVIDER || "").toLowerCase();
  if (SAGLAYICILAR[ad]) return ad;
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "demo";
};

const app = express();
const kok = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(kok, "..", "public")));

const temizMetin = (v, max = 20000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const metinListesi = (v) => (Array.isArray(v) ? v.map((s) => temizMetin(s, 500)).filter(Boolean) : []);

app.get("/api/durum", (req, res) => {
  res.json({ saglayici: saglayiciAdi(), turler: HABER_TURLERI, tonlar: HABER_TONLARI });
});

// ---- Kurum ayarları ----
app.get("/api/ayarlar", (req, res) => res.json(store.ayarlariGetir()));

app.put("/api/ayarlar", (req, res) => {
  const b = req.body || {};
  const kayit = store.ayarlariKaydet({
    duzey: b.duzey === "ilce" ? "ilce" : "il",
    il: temizMetin(b.il, 100),
    ilce: temizMetin(b.ilce, 100),
    kurumAdi: temizMetin(b.kurumAdi, 200),
    mudurAnilis: temizMetin(b.mudurAnilis, 200),
    protokol: metinListesi(b.protokol),
    ekKurallar: metinListesi(b.ekKurallar),
    sosyal: { etiketler: metinListesi(b.sosyal?.etiketler), hesaplar: metinListesi(b.sosyal?.hesaplar) },
  });
  res.json(kayit);
});

// ---- Üslup örnekleri ----
app.get("/api/ornekler", (req, res) => res.json(store.ornekleriGetir()));

app.post("/api/ornekler", (req, res) => {
  const baslik = temizMetin(req.body?.baslik, 500);
  const metin = temizMetin(req.body?.metin);
  if (!baslik || !metin) return res.status(400).json({ hata: "Başlık ve metin zorunludur." });
  res.status(201).json(store.ornekEkle({ baslik, metin, kaynak: temizMetin(req.body?.kaynak, 1000) }));
});

app.delete("/api/ornekler/:id", (req, res) => {
  if (!store.ornekSil(req.params.id)) return res.status(404).json({ hata: "Örnek bulunamadı." });
  res.status(204).end();
});

// ---- Haber üretimi ----
app.post("/api/uret", async (req, res) => {
  const girdi = {
    tur: temizMetin(req.body?.tur, 50),
    ton: temizMetin(req.body?.ton, 50),
    tarih: temizMetin(req.body?.tarih, 50),
    yer: temizMetin(req.body?.yer, 300),
    notlar: temizMetin(req.body?.notlar),
  };
  if (girdi.notlar.length < 20) {
    return res.status(400).json({ hata: "Lütfen haberle ilgili en az birkaç cümlelik not yazın." });
  }

  const ad = saglayiciAdi();
  try {
    const saglayici = await SAGLAYICILAR[ad]();
    const sonuc = await saglayici.uret({
      sistem: sistemTalimati(store.ayarlariGetir(), store.ornekleriGetir()),
      kullanici: kullaniciMesaji(girdi),
      girdi,
    });
    const kayit = store.haberKaydet({
      girdi,
      haber: sonuc.haber,
      saglayici: ad,
      model: sonuc.model,
      kullanim: sonuc.kullanim,
      durum: "taslak",
    });
    res.json(kayit);
  } catch (err) {
    console.error("[uret]", err);
    res.status(502).json({ hata: err.message || "Haber üretilemedi." });
  }
});

// ---- Arşiv ----
app.get("/api/haberler", (req, res) => {
  res.json(
    store.arsiviGetir().map((h) => ({
      id: h.id,
      baslik: h.haber?.baslik,
      tur: h.girdi?.tur,
      durum: h.durum,
      olusturma: h.olusturma,
      guncelleme: h.guncelleme,
    })),
  );
});

app.get("/api/haberler/:id", (req, res) => {
  const h = store.haberGetir(req.params.id);
  if (!h) return res.status(404).json({ hata: "Haber bulunamadı." });
  res.json(h);
});

app.put("/api/haberler/:id", (req, res) => {
  const mevcut = store.haberGetir(req.params.id);
  if (!mevcut) return res.status(404).json({ hata: "Haber bulunamadı." });
  const guncel = { id: mevcut.id };
  if (req.body?.haber && typeof req.body.haber === "object") guncel.haber = req.body.haber;
  if (["taslak", "onaylandi", "yayimlandi"].includes(req.body?.durum)) guncel.durum = req.body.durum;
  res.json(store.haberKaydet(guncel));
});

app.delete("/api/haberler/:id", (req, res) => {
  if (!store.haberSil(req.params.id)) return res.status(404).json({ hata: "Haber bulunamadı." });
  res.status(204).end();
});

// Yayımlanan bir haberi üslup örneği olarak ekler; model sonraki haberlerde bu üslubu izler.
app.post("/api/haberler/:id/ornek-yap", (req, res) => {
  const h = store.haberGetir(req.params.id);
  if (!h) return res.status(404).json({ hata: "Haber bulunamadı." });
  const { baslik, metin } = haberDuzMetin(h.haber, { baslikDahil: false });
  res.status(201).json(store.ornekEkle({ baslik, metin, kaynak: `arsiv:${h.id}` }));
});

const PORT = Number(process.env.PORT) || 3000;
const ADRES = `http://127.0.0.1:${PORT}`;
// Yalnızca bu bilgisayardan erişilebilir (yerel kullanım).
const sunucu = app.listen(PORT, "127.0.0.1", () => {
  console.log(`\nBasın Masası çalışıyor: ${ADRES}  (yapay zekâ: ${saglayiciAdi()})`);
  console.log("Kapatmak için bu pencereyi kapatın.\n");
  if (process.platform === "win32" && process.env.TARAYICI_AC !== "0") exec(`start "" ${ADRES}`);
});
sunucu.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nHATA: ${PORT} numaralı port kullanımda. Uygulama zaten açık olabilir; ${ADRES} adresini deneyin`);
    console.error("ya da .env dosyasında PORT=3001 gibi başka bir değer verin.\n");
  } else {
    console.error("\nSunucu başlatılamadı:", err.message);
  }
  process.exit(1);
});
