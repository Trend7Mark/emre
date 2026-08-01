# Bitlis Eğitim İzleme — web uygulaması

`bitlis-egitim-olumsuz-haber-derlemesi.md` içeriğinin mobil öncelikli, filtrelenebilir web arayüzü.

**Derleme adımı yok, bağımlılık yok, sunucu tarafı kod yok.** Tamamen statik dosyalar.

---

## Çalıştırma

Tarayıcılar `file://` üzerinden JSON okumaya izin vermez. Bu yüzden bir yerel sunucu gerekir:

```bash
cd web
python3 -m http.server 8000
# → http://localhost:8000
```

Node tercih edilirse:

```bash
npx http-server web -p 8000
```

## Yayına alma

Klasörü olduğu gibi kopyalamak yeterli:

- **GitHub Pages** — depo ayarlarından `web/` klasörünü kaynak olarak seçin
- **Nginx / Apache** — klasörü doküman köküne koyun, ek yapılandırma gerekmez
- **Kurum içi sunucu** — statik dosya sunan herhangi bir dizin

HTTPS üzerinden sunulduğunda uygulama telefona **ana ekrana eklenebilir** (PWA) ve çevrimdışı çalışır.

---

## Dosya düzeni

```
web/
├── index.html                 arayüz iskeleti
├── css/styles.css             tüm stiller (açık/koyu tema)
├── js/app.js                  filtreleme, arama, detay, çizim
├── data/
│   ├── kayitlar.json          haber kayıtları  ← düzenlenecek dosya
│   └── gostergeler.json       istatistiksel göstergeler
├── icons/                     PWA simgeleri
├── manifest.webmanifest       PWA tanımı
└── sw.js                      çevrimdışı önbellek
```

---

## Yeni kayıt ekleme

`data/kayitlar.json` içindeki `kayitlar` dizisine bir nesne ekleyin. Arayüz kendini otomatik günceller.

```json
{
  "id": "benzersiz-kisa-ad",
  "baslik": "Haber başlığı",
  "ozet": "Kartta görünecek 1-2 cümlelik özet.",
  "tarih": "2026-08-15",
  "tarihKesin": true,
  "tarihNotu": "İsteğe bağlı açıklama",
  "kategori": "siddet",
  "ilce": ["Tatvan"],
  "durum": "iddia",
  "etiketler": ["etiket1", "etiket2"],
  "detay": ["Birinci paragraf.", "İkinci paragraf."],
  "alintilar": [{ "soz": "Alıntı metni", "kaynak": "Kim söyledi" }],
  "kaynaklar": [{ "ad": "Yayın adı", "url": "https://…", "yerel": true }]
}
```

### Alan kuralları

| Alan | Kural |
|---|---|
| `id` | Benzersiz olmalı. Derin bağlantı adresi olur: `index.html#id` |
| `tarih` | `YYYY-AA-GG` veya tarih bilinmiyorsa `null` (kayıt listenin sonuna düşer) |
| `tarihKesin` | `false` ise kartta "Ay Yıl" biçiminde ve italik gösterilir |
| `kategori` | `kategoriler` dizisindeki bir `id` olmalı |
| `ilce` | `ilceler` dizisindeki değerlerden oluşan dizi |
| `durum` | `durumlar` dizisindeki bir `id` olmalı |
| `yerel` | Kaynak Bitlis yerel basınıysa `true` — arayüzde "YEREL" rozetiyle işaretlenir |
| `alintilar` | İsteğe bağlı, atlanabilir |

### Doğrulama düzeyleri

Bu alan editoryal olarak en önemli alandır. İddia ile kesinleşmiş kararı ayırır:

| `durum` | Anlamı |
|---|---|
| `yargi-karari` | Mahkeme kararına dayanır |
| `dogrulandi` | Bağımsız en az iki yayın organında yer aldı |
| `tek-kaynak` | Tek yayın organı, teyit edilmedi |
| `iddia` | Bir kişi/kurumun öne sürdüğü, resmî olarak doğrulanmamış iddia |
| `gorus` | Köşe yazısı — haber değil |
| `istatistik` | TÜİK veya bakanlık verisi |

### Değişiklik sonrası

`sw.js` içindeki `ONBELLEK` sabitini artırın (`bitlis-egitim-v1` → `v2`), yoksa daha önce siteyi
açmış cihazlar eski veriyi önbellekten okumaya devam eder.

Veri bütünlüğünü kontrol etmek için:

```bash
node -e "
const k=require('./web/data/kayitlar.json');
const kat=new Set(k.kategoriler.map(x=>x.id)), dur=new Set(k.durumlar.map(x=>x.id)), il=new Set(k.ilceler);
let h=0;
for(const r of k.kayitlar){
  if(!kat.has(r.kategori)){console.log('kategori hatalı:',r.id);h++}
  if(!dur.has(r.durum)){console.log('durum hatalı:',r.id);h++}
  for(const i of r.ilce||[]) if(!il.has(i)){console.log('ilçe hatalı:',r.id,i);h++}
  if(!(r.kaynaklar||[]).length){console.log('kaynaksız:',r.id);h++}
}
console.log(h?('HATA: '+h):'Tüm doğrulamalar geçti');
"
```

---

## Arayüz özellikleri

- **Akış** — kronolojik kart listesi; kategori çipleri, ilçe/doğrulama seçimleri, sıralama ve tam metin arama
- **Arama** — Türkçe aksan duyarsız (`komur` yazınca `kömür` bulunur); başlık, özet, detay, etiket, kaynak ve alıntılarda arar
- **Göstergeler** — yapısal istatistikler, kıyas çubuklarıyla
- **Yöntem** — doğrulama düzeyi açıklamaları, başka ile ait olduğu için çıkarılan haberler, kapsanamayan başlıklar, kaynak dağılımı
- Açık/koyu tema (sistem tercihini izler, elle değiştirilebilir; seçim `localStorage`'a yazılır)
- Derin bağlantı: `index.html#kayit-id` doğrudan o kaydın detayını açar
- Klavye ve ekran okuyucu desteği; `Esc` detayı kapatır
- 320 piksel genişliğe kadar yatay taşma yok

---

## Editoryal not

Bu pano bir haber yayını değil, kaynaklı bir izleme derlemesidir. Kayıtların bir kısmı **iddia**
niteliğindedir. Kamuya açık bir adreste yayınlamadan önce:

- Adı geçen gerçek kişi ve kurumlara ilişkin iddiaların doğrulama rozetinin doğru olduğunu teyit edin
- Bir künye ve düzeltme/iletişim yolu ekleyin
- Bir kaydın dayanağı ortadan kalkarsa (haber kaldırıldı, iddia yalanlandı) kaydı silmek yerine
  `durum` alanını güncelleyip `detay` içine düzeltme notu ekleyin — izlenebilirlik korunur

Yerel haber siteleri içeriği zaman içinde kaldırabiliyor. Kalıcılık için kaynak bağlantılarının
`web.archive.org` kopyalarını almanız önerilir.
