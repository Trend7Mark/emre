// Uygulamanın tüm işlevleri: HTTP sunucusundan (web sürümü) ve masaüstü
// programından (Electron) aynı şekilde çağrılır. Böylece iki sürüm tek kod tabanını paylaşır.
import * as store from "./store.js";
import { HABER_TURLERI, HABER_TONLARI } from "./templates.js";
import {
  sistemTalimati,
  kullaniciMesaji,
  baslikMesaji,
  degerlendirmeMesaji,
  HABER_SEMASI,
  BASLIK_SEMASI,
  DEGERLENDIRME_SEMASI,
} from "./prompt.js";
import { haberDuzMetin } from "./format.js";

const SAGLAYICILAR = {
  claude: () => import("./providers/claude.js"),
  gemini: () => import("./providers/gemini.js"),
  demo: () => import("./providers/demo.js"),
};

const SAGLAYICI_ADLARI = ["claude", "gemini"];

/** Anahtarın hangi sağlayıcıya ait olduğunu biçiminden anlar. */
export function anahtarTuru(anahtar) {
  if (/^sk-ant-[\w-]{20,}$/.test(anahtar)) return "claude";
  if (/^AIza[\w-]{20,}$/.test(anahtar)) return "gemini";
  return null;
}

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
 * @param {object} [secenekler]
 * @param {typeof fetch} [secenekler.fetch]  Yapay zekâ istekleri için kullanılacak fetch
 *   (masaüstünde Windows ağ ayarlarını kullanan Electron net.fetch).
 */
