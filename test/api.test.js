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

test("anahtar yoksa demo kipine düşer ve eksik anahtarı bildirir", async () => {
  const { durum, govde } = await api.isle("GET", "/api/yz");
  assert.equal(durum, 200);
  assert.equal(govde.secili, "claude");
  assert.equal(govde.aktif, "demo");
  assert.equal(govde.eksikAnahtar, "claude");
});

test("anahtar şifrelenerek kaydedilir ve geri okunur", async () => {
  const { govde } = await api.isle("PUT", "/api/yz", { saglayici: "gemini", anahtarlar: { gemini: "AIza-x" } });
  assert.equal(govde.aktif, "gemini");
  assert.equal(govde.anahtarVar.gemini, true);
  const dosya = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, "anahtarlar.json"), "utf8"));
  assert.equal(dosya.gemini, "enc:AIza-x");
  assert.equal(depo.getir("gemini"), "AIza-x");
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
