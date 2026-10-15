// Anahtar gerektirmeyen sahte sağlayıcı: arayüzü ve akışı denemek içindir.
let sayac = 0;

export async function cagir({ amac, girdi }) {
  const sonuc = (veri) => ({ model: "demo", kullanim: { girdi: 0, cikti: 0, onbellek: 0 }, veri });

  if (amac === "basliklar") {
    sayac += 1;
    return sonuc({ basliklar: [1, 2, 3, 4, 5].map((i) => `[DEMO] Yeni başlık ${sayac}.${i}`) });
  }
  if (amac === "degerlendir") {
    return sonuc({
      editorNotlari: [
        { tur: "ekle", ifade: "", oneri: "[DEMO] Okul müdürünün adı eklenebilir.", gerekce: "Haberde okul yönetimi anılmıyor." },
        { tur: "cikar", ifade: "[DEMO]", oneri: "", gerekce: "Demo etiketi yayımlanmamalı." },
      ],
    });
  }

  const notlar = girdi.notlar.trim();
  const ilkCumle = notlar.split(/(?<=[.!?])\s+/)[0];
  return sonuc({
    baslik: `[DEMO] ${ilkCumle.slice(0, 70)}`,
    alternatifBasliklar: [1, 2, 3, 4].map((i) => `[DEMO] Alternatif başlık ${i}`),
    spot: "[DEMO] Bu metin yapay zekâ bağlanmadan üretilmiştir. Gerçek haber için Ayarlar > Yapay Zekâ bölümünden API anahtarınızı girin.",
    govde: [
      { tur: "paragraf", metin: notlar },
      { tur: "ara_baslik", metin: "\"[DEMO] Yetkili sözünden ara başlık\"" },
      { tur: "paragraf", metin: "[DEMO] Yetkilinin değerlendirmesi burada yer alacak." },
    ],
    gorselAltiYazisi: "[DEMO] Görsel altı yazısı",
    anahtarKelimeler: ["demo"],
    sosyal: { x: `[DEMO] ${ilkCumle.slice(0, 200)}`, instagram: `[DEMO] ${notlar}`, facebook: `[DEMO] ${notlar}` },
    editorNotlari: [
      { tur: "ekle", ifade: "", oneri: "[DEMO] Etkinliğin tarihi eklenebilir.", gerekce: "Notlarda tarih yok." },
      { tur: "duzelt", ifade: "[DEMO] Görsel altı", oneri: "Görsel altı", gerekce: "Demo örneği." },
    ],
    kontrolListesi: [{ ifade: "Tüm metin", neden: "Demo modunda üretildi; gerçek haber değildir." }],
  });
}

export async function sina() {
  return "Demo modu: yapay zekâ bağlı değil.";
}