export function apiOlustur(anahtarlar, { fetch } = {}) {
  // Kullanılacak sağlayıcı: varsayılan olan; onun anahtarı yoksa anahtarı olan diğeri; hiçbiri yoksa demo.
  function aktifSaglayici() {
    const yz = store.yzAyarlariGetir();
    if (yz.saglayici === "demo") return { ad: "demo" };
    const sira = [yz.saglayici, ...SAGLAYICI_ADLARI.filter((a) => a !== yz.saglayici)];
    const ad = sira.find((a) => anahtarlar.getir(a));
    if (!ad) return { ad: "demo", eksik: true };
    return {
      ad,
      anahtar: anahtarlar.getir(ad),
      model: yz.modeller?.[ad] || VARSAYILAN_MODELLER[ad],
      calismaAlani: ad === "claude" ? yz.calismaAlani || "" : "",
    };
  }

  function yzDurumu() {
    const yz = store.yzAyarlariGetir();
    const aktif = aktifSaglayici();
    return {
      aktif: aktif.ad,
      anahtarYok: Boolean(aktif.eksik),
      anahtarVar: Object.fromEntries(SAGLAYICI_ADLARI.map((a) => [a, Boolean(anahtarlar.getir(a))])),
      anahtarKaynagi: Object.fromEntries(SAGLAYICI_ADLARI.map((a) => [a, anahtarlar.kaynak(a)])),
      modeller: { ...VARSAYILAN_MODELLER, ...yz.modeller },
      calismaAlani: yz.calismaAlani || "",
      // sk-ant-usr anahtarı kullanılıyor ama çalışma alanı yok: arayüz kutuyu öne çıkarır.
      calismaAlaniGerekli: kullaniciAnahtari(aktif) && !yz.calismaAlani,
    };
  }

  const kullaniciAnahtari = (a) => a.ad === "claude" && /^sk-ant-usr-/.test(a.anahtar || "");

  // Kullanıcı anahtarında çalışma alanı girilmemişse bulmayı dener ve kaydeder.
  async function hazirAktif() {
    const aktif = aktifSaglayici();
    if (!kullaniciAnahtari(aktif) || aktif.calismaAlani) return aktif;
    const { calismaAlaniBul } = await SAGLAYICILAR.claude();
    const id = await calismaAlaniBul({ anahtar: aktif.anahtar, fetch });
    if (!id) return aktif;
    store.yzAyarlariKaydet({ ...store.yzAyarlariGetir(), calismaAlani: id });
    return { ...aktif, calismaAlani: id };
  }

  // Seçili yapay zekâya şemalı istek gönderir.
  async function yzCagir({ amac, kullanici, sema, efor, girdi }) {
    const aktif = await hazirAktif();
    try {
      const saglayici = await SAGLAYICILAR[aktif.ad]();
      const sonuc = await saglayici.cagir({
        amac,
        girdi,
        sistem: sistemTalimati(store.ayarlariGetir(), store.ornekleriGetir()),
        kullanici,
        sema,
        efor,
        anahtar: aktif.anahtar,
        calismaAlani: aktif.calismaAlani,
        model: aktif.model,
        fetch,
      });
      return { ...sonuc, saglayici: aktif.ad };
    } catch (err) {
      console.error(`[${amac}]`, err);
      throw new ApiHatasi(502, err.message || "Yapay zekâdan yanıt alınamadı.");
    }
  }

  const haberGovdesi = (b) => {
    const h = b?.haber;
    if (!h || typeof h !== "object" || !h.baslik) throw new ApiHatasi(400, "Haber metni eksik.");
    return h;
  };

  function varsayilanYap(saglayici) {
    store.yzAyarlariKaydet({ ...store.yzAyarlariGetir(), saglayici });
  }

  const rotalar = [
    ["GET", /^\/api\/durum$/, () => ({ yz: yzDurumu(), turler: HABER_TURLERI, tonlar: HABER_TONLARI })],

    // ---- Yapay zekâ ayarları ----
    ["GET", /^\/api\/yz$/, () => yzDurumu()],
    // Yeni anahtar: türü anahtarın kendisinden anlaşılır ve o sağlayıcı varsayılan olur.
    [
      "POST",
      /^\/api\/yz\/anahtar$/,
      async (_, b) => {
        const anahtar = temizMetin(b.anahtar, 500).replace(/\s+/g, "");
        const saglayici = anahtarTuru(anahtar);
        if (!saglayici) {
          throw new ApiHatasi(400, "Anahtar tanınamadı. Claude anahtarı \"sk-ant-\", Gemini anahtarı \"AIza\" ile başlar.");
        }
        anahtarlar.kaydet(saglayici, anahtar);
        varsayilanYap(saglayici);
        await hazirAktif();
        return { ...yzDurumu(), eklenen: saglayici };
      },
    ],
    [
      "DELETE",
      /^\/api\/yz\/anahtar\/(claude|gemini)$/,
      ([saglayici]) => {
        anahtarlar.kaydet(saglayici, "");
        return yzDurumu();
      },
    ],
    [
      "POST",
      /^\/api\/yz\/test$/,
      async () => {
        const aktif = await hazirAktif();
        try {
          const saglayici = await SAGLAYICILAR[aktif.ad]();
          return { tamam: true, mesaj: await saglayici.sina({ anahtar: aktif.anahtar, model: aktif.model, calismaAlani: aktif.calismaAlani, fetch }) };
        } catch (err) {
          return { tamam: false, mesaj: err.message };
        }
      },
    ],
    // Kayıtlı anahtarlar arasında varsayılanı değiştirme ve model adları.
    [
      "PUT",
      /^\/api\/yz$/,
      (_, b) => {
        const yz = store.yzAyarlariGetir();
        if (b.saglayici !== undefined) {
          if (b.saglayici !== "demo" && !SAGLAYICI_ADLARI.includes(b.saglayici)) throw new ApiHatasi(400, "Geçersiz seçim.");
          if (b.saglayici !== "demo" && !anahtarlar.getir(b.saglayici)) throw new ApiHatasi(400, "Bu yapay zekâ için önce anahtar girin.");
          yz.saglayici = b.saglayici;
        }
        if (b.calismaAlani !== undefined) {
          const id = temizMetin(b.calismaAlani, 100).replace(/\s+/g, "");
          if (id && !/^wrkspc_\w+$/.test(id)) throw new ApiHatasi(400, "Çalışma alanı kimliği \"wrkspc_\" ile başlamalıdır.");
          yz.calismaAlani = id;
        }
        if (b.modeller) {
          yz.modeller = {};
          for (const ad of SAGLAYICI_ADLARI) {
            const m = temizMetin(b.modeller[ad], 100);
            if (m && m !== VARSAYILAN_MODELLER[ad]) yz.modeller[ad] = m;
          }
        }
        store.yzAyarlariKaydet(yz);
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

        const sonuc = await yzCagir({ amac: "haber", girdi, kullanici: kullaniciMesaji(girdi), sema: HABER_SEMASI, efor: "medium" });
        return store.haberKaydet({
          girdi,
          haber: sonuc.veri,
          saglayici: sonuc.saglayici,
          model: sonuc.model,
          kullanim: sonuc.kullanim,
          durum: "taslak",
        });
      },
    ],

    // Mevcut (düzenlenmiş olabilecek) haber için 5 yeni başlık.
    [
      "POST",
      /^\/api\/basliklar$/,
      async (_, b) => {
        const haber = haberGovdesi(b);
        const oncekiler = metinListesi(b.oncekiler).slice(0, 30);
        const sonuc = await yzCagir({ amac: "basliklar", kullanici: baslikMesaji(haber, oncekiler), sema: BASLIK_SEMASI, efor: "low" });
        return { basliklar: (sonuc.veri.basliklar || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 5) };
      },
    ],
    // Mevcut metni değerlendirip ekle/çıkar/düzelt önerileri verir.
    [
      "POST",
      /^\/api\/degerlendir$/,
      async (_, b) => {
        const haber = haberGovdesi(b);
        const sonuc = await yzCagir({ amac: "degerlendir", kullanici: degerlendirmeMesaji(haber), sema: DEGERLENDIRME_SEMASI, efor: "medium" });
        return { editorNotlari: sonuc.veri.editorNotlari || [] };
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
