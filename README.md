# Basın Masası — MEM Haber Metni Yazım Uygulaması

İl ve İlçe Millî Eğitim Müdürlüklerinin Basın ve Halkla İlişkiler birimleri için yapay zekâ destekli haber yazım uygulaması.

Personel olayı birkaç cümleyle not olarak yazar. Yapay zekâ bu notlardan kurumun yerleşik üslubuyla şunları hazırlar:

- **Web haberi:** başlık, 3 alternatif başlık, spot, ara başlıklı gövde, görsel altı yazısı, anahtar kelimeler
- **Sosyal medya metinleri:** X / NSosyal (280 karakter sayaçlı), Instagram, Facebook
- **Kontrol listesi:** metindeki isim, unvan, sayı ve tarihler ile yetkililerin ağzından yazılan alıntılar, yayından önce doğrulansın diye işaretlenir

## Üslup nasıl belirleniyor?

1. **Kurum Ayarları:** müdürün metindeki anılışı ("İl Millî Eğitim Müdürümüz …"), protokol listesi (anılış biçimi ve sırasıyla), kurumun sabit yazım kuralları, sosyal medya etiket ve hesapları.
2. **Üslup Örnekleri:** kurumun daha önce yayımladığı haberler. Yapay zekâ yeni haberleri bu örneklerin yapısıyla yazar (en yeni 8 örnek kullanılır). İlk örnek olarak Gümüşhane İl MEM'in [mesleki eğitim ziyareti haberi](https://gumushane.meb.gov.tr/www/valimiz-sayin-cevdet-atay-quotmesleki-egitim-ulkemizin-kalkinmasinda-ve-nitelikli-is-gucunun-yetistirilmesinde-lokomotif-gucturquot/icerik/2575/tr) yüklüdür.
3. **Haber türü şablonları:** ziyaret, toplantı, tören, başarı, proje, hizmet içi eğitim, protokol, duyuru ve genel haber.

Beğenilen bir haber, arşivden **"Üslup örneği yap"** düğmesiyle örneklere eklenebilir. Böylece uygulama zamanla kurumun üslubuna daha çok yaklaşır.

**Doğruluk kuralı:** Yapay zekâ, notlarda veya protokol listesinde olmayan kişi, sayı, tarih, kurum ya da proje adı eklemez. Bağlam ve kurumsal değerlendirme cümleleri ekleyebilir. Yetkili sözlerini notlardaki mesajdan genişletir ve her birini onay için kontrol listesine koyar.

## Kurulum (yerel bilgisayar)

Gereken: [Node.js](https://nodejs.org) 20 veya üzeri (LTS sürümü).

**Windows:** Klasördeki `baslat.bat` dosyasına çift tıklayın. İlk çalıştırmada paketler kurulur ve `.env` dosyası açılır; API anahtarınızı yazıp kaydedin.

**Elle kurulum:**

```bash
npm install
cp .env.example .env    # API anahtarınızı .env dosyasına yazın
npm start
```

Ardından tarayıcıda http://localhost:3000 adresini açın.

### Yapay zekâ sağlayıcısı

`.env` dosyasındaki `AI_PROVIDER` değeri:

| Değer | Açıklama |
|---|---|
| `claude` | Anthropic Claude. `ANTHROPIC_API_KEY` gerekir. Varsayılan model: `claude-opus-5-5` |
| `gemini` | Google Gemini. `GEMINI_API_KEY` gerekir (Google AI Studio'dan alınır) |
| `demo` | Anahtar gerektirmez; sahte metin üretir. Yalnızca arayüzü denemek içindir |

Anahtar tarayıcıya hiç gönderilmez; yalnızca yerel sunucuda kullanılır. Sunucu yalnızca `127.0.0.1` üzerinden dinler, yani ağdaki başka bilgisayarlardan erişilemez.

## Veriler

Kurum ayarları, üslup örnekleri ve haber arşivi `data/` klasöründe JSON dosyaları olarak tutulur. Yedek almak için bu klasörü kopyalamak yeterlidir. Klasör git'e eklenmez.

> **KVKK:** Notlar ve üslup örnekleri, seçilen yapay zekâ sağlayıcısına (yurt dışındaki sunuculara) gönderilir. Öğrenci adı gibi kişisel verileri yalnızca gerekli olduğunda ve veli izni varsa yazın.

## Proje yapısı

```
server/
  index.js          Express sunucusu ve API uçları
  prompt.js         Yapay zekâ talimatı ve çıktı şeması
  templates.js      Haber türü ve ton şablonları
  defaults.js       Varsayılan kurum ayarları ve ilk üslup örneği
  store.js          Dosya tabanlı depolama (ileride veritabanı)
  providers/        claude.js, gemini.js, demo.js
public/             Arayüz (HTML/CSS/JS, derleme gerektirmez)
test/               npm test
```

## Yol haritası

- [x] Yerel MVP: tek kurum, not → web + sosyal medya metni, arşiv, üslup örnekleri
- [ ] Belge yükleme (resmî yazı, Word, PDF) ve görselden bilgi çıkarma
- [ ] Kullanıcı girişi ve roller (yazar / onaylayıcı)
- [ ] Çok kurumlu yapı: il hesabının ilçe haberlerini görüp onaylaması
- [ ] Sunucuya taşıma (Docker), veritabanı, kullanım sınırları
