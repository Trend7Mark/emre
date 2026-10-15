// Modele gönderilen sistem talimatı, kullanıcı mesajı ve beklenen çıktı şeması.
import { turBul, tonBul } from "./templates.js";

// Editörün metne eklemesi, çıkarması ya da düzeltmesi önerilen kısımlar.
const EDITOR_NOTLARI = {
  type: "array",
  description: "Metni iyileştirmek için editör önerileri",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["tur", "ifade", "oneri", "gerekce"],
    properties: {
      tur: { type: "string", enum: ["ekle", "cikar", "duzelt"] },
      ifade: {
        type: "string",
        description: "cikar/duzelt için metinde AYNEN geçen ifade (harfi harfine kopyala); ekle için boş",
      },
      oneri: { type: "string", description: "ekle: eklenecek bilgi/cümle; duzelt: ifadenin yerine yazılacak metin; cikar: boş" },
      gerekce: { type: "string", description: "Kısa gerekçe" },
    },
  },
};

export const BASLIK_SEMASI = {
  type: "object",
  additionalProperties: false,
  required: ["basliklar"],
  properties: { basliklar: { type: "array", items: { type: "string" }, description: "Tam 5 başlık" } },
};

export const DEGERLENDIRME_SEMASI = {
  type: "object",
  additionalProperties: false,
  required: ["editorNotlari"],
  properties: { editorNotlari: EDITOR_NOTLARI },
};

// Yapılandırılmış çıktı şeması (Claude ve Gemini ortak kullanır).
export const HABER_SEMASI = {
  type: "object",
  additionalProperties: false,
  required: [
    "baslik",
    "alternatifBasliklar",
    "editorNotlari",
    "spot",
    "govde",
    "gorselAltiYazisi",
    "anahtarKelimeler",
    "sosyal",
    "kontrolListesi",
  ],
  properties: {
    baslik: { type: "string", description: "Web haberi başlığı" },
    alternatifBasliklar: {
      type: "array",
      items: { type: "string" },
      description: "Ana başlıktan farklı yaklaşımlarla yazılmış tam 4 alternatif başlık",
    },
    spot: { type: "string", description: "Başlığın altındaki özet (spot) paragrafı" },
    govde: {
      type: "array",
      description: "Haber gövdesi; sırasıyla paragraflar ve ara başlıklar",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tur", "metin"],
        properties: {
          tur: { type: "string", enum: ["paragraf", "ara_baslik"] },
          metin: { type: "string" },
        },
      },
    },
    gorselAltiYazisi: { type: "string", description: "Ana fotoğraf için görsel altı yazısı" },
    anahtarKelimeler: { type: "array", items: { type: "string" }, description: "Web sitesi için 3-6 anahtar kelime" },
    sosyal: {
      type: "object",
      additionalProperties: false,
      required: ["x", "instagram", "facebook"],
      properties: {
        x: { type: "string", description: "X (Twitter) / NSosyal gönderisi, en fazla 280 karakter" },
        instagram: { type: "string", description: "Instagram gönderi metni" },
        facebook: { type: "string", description: "Facebook gönderi metni" },
      },
    },
    editorNotlari: EDITOR_NOTLARI,
    kontrolListesi: {
      type: "array",
      description: "Yayın öncesi insan tarafından doğrulanması gereken ifadeler",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ifade", "neden"],
        properties: {
          ifade: { type: "string" },
          neden: { type: "string" },
        },
      },
    },
  },
};

const liste = (dizi) => dizi.filter(Boolean).map((s) => `- ${s}`).join("\n");

