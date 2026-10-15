# BHİ Paylaşım – Tek Tıkla Sosyal Medya Paylaşımı

Basın ve Halkla İlişkiler birimi için geliştirilmiş, **tek bilgisayarda tek kullanıcı** tarafından
kullanılan, **ücretsiz** bir paylaşım aracı. Bir kez fotoğraf(lar) ve metin girilir, **Paylaş**'a basılır:

| Platform | Nasıl | Maliyet |
|---|---|---|
| **Facebook Sayfası** | Tam otomatik (Meta Graph API) | Ücretsiz |
| **Instagram İşletme hesabı** | Tam otomatik, çoklu fotoğrafta albüm (carousel) | Ücretsiz |
| **X (Twitter)** | Yarı otomatik: paylaşım penceresi metin yazılı açılır, fotoğraflar <kbd>Ctrl</kbd>+<kbd>V</kbd> ile eklenip **Gönder**'e basılır | Ücretsiz |

> **X neden yarı otomatik?** X, Şubat 2026'dan itibaren yeni geliştiriciler için ücretsiz API'yi kaldırdı;
> her gönderi ücretli ve ön ödemeli kredi gerektiriyor. Tarayıcıyı robotla yönetmek ise X kurallarına aykırı
> olduğu için kurum hesabını riske atar. Bu yüzden X adımı ~10 saniyelik bir onayla tamamlanır.

## Özellikler

- Sürükle-bırak ile **10 fotoğrafa kadar** yükleme, sıralama, kaldırma
- Tek metin; istenirse **X için ayrı kısa metin**
- Canlı sayaçlar: X 280 karakter (bağlantı = 23, emoji = 2 sayılır), Instagram 2200 karakter / 30 hashtag
- Instagram'ın kabul etmediği oranlardaki fotoğraflar (ör. dikey 9:16, panorama) **kırpılmadan**
  kenarlarına beyaz boşluk eklenerek uygun hale getirilir; telefon fotoğraflarının yönü düzeltilir
- Her platformun sonucu ayrı gösterilir; bir platformdaki hata diğerlerini durdurmaz
- **Geçmiş**: tüm paylaşımlar, bağlantıları ve fotoğraf klasörleriyle saklanır
- Facebook erişim anahtarı Windows **Kimlik Bilgileri Yöneticisi**nde şifreli tutulur
- Program yalnızca `127.0.0.1` üzerinden çalışır; ağdaki başka bilgisayarlardan ve başka web sitelerinden erişilemez

## Kurulum

### 1. Programı edinin (Python kurmanıza gerek yok)

GitHub'da depo sayfasında **Actions → "Windows .exe derle" → en son başarılı çalıştırma → Artifacts → BHI-Paylasim**
dosyasını indirin, zip'ten çıkan `BHI-Paylasim.exe`'yi istediğiniz klasöre koyun.

> İlk açılışta Windows SmartScreen "tanınmayan uygulama" uyarısı verebilir (dijital imza olmadığı için):
> **Ek bilgi → Yine de çalıştır**. Bilgi İşlem birimi .exe çalıştırmayı engelliyorsa onlardan izin isteyin.

Alternatif: Python 3.11+ kurulu bir bilgisayarda `build.bat` çalıştırılarak `dist\BHI-Paylasim.exe` üretilebilir.

### 2. Facebook / Instagram bağlantısı (bir kerelik)

Adım adım anlatım: **[docs/META_KURULUM.md](docs/META_KURULUM.md)**

## Kullanım

1. `BHI-Paylasim.exe`'ye çift tıklayın. Siyah bir pencere açılır (kapatmayın) ve program tarayıcıda açılır.
2. Fotoğrafları sürükleyin, metni yazın, platformları işaretleyin, **Paylaş**.
3. Facebook ve Instagram otomatik paylaşılır. X penceresi metin hazır şekilde açılır, fotoğraf klasörü de gösterilir:
   fotoğrafları X'e sürükleyin (veya programdaki "kopyala" düğmesi + <kbd>Ctrl</kbd>+<kbd>V</kbd>) ve **Gönder**.
4. Programı kapatmak için siyah pencereyi kapatın.

## Veriler nerede?

`%LOCALAPPDATA%\BHI-Paylasim\`
- `paylasimlar\` – her paylaşımın fotoğrafları ve metni (tarih-saat adlı klasörler)
- `gecmis.db` – paylaşım geçmişi
- `ayarlar.json` – bağlı sayfa/hesap adları (anahtar burada **değil**, Windows Kimlik Bilgileri Yöneticisi'nde)

## Geliştirme

```bash
python -m venv .venv && .venv/Scripts/activate      # Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
python -m pytest -q        # testler (gerçek Meta API'sine bağlanmaz)
python -m paylasim         # http://127.0.0.1:8765
```

| Dosya | Görev |
|---|---|
| `paylasim/app.py` | Yerel web sunucusu ve API uçları |
| `paylasim/publisher.py` | Paylaşım akışı ve doğrulamalar |
| `paylasim/graph.py` | Meta Graph API istemcisi (Facebook + Instagram) |
| `paylasim/images.py` | Fotoğrafları platform kurallarına uygun hale getirme |
| `paylasim/text.py` | X karakter sayımı, X paylaşım penceresi adresi |
| `paylasim/static/` | Arayüz (HTML/CSS/JS) |

Instagram, fotoğrafları bir internet adresinden çeker. Ayrı sunucu gerekmesin diye fotoğraflar önce
Facebook Sayfasına **yayınlanmamış** olarak yüklenir ve Facebook'un barındırdığı adres Instagram'a verilir.

## Yol haritası

- [ ] Zamanlanmış paylaşım
- [ ] Video / Reels desteği
- [ ] Taslak kaydetme ve şablonlar (hazır hashtag setleri)
- [ ] X'in "kamu yararı" ücretsiz API başvurusu kabul edilirse X'i tam otomatiğe çevirme
