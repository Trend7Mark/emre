import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let api;
let depo;

before(async () => {
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "basin-test-"));
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const { apiOlustur } = await import("../server/api.js");
  const { anahtarDeposu } = await import("../server/anahtarlar.js");
  depo = anahtarDeposu({ sifrele: (s) => `enc:${s}`, coz: (s) => s.replace(/^enc:/, "") });
  api = apiOlustur(depo);
});

test("anahtar yoksa demo kipine düşer ve anahtar istenir", async () => {
  const { durum, govde } = await api.isle("GET", "/api/yz");
  assert.equal(durum, 200);
  assert.equal(govde.aktif, "demo");
  assert.equal(govde.anahtarYok, true);
});

test("anahtarın türü otomatik anlaşılır; en son girilen varsayılan olur", async () => {
  const claude = "sk-ant-api03-" + "a".repeat(30);
  const gemini = "AIzaSy" + "b".repeat(30);

  let r = await api.isle("POST", "/api/yz/anahtar", { anahtar: ` ${claude} ` });
  assert.equal(r.govde.eklenen, "claude");
  assert.equal(r.govde.aktif, "claude");
  assert.equal(r.govde.anahtarYok, false);

  r = await api.isle("POST", "/api/yz/anahtar", { anahtar: gemini });
  assert.equal(r.govde.aktif, "gemini");
  assert.deepEqual(r.govde.anahtarVar, { claude: true, gemini: true });

  // Kayıtlı anahtarlar arasında geçiş
  r = await api.isle("PUT", "/api/yz", { saglayici: "claude" });
  assert.equal(r.govde.aktif, "claude");

  // Varsayılanın anahtarı silinirse diğerine geçilir
  r = await api.isle("DELETE", "/api/yz/anahtar/claude");
  assert.equal(r.govde.aktif, "gemini");

  // Şifrelenerek saklanır
  const dosya = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, "anahtarlar.json"), "utf8"));
  assert.equal(dosya.gemini, `enc:${gemini}`);
  assert.equal(depo.getir("gemini"), gemini);
  await api.isle("DELETE", "/api/yz/anahtar/gemini");
});

test("tanınmayan anahtar ve anahtarsız sağlayıcı reddedilir", async () => {
  assert.equal((await api.isle("POST", "/api/yz/anahtar", { anahtar: "rastgele-metin" })).durum, 400);
  assert.equal((await api.isle("PUT", "/api/yz", { saglayici: "gemini" })).durum, 400);
});

test("demo kipinde haber üretilir ve arşive kaydedilir", async () => {
  await api.isle("PUT", "/api/yz", { saglayici: "demo" });
  const uret = await api.isle("POST", "/api/uret", { tur: "ziyaret", notlar: "Vali bugün Kelkit Anadolu Lisesini ziyaret etti." });
  assert.equal(uret.durum, 201);
  assert.match(uret.govde.haber.baslik, /DEMO/);
  const liste = await api.isle("GET", "/api/haberler");
  assert.equal(liste.govde[0].id, uret.govde.id);
});

test("kısa not reddedilir, bilinmeyen yol 404 döner", async () => {
  assert.equal((await api.isle("POST", "/api/uret", { notlar: "kısa" })).durum, 400);
  assert.equal((await api.isle("GET", "/api/yok")).durum, 404);
  assert.equal((await api.isle("DELETE", "/api/haberler/olmayan")).durum, 404);
});

test("gömülü anahtar, kullanıcı anahtarı yoksa kullanılır ve kaynağı bildirilir", async () => {
  const { anahtarDeposu } = await import("../server/anahtarlar.js");
  const d = anahtarDeposu({ gomulu: { claude: "sk-gomulu" } });
  d.kaydet("claude", "");
  assert.equal(d.getir("claude"), "sk-gomulu");
  assert.equal(d.kaynak("claude"), "gomulu");
  d.kaydet("claude", "sk-kendi");
  assert.equal(d.getir("claude"), "sk-kendi");
  assert.equal(d.kaynak("claude"), "kullanici");
  d.kaydet("claude", "");
});

test("başlık yenileme 5 başlık, değerlendirme öneri döndürür; bağlantı testi demo'da çalışır", async () => {
  await api.isle("PUT", "/api/yz", { saglayici: "demo" });
  const haber = { baslik: "B", spot: "S", govde: [{ tur: "paragraf", metin: "P" }] };
  const b = await api.isle("POST", "/api/basliklar", { haber, oncekiler: ["B"] });
  assert.equal(b.durum, 201);
  assert.equal(b.govde.basliklar.length, 5);
  const d = await api.isle("POST", "/api/degerlendir", { haber });
  assert.ok(d.govde.editorNotlari.length > 0);
  assert.ok(["ekle", "cikar", "duzelt"].includes(d.govde.editorNotlari[0].tur));
  assert.equal((await api.isle("POST", "/api/basliklar", {})).durum, 400);
  assert.equal((await api.isle("POST", "/api/yz/test")).govde.tamam, true);
});

test("çalışma alanı kimliği doğrulanır ve kaydedilir", async () => {
  assert.equal((await api.isle("PUT", "/api/yz", { calismaAlani: "yanlis" })).durum, 400);
  assert.equal((await api.isle("PUT", "/api/yz", { calismaAlani: " wrkspc_01ABC " })).govde.calismaAlani, "wrkspc_01ABC");
  assert.equal((await api.isle("PUT", "/api/yz", { calismaAlani: "" })).govde.calismaAlani, "");
});