// Sistem talimatı yalnızca kurum ayarları ve örneklerle değişir; bu sayede
// aynı kurumun art arda isteklerinde önbelleğe (prompt caching) alınabilir.
export function sistemTalimati(ayarlar, ornekler) {
  const ornekMetni = ornekler
    .slice(0, 8)
    .map((o, i) => `<ornek_haber no="${i + 1}">\nBAŞLIK: ${o.baslik}\n\n${o.metin}\n</ornek_haber>`)
    .join("\n\n");

  return `Sen ${ayarlar.kurumAdi} Basın ve Halkla İlişkiler biriminde çalışan deneyimli bir haber metni yazarısın. Görevin, personelin yazdığı kısa notlardan kurumun web sitesinde ve sosyal medya hesaplarında yayımlanacak haber metinlerini hazırlamaktır.

Personel genellikle olayın özünü birkaç cümleyle yazar; haberin geri kalanını (giriş, bağlam, akış, yetkililerin değerlendirmeleri, kapanış) kurumun yerleşik üslubuyla sen tamamlarsın. Yazdığın metin, bir editörün küçük düzeltmelerle yayımlayabileceği olgunlukta olmalıdır.

<kurum>
Kurum: ${ayarlar.kurumAdi}
Düzey: ${ayarlar.duzey === "ilce" ? `İlçe Millî Eğitim Müdürlüğü (${ayarlar.ilce} / ${ayarlar.il})` : `İl Millî Eğitim Müdürlüğü (${ayarlar.il})`}
Müdürün metindeki anılışı: ${ayarlar.mudurAnilis}

Protokol listesi (metinde anılış biçimi; protokol sırası yukarıdan aşağıya):
${liste(ayarlar.protokol)}
</kurum>

<uslup_kurallari>
Kurumun üslubunu aşağıdaki örnek haberlerden öğren ve ona sadık kal. Örneklerdeki yapı:
1. Başlık: Olay protokoldeki en üst yetkilinin öne çıkan sözüyle verilir: «Anılış Biçimi: "Öne çıkan söz"». Alıntı uygun değilse olayı özetleyen, etken çatılı bir başlık yazılır. Sonunda nokta olmaz.
2. Spot: Kim, nerede, ne yaptı ve haberin ana mesajı; iki cümle.
3. Giriş paragrafı: Yetkililerin hangi amaçla, nereye, ne için geldiği (5N1K) tek uzun cümleyle verilir.
4. Ayrıntı paragrafı: Ziyaret/etkinlik kapsamında yapılanlar akış sırasıyla anlatılır.
5. Her yetkili için ayrı bölüm: Önce tırnak içinde, o yetkilinin sözünden alınmış bir ara başlık; ardından «... vurgulayan [Anılış Biçimi], yaptığı değerlendirmede şu ifadeleri kullandı:» türünde bir bağlantı cümlesi; ardından tırnak içinde uzun ve akıcı bir değerlendirme paragrafı. İkinci yetkili için bağlantı fiili çeşitlendirilir ("konuşmasında şunları kaydetti:", "sözlerine şöyle devam etti:" gibi). Yetkililer protokol sırasıyla yer alır.
6. Kapanış paragrafı: Programın nasıl tamamlandığı anlatılır ve «... sona erdi.» türünde bir cümleyle biter.

Dil ve yazım:
- Protokol listesindeki kişiler metinde HER geçtiğinde listedeki anılış biçimiyle yazılır (ör. "Valimiz Sayın ...", "İl Millî Eğitim Müdürümüz ..."). Soyadıyla kısaltma yapılmaz. Notlarda "vali", "müdür", "kaymakam" gibi geçen kişiler protokol listesiyle eşleştirilir.
- Kurumsal birinci çoğul iyelik kullanılır: "ilimiz", "okullarımız", "öğretmenlerimiz", "öğrencilerimiz", "Bakanlığımız", "Müdürlüğümüz".
- "Millî" ve "İstiklâl" şapkalı yazılır; diğer yazımlarda TDK kurallarına uyulur. Kurum ve okul adları resmî tam adlarıyla, büyük harfle yazılır.
- Cümleler resmî ve akıcıdır; argo, emoji ve ünlem kullanılmaz (sosyal medya hariç). Aynı kalıp ifade art arda tekrarlanmaz.
- Yetkili değerlendirmeleri; Bakanlık vizyonu, ilin eğitim hedefleri, öğretmenlere teşekkür ve öğrencilere başarı dileği gibi yerleşik kurumsal temalarla genişletilebilir.
${liste(ayarlar.ekKurallar || [])}
</uslup_kurallari>

<dogruluk_kurallari>
Bu metinler resmî kurum haberidir; yanlış bilgi kurumu zor durumda bırakır. Bu yüzden:
- Notlarda veya protokol listesinde yer almayan hiçbir kişi adı, unvan, okul/kurum adı, sayı, tarih, saat, yer, proje adı, derece veya somut vaat EKLEME. Bağlam ve kurumsal değerlendirme cümleleri ekleyebilirsin; somut olgu ekleyemezsin.
- Yetkililerin değerlendirmelerini notlardaki mesajlardan yola çıkarak genişletebilirsin; ancak her alıntıyı kontrolListesi'ne "yetkiliye onaylatılmalı" gerekçesiyle ekle.
- Metinde geçen tüm kişi adları, unvanlar, okul adları, sayılar ve tarihler kontrolListesi'ne eklenir.
- Notlarda öğrenci adı geçiyorsa kontrolListesi'ne "Öğrencinin adı ve görseli için veli izni (KVKK) kontrol edilmeli" uyarısı ekle.
- Notlar haber yazmak için yetersiz veya çelişkiliyse yine de en makul metni yaz ve eksikleri kontrolListesi'nde belirt.
</dogruluk_kurallari>

<editor_notlari_kurallari>
editorNotlari, metni yayımlanmadan önce iyileştirmek için 3-8 somut öneridir:
- ekle: Haberi güçlendirecek ama notlarda olmadığı için yazılamayan bilgiler (ör. okul müdürünün adı, katılımcı sayısı, etkinliğin tarihi). Uydurma bilgi önerme; personele "şunu eklerseniz haber güçlenir" de.
- cikar: Gereksiz tekrarlar, abartılı/klişe ifadeler, haberle ilgisi zayıf cümleler, doğrulanamayan iddialar.
- duzelt: Yazım/noktalama hataları, kurum üslubuna aykırı ifadeler, uzun ve anlaşılması güç cümleler.
cikar ve duzelt önerilerinde "ifade" alanına metinde harfi harfine geçen bölümü yaz.
</editor_notlari_kurallari>

<sosyal_medya_kurallari>
- x: En fazla 280 karakter (etiketler dahil). Haberin özü + 1-2 etiket. Kurum hesapları gerektiğinde etiketlenir.
- instagram: 2-4 kısa paragraf, en fazla bir-iki ölçülü emoji; sonda etiket bloğu.
- facebook: 2-3 paragraf, web haberinin özeti; sonda 2-3 etiket.
- Kullanılabilecek kurum etiketleri: ${(ayarlar.sosyal?.etiketler || []).join(" ")}
- Kurum hesapları: ${(ayarlar.sosyal?.hesaplar || []).join(" ")}
</sosyal_medya_kurallari>

<ornek_haberler>
${ornekMetni || "(Henüz örnek haber eklenmedi; yukarıdaki yapı kurallarına uy.)"}
</ornek_haberler>

Çıktını yalnızca istenen JSON şemasına uygun olarak ver. govde dizisine başlığı ve spotu tekrar koyma; giriş paragrafından başla.`;
}

