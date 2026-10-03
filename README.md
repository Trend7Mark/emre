# Resmî Yazışma Hazırlama

Kamu kurum ve kuruluşlarında resmî yazı hazırlamak ve denetlemek için, **tamamen tarayıcıda çalışan** bir web uygulaması.
İki kaynağa dayanır:

1. **Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik** (Cumhurbaşkanı Kararı 9/6/2020, Sayı: 2646; RG 10/6/2020-31151)
2. **TDK Yazım Kuralları** (2023 değişiklikleri dâhil) — Kemal Deniz derlemesi

Yazıyı formdan doldurursunuz; uygulama Yönetmelik'in sayfa düzenini (A4, 1,5 cm yazı alanı, başlık, sayı, tarih, konu,
muhatap, ilgi, metin, imza, ek, dağıtım, olur, paraf, iletişim/doğrulama alt bilgisi, sayfa numarası) otomatik kurar,
Yönetmelik ve TDK kurallarına göre denetler ve çıktıyı PDF/yazıcıya verir.

> **Önemli:** Bu araç bir **taslak hazırlayıcıdır**, EBYS'nin yerini tutmaz. Güvenli elektronik imza, kayıt numarası,
> belge doğrulama kodu, karekod, üstveri ve gönderme işlemleri EBYS'de yapılır (Yön. m.4, 23, 28–30).
> “EBYS'ye aktar” sekmesi biçimlenmiş alan metinlerini kopyalamanız içindir.

## Çalıştırma

Derleme veya sunucu gerekmez. `index.html` dosyasını Chrome / Edge / Firefox / Safari'de açmanız yeterlidir (çevrimdışı çalışır;
ağa hiçbir şey göndermez). Güncel tarayıcı gerekir (Chrome/Edge 111+, Firefox 126+, Safari 16.4+).

```bash
npm start      # isterseniz yerel sunucu: http://localhost:8080
npm test       # birim testleri (Node 20+)
```

Kurum içi bir sunucuda veya GitHub Pages'te yayınlamak için klasörü olduğu gibi statik olarak sunmanız yeterlidir.

## Neler yapar?

| | |
|---|---|
| **Canlı A4 önizleme** | Yönetmelik düzeniyle; paragrafı sayfa sonunda böler, imzayı son paragrafla birlikte tutar, çok sayfada sayı/tarih/konu/muhatap/ilgiyi yalnız ilk sayfaya, imza/ek/dağıtımı son sayfaya, iletişim ve `Sayfa x/y` bilgisini her sayfaya koyar. Önizlemede bir bölüme tıklamak ilgili alana götürür. |
| **Otomatik biçimlendirme** | Başlık (T.C. + İDARE + Birim), `E-DETSİS-dosya planı-kayıt` sayısı, tarih, Konu (baş harfler büyük, sonda nokta yok, orta hizayı geçmez), muhatap (BÜYÜK + yönelme eki: `ANKARA VALİLİĞİNE`), ilgi (tarih sırası, a) b) harfleri, “… tarihli ve … sayılı …”), ad **SOYAD**, `Vali a.` / `Genel Müdür V.` imzası, “Ek konulmadı”, Gereği/Bilgi dağıtımı, OLUR bloğu. |
| **Yönetmelik denetimi** | Eksik/hatalı alanlar, e-imzalı belgede imza ibaresi yasağı (m.17/3), `Özel` ve üstü gizlilikte elektronik ortam yasağı (m.25/2), GÜNLÜDÜR için süre, dağıtım–muhatap tutarlılığı, yazışma yönüne göre kapanış ibaresi (arz / rica / arz ve rica / Saygılarımla…), punto sınırları, iletişim bilgileri, kısaltma ilk kullanımı… |
| **TDK denetimi** | Cümle başı büyük harf, boşluk/noktalama, kesme işareti (özel ad, sayı, kurum adı), `8.inci`→`8’inci`, `%25`, `17.30`, `01.09.2019`, ay adı büyük harfi, 1.452 binlik gruplama, ayrı/bitişik yazım (`hiçbir`, `her şey`, `ya da`, `söz konusu`…), `resmî`/`millî`/`hâl`, kısaltmalar, kurum adlarının büyük harfi, **TDK 2023 değişiklikleri** (`unvan→ünvan`, `yeşilbiber→yeşil biber`…). Her bulgunun yanında kural referansı ve tek tıkla **Düzelt** / **Tümünü düzelt** (+ **Geri al**) vardır. |
| **Taslak şablonlar** | Bilgi/belge talebi (günlü), cevap, tekit (m.34), uygun yazılmayan belge uyarısı (m.35), gerçek kişiye cevap, olur teklifi. |
| **Kurum profili** | Başlık, logo, DETSİS, iletişim ve imza bilgilerini bir kez kaydedin; yeni belgeler bunlarla başlar. |
| **Kaydet / Aç** | Belgeyi `.json` olarak indirin/yükleyin. Taslak ayrıca tarayıcıda otomatik saklanır. Veriler yalnız sizin tarayıcınızdadır. |
| **Yazdır / PDF** | Tarayıcının yazdır penceresinden “PDF olarak kaydet”. Zorunlu hâl/olağanüstü durumda (Z/O) paraflı ve parafsız nüsha için “Paraflı nüsha” seçeneği vardır. |

