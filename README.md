# Basın Masası — MEM Haber Metni Yazım Uygulaması

İl ve İlçe Millî Eğitim Müdürlüklerinin Basın ve Halkla İlişkiler birimleri için yapay zekâ destekli haber yazım uygulaması.

Personel olayı birkaç cümleyle not olarak yazar. Yapay zekâ bu notlardan kurumun yerleşik üslubuyla şunları hazırlar:

- **Web haberi:** 5 başlık seçeneği (beğenilmezse "Yeni başlıklar üret"), spot, ara başlıklı gövde, görsel altı yazısı, anahtar kelimeler
- **Editör önerileri:** metne eklenmesi, çıkarılması ya da düzeltilmesi önerilenler; çıkarma ve düzeltmeler tek tıkla uygulanır, düzenlenen metin "Metni yeniden değerlendir" ile tekrar incelenir
- **Sosyal medya metinleri:** X / NSosyal (280 karakter sayaçlı), Instagram, Facebook
- **Kontrol listesi:** metindeki isim, unvan, sayı ve tarihler ile yetkililerin ağzından yazılan alıntılar, yayından önce doğrulansın diye işaretlenir

## Üslup nasıl belirleniyor?

1. **Ayarlar → Kurum Ayarları:** müdürün metindeki anılışı ("İl Millî Eğitim Müdürümüz …"), protokol listesi (anılış biçimi ve sırasıyla), kurumun sabit yazım kuralları, sosyal medya etiket ve hesapları.
2. **Üslup Örnekleri:** kurumun daha önce yayımladığı haberler. Yapay zekâ yeni haberleri bu örneklerin yapısıyla yazar (en yeni 8 örnek kullanılır). İlk örnek olarak Gümüşhane İl MEM'in [mesleki eğitim ziyareti haberi](https://gumushane.meb.gov.tr/www/valimiz-sayin-cevdet-atay-quotmesleki-egitim-ulkemizin-kalkinmasinda-ve-nitelikli-is-gucunun-yetistirilmesinde-lokomotif-gucturquot/icerik/2575/tr) yüklüdür.
3. **Haber türü şablonları:** ziyaret, toplantı, tören, başarı, proje, hizmet içi eğitim, protokol, duyuru ve genel haber.

Beğenilen bir haber, arşivden **"Üslup örneği yap"** düğmesiyle örneklere eklenebilir. Böylece uygulama zamanla kurumun üslubuna daha çok yaklaşır.

**Doğruluk kuralı:** Yapay zekâ, notlarda veya protokol listesinde olmayan kişi, sayı, tarih, kurum ya da proje adı eklemez. Bağlam ve kurumsal değerlendirme cümleleri ekleyebilir. Yetkili sözlerini notlardaki mesajdan genişletir ve her birini onay için kontrol listesine koyar.

## Kurulum (Windows programı)

1. **[İndirme sayfasından](https://github.com/Trend7Mark/emre/releases/latest)** birini indirin:
   - `BasinMasasi-Kurulum-….exe`: bilgisayara kurar, masaüstüne kısayol ekler ve **kendini otomatik günceller** (önerilen)
   - `BasinMasasi-Tasinabilir-….exe`: kurulum gerektirmez, çift tıklayınca açılır; otomatik güncellenmez
2. Windows "bilinmeyen yayımcı" uyarısı verirse **Ek bilgi → Yine de çalıştır**'a tıklayın. Program dijital olarak imzalı olmadığı için bu uyarı çıkar.
3. İlk açılışta program API anahtarını sorar. Claude ya da Gemini anahtarınızı yapıştırın; hangisi olduğu otomatik anlaşılır. Anahtar bir kez girilir, program bir daha sormaz.

**Güncellemeler:** Kurulum sürümü her açılışta yeni sürüm olup olmadığına bakar; varsa arka planda indirir ve "Yeniden başlat" diye sorar. Pencere başlığında kullanılan sürüm yazar.

Program tarayıcı ya da ağ portu kullanmaz; kendi penceresinde çalışır. Bu yüzden kurum bilgisayarlarındaki proxy ayarlarından etkilenmez. İnternet yalnızca yapay zekâya istek gönderirken kullanılır.

### Yapay zekâ sağlayıcısı

| Seçenek | Açıklama |
|---|---|
| Claude (Anthropic) | Anahtar: [console.anthropic.com](https://console.anthropic.com/settings/keys). Varsayılan model: `claude-opus-5-5` |
| Gemini (Google) | Anahtar: [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Varsayılan model: `gemini-2.5-pro` |
| Demo | Anahtar gerektirmez; sahte metin üretir. Yalnızca programı denemek içindir |

**Bağlantıyı test et** düğmesi anahtarı ve ağ bağlantısını sınar; sorun varsa nedenini yazar. Program yapay zekâya Windows'un ağ ayarlarıyla (proxy ve kurum sertifikaları dahil) bağlanır.

İki anahtar da girilebilir. **En son girilen anahtar varsayılan olur**; **Ayarlar → Yapay Zekâ** bölümünden "Bunu kullan" ile diğerine geçilebilir ya da anahtar silinebilir. Anahtarlar yalnızca bu bilgisayarda, Windows kullanıcı hesabına özel şifrelenerek saklanır.

## Veriler

Kurum ayarları, üslup örnekleri ve haber arşivi `%APPDATA%\Basın Masası\veri` klasöründe JSON dosyaları olarak tutulur. Yedek almak için bu klasörü kopyalamak yeterlidir.

> **KVKK:** Notlar ve üslup örnekleri, seçilen yapay zekâ sağlayıcısına (yurt dışındaki sunuculara) gönderilir. Öğrenci adı gibi kişisel verileri yalnızca gerekli olduğunda ve veli izni varsa yazın.

## Geliştirme

```bash
npm install
npm start          # masaüstü programını geliştirme kipinde açar
npm test
npm run web        # aynı uygulamayı tarayıcıdan kullanmak için (http://127.0.0.1:3000)
```

Yeni sürüm yayımlamak için `package.json`'daki `version` yükseltilip gönderilir; kurulu programlar bu sürümü kendiliğinden alır. Windows kurulum dosyaları, her gönderimde GitHub Actions'ta (`.github/workflows/windows-program.yml`) derlenip indirme sayfasına eklenir. Windows bilgisayarda elle derlemek için: `npm run dist:win`.

## Proje yapısı

```
electron/main.js    Masaüstü programı (pencere, app:// protokolü, anahtar şifreleme)
server/
  api.js            Tüm işlevler (masaüstü ve web sürümü ortak kullanır)
  anahtarlar.js     API anahtarlarının saklanması
  index.js          Web kipi sunucusu (ileride kurum sunucusu)
  prompt.js         Yapay zekâ talimatı ve çıktı şeması
  templates.js      Haber türü ve ton şablonları
  defaults.js       Varsayılan kurum ayarları ve ilk üslup örneği
  store.js          Dosya tabanlı depolama (ileride veritabanı)
  providers/        claude.js, gemini.js, demo.js
public/             Arayüz (HTML/CSS/JS)
test/               npm test
```

## Yol haritası

- [x] Yerel MVP: tek kurum, not → web + sosyal medya metni, arşiv, üslup örnekleri
- [ ] Belge yükleme (resmî yazı, Word, PDF) ve görselden bilgi çıkarma
- [ ] Kullanıcı girişi ve roller (yazar / onaylayıcı)
- [ ] Çok kurumlu yapı: il hesabının ilçe haberlerini görüp onaylaması
- [x] Windows masaüstü programı
- [ ] Web sürümü: sunucuya taşıma, veritabanı, kullanım sınırları
