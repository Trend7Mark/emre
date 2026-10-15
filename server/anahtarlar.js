// API anahtarlarının saklanması. Masaüstü programı anahtarları Windows'un
// kullanıcıya özel şifrelemesiyle (Electron safeStorage) şifreleyerek saklar.
// Web/sunucu kipinde ortam değişkenleri (.env) de kullanılabilir.
import { oku, yaz } from "./store.js";

const ORTAM = { claude: "ANTHROPIC_API_KEY", gemini: "GEMINI_API_KEY" };

/**
 * @param {object} [secenekler]
 * @param {(s: string) => string} [secenekler.sifrele]
 * @param {(s: string) => string} [secenekler.coz]
 * @param {Record<string, string>} [secenekler.gomulu]  Programla birlikte gelen anahtarlar;
 *   kullanıcı kendi anahtarını girmediyse bunlar kullanılır.
 */
export function anahtarDeposu({ sifrele = (s) => s, coz = (s) => s, gomulu = {} } = {}) {
  return {
    /** Anahtarın nereden geldiği: "kullanici" | "gomulu" | "ortam" | "" */
    kaynak(saglayici) {
      if (oku("anahtarlar", {})[saglayici]) return "kullanici";
      if (gomulu[saglayici]) return "gomulu";
      if (process.env[ORTAM[saglayici]]) return "ortam";
      return "";
    },
    getir(saglayici) {
      const kayitli = oku("anahtarlar", {})[saglayici];
      if (kayitli) {
        try {
          return coz(kayitli);
        } catch {
          return ""; // başka bir bilgisayardan/kullanıcıdan kopyalanmış veri çözülemez
        }
      }
      return gomulu[saglayici] || process.env[ORTAM[saglayici]] || "";
    },
    kaydet(saglayici, anahtar) {
      const hepsi = oku("anahtarlar", {});
      if (anahtar) hepsi[saglayici] = sifrele(anahtar);
      else delete hepsi[saglayici];
      yaz("anahtarlar", hepsi);
    },
  };
}
