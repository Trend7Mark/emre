// Haber türü şablonları. `yonerge` modele, `ornekNot` kullanıcıya örnek olarak gösterilir.

export const HABER_TURLERI = [
  {
    id: "ziyaret",
    ad: "Ziyaret (Okul / Kurum)",
    yonerge:
      "Ziyaret haberi. Kimin, nereyi, hangi amaçla ziyaret ettiğiyle açılır; incelenen birimler (atölye, sınıf, laboratuvar vb.) ve öğrenci-öğretmenlerle yapılan görüşmeler anlatılır; protokoldeki her yetkilinin değerlendirmesi ayrı ara başlıklı alıntı bölümüyle verilir; ziyaretin nasıl sona erdiğiyle kapanır.",
    ornekNot:
      "Vali ve müdür bugün Kelkit Anadolu Lisesini ziyaret etti. Kütüphane ve fen laboratuvarını gezdiler, 12. sınıflarla YKS hazırlığı üzerine sohbet ettiler. Vali: gençlerimize güveniyoruz. Müdür: okulun başarısından memnunuz, öğretmenlere teşekkür.",
  },
  {
    id: "toplanti",
    ad: "Toplantı / Değerlendirme",
    yonerge:
      "Toplantı haberi. Toplantının adı, yeri, kimin başkanlığında ve kimlerin katılımıyla yapıldığıyla açılır; gündem maddeleri ve alınan kararlar anlatılır; başkanlık eden yetkilinin değerlendirmesi alıntıyla verilir.",
    ornekNot:
      "İl Eğitim Değerlendirme Toplantısı müdür başkanlığında öğretmenevinde yapıldı. İlçe müdürleri ve şube müdürleri katıldı. Gündem: devamsızlık, LGS hazırlık, kış tedbirleri.",
  },
  {
    id: "toren",
    ad: "Tören / Kutlama / Anma",
    yonerge:
      "Tören haberi. Törenin vesilesi, yeri ve katılan protokolle açılır; programın akışı (saygı duruşu, İstiklâl Marşı, konuşmalar, gösteriler, ödüller) sırasıyla anlatılır; konuşmalardan alıntılar verilir; törenin nasıl sona erdiğiyle kapanır.",
    ornekNot:
      "24 Kasım Öğretmenler Günü töreni Atatürk Kültür Merkezinde yapıldı. Vali, müdür ve öğretmenler katıldı. Emekli öğretmenlere plaket verildi, öğrenciler şiir okudu.",
  },
  {
    id: "basari",
    ad: "Başarı / Yarışma / Derece",
    yonerge:
      "Başarı haberi. Elde edilen derece ve yarışmanın adı/düzeyi ile açılır; okul, öğrenci ve danışman öğretmen bilgisi verilir; yetkilinin tebrik değerlendirmesi alıntıyla verilir.",
    ornekNot:
      "Gümüşhane Fen Lisesi öğrencileri TÜBİTAK Lise Öğrencileri Araştırma Projeleri Bölge Finalinde kimya alanında birinci oldu. Danışman öğretmen Ayşe Yılmaz. Proje Türkiye finaline katılacak.",
  },
  {
    id: "proje",
    ad: "Proje / Etkinlik",
    yonerge:
      "Proje veya etkinlik haberi. Projenin/etkinliğin adı, amacı, hedef kitlesi ve kapsamıyla açılır; yapılan uygulamalar ve katılım bilgisi anlatılır; sorumlu yetkilinin değerlendirmesi alıntıyla verilir.",
    ornekNot:
      "\"Okuyan Gümüşhane\" projesi kapsamında 40 okulda kitap okuma saati başladı. Her gün ilk ders 20 dakika okuma yapılacak. Proje il genelinde 12 bin öğrenciyi kapsıyor.",
  },
  {
    id: "egitim",
    ad: "Hizmet İçi Eğitim / Seminer",
    yonerge:
      "Eğitim/seminer haberi. Eğitimin adı, tarihi, yeri, hedef kitlesi ve eğitmeniyle açılır; eğitim içeriği ve kazanımlar anlatılır; gerekirse açılış konuşmasından alıntı verilir.",
    ornekNot:
      "Rehber öğretmenlere yönelik akran zorbalığıyla mücadele semineri RAM'da yapıldı. 60 rehber öğretmen katıldı. Eğitmen: Dr. Mehmet Kaya.",
  },
  {
    id: "protokol",
    ad: "İş Birliği Protokolü",
    yonerge:
      "Protokol imza haberi. Taraflar, protokolün adı ve amacıyla açılır; protokol kapsamında yapılacak çalışmalar anlatılır; tarafların değerlendirmeleri alıntıyla verilir; imza ve hatıra fotoğrafıyla kapanır.",
    ornekNot:
      "Müdürlük ile Gümüşhane Üniversitesi arasında mesleki rehberlik protokolü imzalandı. Üniversite öğrencileri lise öğrencilerine kariyer günleri düzenleyecek. İmzayı müdür ve rektör attı.",
  },
  {
    id: "duyuru",
    ad: "Duyuru / Bilgilendirme",
    yonerge:
      "Duyuru haberi. Kısa ve doğrudan yazılır; ne, kim için, ne zamana kadar, nasıl başvurulur bilgisi ilk paragrafta verilir. Alıntı zorunlu değildir; ara başlık kullanılmaz.",
    ornekNot:
      "Bursluluk sınavı (İOKBS) başvuruları 20 Ekim'de başlıyor, 5 Kasım'da bitiyor. Başvurular okul müdürlükleri aracılığıyla yapılacak.",
  },
  {
    id: "genel",
    ad: "Genel Haber",
    yonerge:
      "Genel kurum haberi. Haberin en önemli bilgisiyle açılır, ayrıntılar önem sırasıyla verilir.",
    ornekNot: "",
  },
];

export const HABER_TONLARI = [
  { id: "resmi", ad: "Resmî — protokol ve devlet dili", yonerge: "Resmî devlet dili; ölçülü, saygılı ve kurumsal." },
  {
    id: "sicak",
    ad: "Sıcak kurumsal — öğrenci/veli odaklı",
    yonerge: "Kurumsal ama daha sıcak ve samimi; öğrenci ve velilere hitap eden, duygu yüklü ama abartısız.",
  },
];

export const turBul = (id) => HABER_TURLERI.find((t) => t.id === id) || HABER_TURLERI.at(-1);
export const tonBul = (id) => HABER_TONLARI.find((t) => t.id === id) || HABER_TONLARI[0];
