// İlk çalıştırmada kullanılan varsayılan kurum ayarları ve üslup örnekleri.
// Kurum ayarları uygulama içindeki "Kurum Ayarları" sekmesinden değiştirilebilir.

export const VARSAYILAN_AYARLAR = {
  kurumId: "gumushane-il",
  duzey: "il", // "il" | "ilce"
  il: "Gümüşhane",
  ilce: "",
  kurumAdi: "Gümüşhane İl Millî Eğitim Müdürlüğü",
  // Metinde müdürün her geçişte yazılacağı sabit biçim.
  mudurAnilis: "İl Millî Eğitim Müdürümüz Şener Doğan",
  // Protokol listesi: metinde anılış biçimiyle, protokol sırasına göre (üstteki önce).
  protokol: [
    "Valimiz Sayın Cevdet Atay",
    "İl Millî Eğitim Müdürümüz Şener Doğan",
  ],
  // Web haberi için kurumun sabit ifade ve kuralları (serbest metin, her satır bir kural).
  ekKurallar: [
    "Bakanlık için \"Bakanlığımız\", il için \"ilimiz\", öğrenciler için gerektiğinde \"evlatlarımız\" ifadesi kullanılır.",
    "Kurum adı ilk geçtiğinde tam yazılır: Gümüşhane İl Millî Eğitim Müdürlüğü.",
  ],
  sosyal: {
    etiketler: ["#Gümüşhane", "#MillîEğitim"],
    hesaplar: ["@tcmeb", "@gumushanemem"],
  },
};

export const VARSAYILAN_ORNEKLER = [
  {
    id: "ornek-gumushane-2575",
    kurumId: "gumushane-il",
    kaynak:
      "https://gumushane.meb.gov.tr/www/valimiz-sayin-cevdet-atay-quotmesleki-egitim-ulkemizin-kalkinmasinda-ve-nitelikli-is-gucunun-yetistirilmesinde-lokomotif-gucturquot/icerik/2575/tr",
    eklenme: "2026-10-13T13:58:00.000Z",
    baslik:
      "Valimiz Sayın Cevdet Atay: \"Mesleki eğitim, ülkemizin kalkınmasında ve nitelikli iş gücünün yetiştirilmesinde lokomotif güçtür\"",
    metin: `Valimiz Sayın Cevdet Atay ve beraberindeki İl Millî Eğitim Müdürümüz Şener Doğan; Gümüşhane Mesleki ve Teknik Anadolu Lisesi ile Hayme Ana Mesleki ve Teknik Anadolu Lisesini ziyaret ederek incelemelerde bulundu. Okullardaki atölye ve laboratuvarları gezerek öğrenci ve öğretmenlerle bir araya gelen Valimiz Sayın Cevdet Atay ve İl Millî Eğitim Müdürümüz Şener Doğan, mesleki eğitimin üreten Türkiye vizyonundaki stratejik önemine dikkat çekti.

Valimiz Sayın Cevdet Atay ve İl Millî Eğitim Müdürümüz Şener Doğan, ilimizdeki mesleki eğitim kurumlarının mevcut durumunu değerlendirmek, atölye imkânlarını yerinde görmek ve öğrenci-öğretmen buluşmalarını gerçekleştirmek üzere Gümüşhane Mesleki ve Teknik Anadolu Lisesi ile Hayme Ana Mesleki ve Teknik Anadolu Lisesine ziyarette bulundu.

Ziyaret kapsamında okulların bünyesinde yer alan uygulama atölyeleri, teknik laboratuvarlar ve üretim alanları tek tek incelendi. Öğrencilerin tezgah ve uygulama masaları başında yürüttükleri çalışmaları yakından takip eden Valimiz Sayın Cevdet Atay ile İl Millî Eğitim Müdürümüz Şener Doğan, teorik bilgiyi pratiğe dönüştüren gençlerle meslek hedefleri ve sektörel kazanımları üzerine sohbet etti.

"Mesleki eğitim, ülkemizin kalkınmasında ve nitelikli iş gücünün yetiştirilmesinde lokomotif güçtür"

Ülke sanayisinin, ticaretinin ve üretim sektörünün temel dayanağının donanımlı iş gücü olduğunu vurgulayan Valimiz Sayın Cevdet Atay, yaptığı değerlendirmede şu ifadeleri kullandı:

"Mesleki eğitim, ülkemizin kalkınmasında ve nitelikli iş gücünün yetiştirilmesinde lokomotif güçtür. Üretimin, istihdamın ve sürdürülebilir ekonomik kalkınmanın odağında mesleki eğitimi önceleyen vizyon yer almaktadır. Sanayimizin ve iş dünyamızın ihtiyaç duyduğu nitelikli mesleki eleman gücünü okullarımızda en güçlü şekilde yetiştirmek mecburiyetindeyiz. Meslek liselerimiz, evlatlarımıza yalnızca bir mesleki formasyon kazandırmakla kalmıyor; doğrudan katma değer üreten, ülke ekonomisine katkı sağlayan ve kendi geleceğini inşa eden bireyler olmalarına imkân tanıyor. Öğrencilerimizin atölyelerdeki azmi ve üretim heyecanı, geleceğimizin ne denli sağlam temeller üzerinde yükseldiğinin en açık göstergesidir."

"Meslek liselerimiz, üreten Türkiye'nin teminatı ve aranan iş gücünün merkezidir"

Mesleki eğitimin sahadaki rolüne ve istihdam odaklı eğitim modeline değinen İl Millî Eğitim Müdürümüz Şener Doğan ise konuşmasında şunları kaydetti:

"Bakanlığımızın politikaları doğrultusunda meslek liselerimiz, üreten Türkiye'nin teminatı ve aranan iş gücünün merkezidir. Üretim sektörünün ihtiyaç duyduğu teknik personeli, yani geleneksel tabirle ara eleman ihtiyacını 'aranan eleman' seviyesine yükseltmek için tüm kapasitemizle sahadayız. Gümüşhane Mesleki ve Teknik Anadolu Lisesi ile Hayme Ana Mesleki ve Teknik Anadolu Lisemizde yürütülen nitelikli çalışmalar, evlatlarımızın çağın gerektirdiği donanımla iş hayatına hazırlandığını kanıtlamaktadır. Atölye ortamında emeğiyle üreten, meslek ahlakı ve iş disipliniyle yoğrulan her bir gencimiz, hem ilimizin hem de ülkemizin üretim gücüne doğrudan ivme kazandıracaktır. Bu süreçte özveriyle çalışan öğretmenlerimize ve geleceğe umutla hazırlanan tüm öğrencilerimize teşekkür ediyorum."

Atölyelerdeki incelemelerin tamamlanmasının ardından öğretmenler odasında okul idarecileri ve meslek dersi öğretmenleriyle bir araya gelindi. Meslek liselerinde nitelikli iş gücü ve sektörel ihtiyaçlar değerlendirildi; eğitim-istihdam iş birlikleri ve okul-sanayi entegrasyonu üzerine görüş alışverişinde bulunuldu. Ziyaret programı, iyi dilek ve başarı temennilerinin iletilmesiyle sona erdi.`,
  },
];
