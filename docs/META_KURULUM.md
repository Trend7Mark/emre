# Facebook ve Instagram Bağlantı Rehberi (bir kerelik, ~30–45 dk)

Bu rehber, programın il müdürlüğü Facebook Sayfasına ve Instagram hesabına **ücretsiz** olarak
paylaşım yapabilmesi için gereken bir kerelik hazırlığı anlatır. Hiçbir adımda ödeme bilgisi istenmez.

> Meta, menü adlarını zaman zaman değiştirir. Ekranda birebir aynı yazıyı göremezseniz en yakın
> seçeneği kullanın; mantık aynıdır.

---

## Adım 1 – Instagram hesabını İşletme hesabı yapın ve Sayfaya bağlayın

Instagram API'si yalnızca **İşletme (Business)** veya **İçerik Üreticisi (Creator)** hesaplarında çalışır
ve hesabın bir **Facebook Sayfasına bağlı** olması gerekir.

1. Instagram uygulamasında il müdürlüğü hesabına girin.
2. **Profil → ☰ menü → Ayarlar ve gizlilik → Hesap türü ve araçlar → Profesyonel hesaba geç**
   (zaten profesyonelse bu adımı atlayın). Tür olarak **İşletme**yi seçin.
3. Bağlantı: Facebook'ta il müdürlüğü **Sayfasına geçiş yapın → Ayarlar → Bağlı hesaplar → Instagram → Hesabı bağla**.
   (Alternatif: Meta Business Suite → Ayarlar → Instagram hesapları.)

## Adım 2 – Meta geliştirici hesabı açın

1. <https://developers.facebook.com> adresine gidin, Sayfanın yöneticisi olan **kendi Facebook hesabınızla** giriş yapın.
2. **Başlayın** deyip kaydı tamamlayın (telefon/e-posta doğrulaması istenebilir).

## Adım 3 – Uygulama oluşturun

1. **Uygulamalarım → Uygulama Oluştur**.
2. Uygulama adı: örn. `BHI Paylasim`, iletişim e-postası: kurum e-postanız.
3. **Kullanım durumu (Use case)** ekranında şunları seçin:
   - **Sayfadaki her şeyi yönet** (*Manage everything on your Page*)
   - **Instagram'da mesajlaşma ve içerik yönetimi** (*Manage messaging & content on Instagram*)
     → kurulum yöntemi olarak **"Facebook girişi ile API kurulumu"** (*API setup with Facebook login*)
4. İşletme portföyü sorulursa **"Şimdilik işletme portföyü bağlama"** seçeneği yeterlidir.
5. Oluşturduktan sonra kullanım durumlarını **Özelleştir** diyerek aşağıdaki izinlerin eklendiğinden emin olun:

   | İzin | Ne için |
   |---|---|
   | `pages_show_list` | Yönettiğiniz sayfaları listelemek |
   | `pages_read_engagement` | Sayfa bilgilerini okumak |
   | `pages_manage_posts` | Facebook'a gönderi paylaşmak |
   | `instagram_basic` | Instagram hesabını tanımak |
   | `instagram_content_publish` | Instagram'a gönderi paylaşmak |
   | `business_management` | Sayfa bir işletme portföyündeyse erişmek |

6. Uygulama **Geliştirme (Development)** modunda kalabilir. Programı yalnızca siz (uygulamanın yöneticisi)
   kullanacağınız için **Meta incelemesine göndermenize ve yayınlamanıza gerek yoktur.**

## Adım 4 – Uygulama Kimliği ve Gizli Anahtarı alın

**Uygulama ayarları → Temel (App settings → Basic)** sayfasından:
- **Uygulama Kimliği (App ID)**
- **Uygulama Gizli Anahtarı (App Secret)** → "Göster"e tıklayın

Bu iki değeri bir kenara not edin (programa yalnızca bağlantı sırasında bir kez girilir, saklanmaz).

## Adım 5 – Erişim anahtarı (token) oluşturun

1. <https://developers.facebook.com/tools/explorer> (**Graph API Explorer**) adresini açın.
2. Sağ tarafta **Meta App** olarak az önce oluşturduğunuz uygulamayı seçin.
3. **User or Page** alanında **User Token** seçili olsun.
4. **Permissions** bölümünden Adım 3'teki altı izni ekleyin.
5. **Generate Access Token** düğmesine basın. Açılan pencerede:
   - il müdürlüğü **Facebook Sayfasını** seçin,
   - il müdürlüğü **Instagram hesabını** seçin,
   - tüm izinleri onaylayın.
6. Üstteki **Access Token** kutusundaki uzun metni kopyalayın.

> Bu anahtar ~1 saat geçerlidir; hemen Adım 6'ya geçin. Program onu, **süresi dolmayan** bir Sayfa
> anahtarına kendisi dönüştürür.

## Adım 6 – Programa bağlayın

1. `BHI-Paylasim.exe`'yi açın → **Ayarlar** sekmesi.
2. App ID, App Secret ve kopyaladığınız Access Token'ı yapıştırın → **Bağlan**.
3. Listeden il müdürlüğü sayfasını seçin → **Bu sayfayı kullan**.

Üst kısımda `Facebook: … · Instagram: @…` yazıyorsa her şey hazır. 🎉

Sayfa anahtarı Windows'un **Kimlik Bilgileri Yöneticisi**nde şifreli saklanır. Facebook şifrenizi
değiştirirseniz, uygulamanın izinlerini kaldırırsanız veya Sayfa yöneticiliğiniz biterse Adım 5–6'yı tekrarlayın.

---

## Sık karşılaşılan sorunlar

| Belirti | Çözüm |
|---|---|
| "Facebook Sayfası bulunamadı" | Adım 5'teki pencerede sayfayı seçmemiş olabilirsiniz. Token'ı yeniden oluşturun ve sayfayı işaretleyin. |
| Sayfa listede ama "bağlı Instagram İşletme hesabı yok" | Instagram hesabı İşletme değil veya Sayfaya bağlı değil (Adım 1). Token'ı oluştururken Instagram hesabını da seçin. |
| "Uygulamanın bu işlem için izni yok" (kod 10/200) | Adım 3–5'teki izinlerden biri eksik. İzinleri ekleyip token'ı yeniden oluşturun. |
| "Erişim anahtarı geçersiz" (kod 190) | Ayarlar → Bağlantıyı kaldır → Adım 5–6'yı tekrarlayın. |
| Instagram: "fotoğrafı indiremedi" | Geçici bir sorundur; birkaç dakika sonra tekrar deneyin. |
| Instagram günlük sınır | Instagram API ile 24 saatte en fazla 100 gönderi paylaşılabilir (il müdürlüğü için fazlasıyla yeterli). |
