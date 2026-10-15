// Anahtar gerektirmeyen sahte sağlayıcı: arayüzü ve akışı denemek içindir.
export async function uret({ girdi }) {
  const notlar = girdi.notlar.trim();
  const ilkCumle = notlar.split(/(?<=[.!?])\s+/)[0];
  return {
    model: "demo",
    kullanim: { girdi: 0, cikti: 0, onbellek: 0 },
    haber: {
      baslik: `[DEMO] ${ilkCumle.slice(0, 70)}`,
      alternatifBasliklar: ["[DEMO] Alternatif başlık 1", "[DEMO] Alternatif başlık 2", "[DEMO] Alternatif başlık 3"],
      spot: `[DEMO] Bu metin yapay zekâ bağlanmadan üretilmiştir. Gerçek haber için .env dosyasında AI_PROVIDER ayarını yapın.`,
      govde: [
        { tur: "paragraf", metin: notlar },
        { tur: "ara_baslik", metin: "\"[DEMO] Yetkili sözünden ara başlık\"" },
        { tur: "paragraf", metin: "[DEMO] Yetkilinin değerlendirmesi burada yer alacak." },
      ],
      gorselAltiYazisi: "[DEMO] Görsel altı yazısı",
      anahtarKelimeler: ["demo"],
      sosyal: { x: `[DEMO] ${ilkCumle.slice(0, 200)}`, instagram: `[DEMO] ${notlar}`, facebook: `[DEMO] ${notlar}` },
      kontrolListesi: [{ ifade: "Tüm metin", neden: "Demo modunda üretildi; gerçek haber değildir." }],
    },
  };
}
