// API anahtarlarının saklanması. Masaüstü programı anahtarları Windows'un
// kullanıcıya özel şifrelemesiyle (Electron safeStorage) şifreleyerek saklar.
// Web/sunucu kipinde ortam değişkenleri (.env) de kullanılabilir.
import { oku, yaz } from "./store.js";

const ORTAM = { claude: "ANTHROPIC_API_KEY", gemini: "GEMINI_API_KEY" };

/**
 * @param {{ sifrele?: (s: string) => string, coz?: (s: string) => string }} [sifreleme]
 */
export function anahtarDeposu({ sifrele = (s) => s, coz = (s) => s } = {}) {
  return {
    getir(saglayici) {
      const kayitli = oku("anahtarlar", {})[saglayici];
      if (kayitli) {
        try {
          return coz(kayitli);
        } catch {
          return ""; // başka bir bilgisayardan/kullanıcıdan kopyalanmış veri çözülemez
        }
      }
      return process.env[ORTAM[saglayici]] || "";
    },
    kaydet(saglayici, anahtar) {
      const hepsi = oku("anahtarlar", {});
      if (anahtar) hepsi[saglayici] = sifrele(anahtar);
      else delete hepsi[saglayici];
      yaz("anahtarlar", hepsi);
    },
  };
}
