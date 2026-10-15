import { test } from "node:test";
import assert from "node:assert/strict";
import { sistemTalimati, kullaniciMesaji } from "../server/prompt.js";
import { haberDuzMetin } from "../server/format.js";
import { VARSAYILAN_AYARLAR, VARSAYILAN_ORNEKLER } from "../server/defaults.js";

test("sistem talimatı kurum, protokol ve üslup örneklerini içerir", () => {
  const s = sistemTalimati(VARSAYILAN_AYARLAR, VARSAYILAN_ORNEKLER);
  assert.match(s, /Gümüşhane İl Millî Eğitim Müdürlüğü/);
  assert.match(s, /- Valimiz Sayın Cevdet Atay/);
  assert.match(s, /<ornek_haber no="1">/);
});

test("örnek yoksa yedek açıklama kullanılır", () => {
  assert.match(sistemTalimati(VARSAYILAN_AYARLAR, []), /Henüz örnek haber eklenmedi/);
});

test("kullanıcı mesajı boş isteğe bağlı alanları atlar", () => {
  const m = kullaniciMesaji({ tur: "ziyaret", ton: "resmi", tarih: "", yer: "", notlar: "Not" });
  assert.match(m, /Ziyaret/);
  assert.doesNotMatch(m, /<tarih>/);
  assert.match(m, /<notlar>\nNot\n<\/notlar>/);
});

test("düz metin başlık, spot ve gövdeyi sırayla birleştirir", () => {
  const { metin } = haberDuzMetin({
    baslik: "B",
    spot: "S",
    govde: [{ tur: "paragraf", metin: "P1" }, { tur: "ara_baslik", metin: "A" }],
  });
  assert.equal(metin, "B\n\nS\n\nP1\n\nA");
});