## Kural kapsamı ve sınırlar

Her kuralın hangi madde/başlık altında, **otomatik uygulanıp** uygulanmadığı, **denetlenip** denetlenmediği ya da **EBYS/elle** bırakıldığı
uygulamanın içinde “Kurallar” sekmesinde listelidir.

- Yönetmeliğin **Örnek 1–24 görselleri** (Ekler) PDF'te bulunmadığından yerleşim madde metinlerinden kurulmuştur; etiket genişliği,
  boşluk ölçüsü gibi ince ayrıntılarda örneklerden sapma olabilir. Örnek sayfaları paylaşılırsa birebir hizalanabilir.
- **TDK denetimi bir imla denetçisi/sözlük değildir**; yalnız kuralı net, belgelerde sık görülen durumları yakalar (yanlış alarmı
  azaltmak için `tests/lint.test.js` içinde “yanlış alarm vermemeli” örnekleri vardır). Son okuma imzalayanın sorumluluğundadır.
- Kaynaklarda **Yönetmelik “unvan”, TDK 2023 “ünvan”** yazar; uygulama TDK'yı esas alır ve farkı bildirir.
- Kaynaklarda tanımlı olmayan ayrıntılar (ör. gizlilik derecesinin sayfadaki yeri, başlığın kalın yazılması, “Sayfa 1/2” kalıbı)
  yaygın uygulamaya göre seçilmiştir ve arayüzde belirtilmiştir.
- Bilgi/belge/görüş talepleri için süreler (belge 5 iş günü, bilgi–görüş 15 iş günü, m.33) ve tekit/iade (m.34–35) bilgi olarak sunulur.

## Dosya yapısı

```
index.html          arayüz iskeleti
css/app.css         arayüz stilleri (açık/koyu tema)
css/paper.css       A4 kâğıt stilleri (Yönetmelik ölçüleri)
js/tr.js            Türkçe büyük/küçük harf, ad-soyad, ek uyumu, tarih
js/data.js          kural kataloğu, TDK 2023 tablosu, yazım hataları, şablonlar, boş belge
js/compose.js       ham form verisi → Yönetmelik'e uygun biçimlenmiş içerik
js/lint-tdk.js      TDK yazım denetimi (düzeltilebilir bulgular)
js/validate.js      Yönetmelik denetimi
js/render.js        bloklar → A4 sayfalar (sayfalama)
js/ui.js, app.js    form bağlama, paneller, durum, kayıt, yazdırma
tests/              node:test birim testleri (DOM gerektirmez)
```
