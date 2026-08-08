# Rehabilitasyon Takvimi

Özel eğitim / rehabilitasyon merkezine giden bir çocuğun seans takibini yapmak için hazırlanmış,
tek dosyalık (kurulum gerektirmeyen) bir web uygulaması.

`index.html` dosyasını çift tıklayıp tarayıcıda açmanız yeterli. Sunucu, kurulum, üyelik gerekmez.

## Neler yapabiliyor?

- **Aylık takvim** — hafta pazartesi başlar, bugünün tarihi vurgulanır.
- **Haftalık program tanımı** — hangi gün, hangi saatte, hangi türde seans olduğunu bir kez tanımlarsınız;
  takvim otomatik dolar.
- **İki seans türü**
  - 🩺 **Raporlu seans** — devletin karşıladığı, ücretsiz seanslar (yeşil).
  - 💎 **Özel ücretli seans** — cepten ödenen seanslar (mavi). Ücret hesabına bunlar girer.
- **Tatil günleri** — düzenli kapalı günler (ör. Pazar–Pazartesi) ve tek seferlik kapalı günler.
- **Gün bazlı düzenleme** — bir güne tıklayın: seans ekleyin/silin, saatini değiştirin,
  **Planlandı / Yapıldı / İptal** olarak işaretleyin, not düşün (ör. "terapist izinli", "ödeme yapıldı").
- **Tarih aralığı özeti** — seçtiğiniz iki tarih arasındaki raporlu seans sayısı, özel seans sayısı,
  toplam saat ve **toplam ücret**.
- **PDF'e aktar** — seçili aralık için seans listesi ve toplamları içeren yazdırılabilir rapor
  (tarayıcının yazdırma ekranından "PDF olarak kaydet" seçin).
- **Koyu mod**.
- **Yedekleme** — JSON olarak dışa/içe aktarma.
- **İsteğe bağlı bulut senkronu** — Firebase ile telefon ve bilgisayarda aynı takvim.

## Hızlı başlangıç

1. `index.html` dosyasını tarayıcıda açın.
2. **Programı Düzenle** butonuna basın:
   - Çocuğun adını yazın (başlıkta görünür).
   - Seans ücretini girin.
   - **Program başlangıcı** alanına merkeze başladığınız tarihi yazın — bu tarihten önceki günlere
     seans üretilmez.
   - Tatil günlerini işaretleyin.
   - Haftalık seansları ekleyin (ör. Salı 09:00 raporlu, Salı 14:00 özel ücretli...).
3. **Kaydet**. Takvim otomatik dolacaktır.
4. Ay içinde aksayan bir gün olursa o güne tıklayıp **İptal** işaretleyin; özet ve ücret buna göre düşer.

Varsayılan program örnek olarak şu şekilde gelir: Pazar ve Pazartesi tatil, Salı ve Perşembe 09:00
raporlu, Salı–Cumartesi 14:00 özel ücretli — haftada toplam 7 saat.

## Hesaplama kuralları

- Her seans **1 saat** kabul edilir; "toplam saat" = seans sayısı.
- **İptal** işaretli seanslar hiçbir toplama dahil edilmez.
- **Toplam ücret** = (iptal edilmemiş özel ücretli seans sayısı) × (seans ücreti).
  Raporlu seanslar ücrete dahil değildir.

## Veriler nerede tutuluyor?

Varsayılan olarak yalnızca **kendi tarayıcınızın hafızasında** (localStorage) tutulur; hiçbir yere
gönderilmez. Tarayıcı verilerini temizlerseniz kayıtlar silinir, bu yüzden ara ara sağ üstteki
**Senkron** kutusundan **JSON indir** ile yedek almanız önerilir.

## İsteğe bağlı: birden fazla cihazda senkronizasyon

Telefonunuzda ve bilgisayarınızda aynı takvimi görmek isterseniz:

1. [Firebase Console](https://console.firebase.google.com)'da ücretsiz bir proje açın,
   **Firestore Database** oluşturun.
2. Proje ayarlarından web uygulaması ekleyip `firebaseConfig` bilgisini kopyalayın.
3. Uygulamada sağ üstteki **Senkron** yazısına tıklayın, config JSON'unu ve kendi seçeceğiniz bir
   **takvim kodu** girin (ör. `ailem-2026`), **Bağlan** deyin.
4. Diğer cihazda aynı config ve aynı takvim kodunu girin.

> **Güvenlik notu:** Firestore'un varsayılan test kuralları veritabanını herkese açık bırakır.
> Takviminizde çocuğunuzla ilgili bilgiler olduğu için, kullanacaksanız Firebase Authentication ile
> giriş zorunlu kılan bir güvenlik kuralı yazmanız veya en azından tahmin edilmesi zor bir takvim
> kodu seçmeniz önerilir. Senkronu hiç kurmazsanız veriler cihazınızdan dışarı çıkmaz.

## Yayına alma (isteğe bağlı)

Depoyu GitHub Pages ile yayınlarsanız telefondan da adres üzerinden açabilirsiniz:
**Settings → Pages → Source: main / root**. Uygulama tek dosya olduğu için ek yapılandırma gerekmez.
