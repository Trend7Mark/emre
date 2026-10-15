// Uygulamanın tüm işlevleri: HTTP sunucusundan (web sürümü) ve masaüstü
// programından (Electron) aynı şekilde çağrılır. Böylece iki sürüm tek kod tabanını paylaşır.
import * as store from "./store.js";
import { HABER_TURLERI, HABER_TONLARI } from "./templates.js";
import { sistemTalimati, kullaniciMesaji } from "./prompt.js";
import { haberDuzMetin } from "./format.js";

const SAGLAYICILAR = {
  claude: () => import("./providers/claude.js"),
  gemini: () => import("./providers/gemini.js"),
  demo: () => import("./providers/demo.js"),
};

export const VARSAYILAN_MODELLER = {
  claude: "claude-opus-5-5",
  gemini: "gemini-2.5-pro",
};

const temizMetin = (v, max = 20000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const metinListesi = (v) => (Array.isArray(v) ? v.map((s) => temizMetin(s, 500)).filter(Boolean) : []);

class ApiHatasi extends Error {
  constructor(durum, mesaj) {
    super(mesaj);
    this.durum = durum;
  }
}

/**
 * @param {object} anahtarlar  API anahtarlarının saklandığı yer.
 *   getir(saglayici) -> string | ""   kaydet(saglayici, anahtar) -> void
 */
export function apiOlustur(anahtarlar) {
  // Kullanılacak sağlayıcı: ayarlarda seçilen; anahtarı yoksa demo.
  function aktifSaglayici() {
    const yz = store.yzAyarlariGetir();
    if (yz.saglayici === "demo") return { ad: "demo" };
    const anahtar = anahtarlar.getir(yz.saglayici);
    if (!anahtar) return { ad: "demo", eksik: yz.saglayici };
    return { ad: yz.saglayici, anahtar, model: yz.modeller?.[yz.saglayici] || VARSAYILAN_MODELLER[yz.saglayici] };
  }

  function yzDurumu() {
    const yz = store.yzAyarlariGetir();
    const aktif = aktifSaglayici();
    return {
      secili: yz.saglayici,
      aktif: aktif.ad,
      eksikAnahtar: aktif.eksik || null,
      anahtarVar: { claude: Boolean(anahtarlar.getir("claude")), gemini: Boolean(anahtarlar.getir("gemini")) },
      modeller: { ...VARSAYILAN_MODELLER, ...yz.modeller },
    };
  }

  const rotalar = [
    ["GET", /^\/api\/durum$/, () => ({ yz: yzDurumu(), turler: HABER_TURLERI, tonlar: HABER_TONLARI })],

    // ---- Yapay zekâ ayarları ----
    ["GET", /^\/api\/yz$/, () => yzDurumu()],
    [
      "PUT",
      /^\/api\/yz$/,
      (_, b) => {
        const saglayici = ["claude", "gemini", "demo"].includes(b.saglayici) ? b.saglayici : "claude";
        for (const ad of ["claude", "gemini"]) {
          const yeni = temizMetin(b.anahtarlar?.[ad], 500);
          if (yeni) anahtarlar.kaydet(ad, yeni);
          if (b.anahtarSil?.[ad]) anahtarlar.kaydet(ad, "");
        }
        const modeller = {};
        for (const ad of ["claude", "gemini"]) {
          const m = temizMetin(b.modeller?.[ad], 100);
          if (m && m !== VARSAYILAN_MODELLER[ad]) modeller[ad] = m;
        }
        store.yzAyarlariKaydet({ saglayici, modeller });
        return yzDurumu();
      },
    ],

    // ---- Kurum ayarları ----
    ["GET", /^\/api\/ayarlar$/, () => store.ayarlariGetir()],
    [
      "PUT",
      /^\/api\/ayarlar$/,
      (_, b) =>
        store.ayarlariKaydet({
          duzey: b.duzey === "ilce" ? "ilce" : "il",
          il: temizMetin(b.il, 100),
          ilce: temizMetin(b.ilce, 100),
          kurumAdi: temizMetin(b.kurumAdi, 200),
          mudurAnilis: temizMetin(b.mudurAnilis, 200),
          protokol: metinListesi(b.protokol),
          ekKurallar: metinListesi(b.ekKurallar),
          sosyal: { etiketler: metinListesi(b.sosyal?.etiketler), hesaplar: metinListesi(b.sosyal?.hesaplar) },
        }),
    ],

    // ---- Üslup örnekleri ----
    ["GET", /^\/api\/ornekler$/, () => store.ornekleriGetir()],
    [
      "POST",
      /^\/api\/ornekler$/,
      (_, b) => {
        const baslik = temizMetin(b.baslik, 500);
        const metin = temizMetin(b.metin);
        if (!baslik || !metin) throw new ApiHatasi(400, "Başlık ve metin zorunludur.");
        return store.ornekEkle({ baslik, metin, kaynak: temizMetin(b.kaynak, 1000) });
      },
    ],
    [
      "DELETE",
      /^\/api\/ornekler\/([\w-]+)$/,
      ([id]) => {
        if (!store.ornekSil(id)) throw new ApiHatasi(404, "Örnek bulunamadı.");
        return null;
      },
    ],

    // ---- Haber üretimi ----
    [
      "POST",
      /^\/api\/uret$/,
      async (_, b) => {
        const girdi = {
          tur: temizMetin(b.tur, 50),
          ton: temizMetin(b.ton, 50),
          tarih: temizMetin(b.tarih, 50),
          yer: temizMetin(b.yer, 300),
          notlar: temizMetin(b.notlar),
        };
        if (girdi.notlar.length < 20) throw new ApiHatasi(400, "Lütfen haberle ilgili en az birkaç cümlelik not yazın.");

        const aktif = aktifSaglayici();
        let sonuc;
        try {
          const saglayici = await SAGLAYICILAR[aktif.ad]();
          sonuc = await saglayici.uret({
            sistem: sistemTalimati(store.ayarlariGetir(), store.ornekleriGetir()),
            kullanici: kullaniciMesaji(girdi),
            girdi,
            anahtar: aktif.anahtar,
            model: aktif.model,
          });
        } catch (err) {
          console.error("[uret]", err);
          throw new ApiHatasi(502, err.message || "Haber üretilemedi.");
        }
        return store.haberKaydet({
          girdi,
          haber: sonuc.haber,
          saglayici: aktif.ad,
          model: sonuc.model,
          kullanim: sonuc.kullanim,
          durum: "taslak",
        });
      },
    ],

    // ---- Arşiv ----
    [
      "GET",
      /^\/api\/haberler$/,
      () =>
        store.arsiviGetir().map((h) => ({
          id: h.id,
          baslik: h.haber?.baslik,
          tur: h.girdi?.tur,
          durum: h.durum,
          olusturma: h.olusturma,
          guncelleme: h.guncelleme,
        })),
    ],
    [
      "GET",
      /^\/api\/haberler\/([\w-]+)$/,
      ([id]) => store.haberGetir(id) ?? (() => { throw new ApiHatasi(404, "Haber bulunamadı."); })(),
    ],
    [
      "PUT",
      /^\/api\/haberler\/([\w-]+)$/,
      ([id], b) => {
        if (!store.haberGetir(id)) throw new ApiHatasi(404, "Haber bulunamadı.");
        const guncel = { id };
        if (b.haber && typeof b.haber === "object") guncel.haber = b.haber;
        if (["taslak", "onaylandi", "yayimlandi"].includes(b.durum)) guncel.durum = b.durum;
        return store.haberKaydet(guncel);
      },
    ],
    [
      "DELETE",
      /^\/api\/haberler\/([\w-]+)$/,
      ([id]) => {
        if (!store.haberSil(id)) throw new ApiHatasi(404, "Haber bulunamadı.");
        return null;
      },
    ],
    // Yayımlanan bir haberi üslup örneği olarak ekler; model sonraki haberlerde bu üslubu izler.
    [
      "POST",
      /^\/api\/haberler\/([\w-]+)\/ornek-yap$/,
      ([id]) => {
        const h = store.haberGetir(id);
        if (!h) throw new ApiHatasi(404, "Haber bulunamadı.");
        const { baslik, metin } = haberDuzMetin(h.haber, { baslikDahil: false });
        return store.ornekEkle({ baslik, metin, kaynak: `arsiv:${h.id}` });
      },
    ],
  ];

  /** İsteği işler; { durum, govde } döndürür. */
  async function isle(yontem, yol, govde) {
    for (const [y, desen, isleyici] of rotalar) {
      if (y !== yontem) continue;
      const eslesme = desen.exec(yol);
      if (!eslesme) continue;
      try {
        const sonuc = await isleyici(eslesme.slice(1), govde || {});
        return sonuc === null ? { durum: 204, govde: null } : { durum: yontem === "POST" ? 201 : 200, govde: sonuc };
      } catch (err) {
        if (err instanceof ApiHatasi) return { durum: err.durum, govde: { hata: err.message } };
        console.error(`[${yontem} ${yol}]`, err);
        return { durum: 500, govde: { hata: "Beklenmeyen bir hata oluştu." } };
      }
    }
    return { durum: 404, govde: { hata: "Bulunamadı." } };
  }

  return { isle, aktifSaglayici };
}