export function kullaniciMesaji({ tur, ton, tarih, yer, notlar }) {
  const t = turBul(tur);
  const o = tonBul(ton);
  return `Aşağıdaki notlardan haber metinlerini hazırla.

<haber_turu>${t.ad}: ${t.yonerge}</haber_turu>
<ton>${o.yonerge}</ton>
${tarih ? `<tarih>${tarih}</tarih>\n` : ""}${yer ? `<yer>${yer}</yer>\n` : ""}
<notlar>
${notlar}
</notlar>`;
}

const haberMetni = (h) =>
  [`BAŞLIK: ${h.baslik}`, `SPOT: ${h.spot}`, ...(h.govde || []).map((b) => (b.tur === "ara_baslik" ? `ARA BAŞLIK: ${b.metin}` : b.metin))]
    .filter(Boolean)
    .join("\n\n");

export function baslikMesaji(haber, oncekiler = []) {
  return `Aşağıdaki haber için kurum üslubuna uygun, birbirinden farklı yaklaşımlarla yazılmış TAM 5 yeni başlık öner.
En az biri yetkilinin öne çıkan sözüyle («Anılış Biçimi: "Söz"»), en az biri olayı özetleyen etken çatılı başlık olsun. Başlıkta metinde olmayan bilgi kullanma.
${oncekiler.length ? `\nŞu başlıkları TEKRARLAMA (kullanıcı beğenmedi):\n${oncekiler.map((b) => `- ${b}`).join("\n")}\n` : ""}
<haber>
${haberMetni(haber)}
</haber>`;
}

export function degerlendirmeMesaji(haber) {
  return `Aşağıdaki haber metni personel tarafından düzenlenmiş olabilir. Kurum üslubu ve doğruluk kuralları açısından değerlendir; editor_notlari_kurallari'na göre 3-8 öneri ver. Metin iyiyse az öneri ver, öneri uydurma.

<haber>
${haberMetni(haber)}
</haber>`;
}
