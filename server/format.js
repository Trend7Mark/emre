// Yapılandırılmış haberi web sitesine yapıştırılacak düz metne çevirir.
export function haberDuzMetin(haber, { baslikDahil = true } = {}) {
  const govde = (haber.govde || []).map((b) => b.metin.trim()).filter(Boolean);
  const metin = [haber.spot, ...govde].filter(Boolean).join("\n\n");
  return {
    baslik: haber.baslik,
    metin: baslikDahil ? `${haber.baslik}\n\n${metin}` : metin,
  };
}
