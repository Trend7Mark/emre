const test = require('node:test');
const assert = require('node:assert/strict');
const KY = require('./load.js');

const ids = (s, o) => KY.lintTDK(s, o).map((i) => i.id);
const fixed = (s, id) => KY.hepsiniUygula(s, KY.lintTDK(s).filter((i) => !id || i.id === id));

// [girdi, beklenen kural, düzeltilmiş metin]
const YAKALANMALI = [
  ['Toplantı 17:30 da yapılacak.', 'tdk.saat', 'Toplantı 17.30 da yapılacak.'],
  ['Oran 25% olarak belirlendi.', 'tdk.yuzde', 'Oran %25 olarak belirlendi.'],
  ['Oran % 25 olarak belirlendi.', 'tdk.yuzde', 'Oran %25 olarak belirlendi.'],
  ['8.inci maddeye göre', 'tdk.sira', '8’inci maddeye göre'],
  ['1985te doğdu', 'tdk.kesme.sayi', '1985’te doğdu'],
  ['Katılım 1500 kişi oldu.', 'tdk.binlik', 'Katılım 1.500 kişi oldu.'],
  ['Katılım 28434250310500 kişi', 'tdk.binlik', 'Katılım 28.434.250.310.500 kişi'],
  ['Tarih 01/09/2019 olarak', 'tdk.tarih', 'Tarih 01.09.2019 olarak'],
  ['Tarih 1.9.2019 olarak', 'tdk.tarih', 'Tarih 01.09.2019 olarak'],
  ['5 ekim 2023 tarihinde', 'tdk.ay', '5 Ekim 2023 tarihinde'],
  ['Sayın bakan, görüşme', 'tdk.sayin', 'Sayın Bakan, görüşme'],
  ['Millî Eğitim Bakanlığı’na yazı', 'tdk.kesme.kurum', 'Millî Eğitim Bakanlığına yazı'],
  ["Ankara Valiliği'nden gelen", 'tdk.kesme.kurum', 'Ankara Valiliğinden gelen'],
  ['Ankarada toplantı', 'tdk.kesme.ozel', 'Ankara’da toplantı'],
  ['Türkiyenin geleceği', 'tdk.kesme.ozel', 'Türkiye’nin geleceği'],
  ['Yazınızla müdürlüğümüz bilgilendirildi', 'tdk.kurumbuyuk', 'Yazınızla Müdürlüğümüz bilgilendirildi'],
  ['hiç bir şey yok', 'tdk.yazim', 'hiçbir şey yok'],
  ['herşey tamam', 'tdk.yazim', 'her şey tamam'],
  ['Hiç bir kayıt', 'tdk.yazim', 'Hiçbir kayıt'],
  ['yada olmaz', 'tdk.yazim', 'ya da olmaz'],
  ['sözkonusu yazı', 'tdk.yazim', 'söz konusu yazı'],
  ['kordinasyon sağlanmıştır', 'tdk.yazim', 'koordinasyon sağlanmıştır'],
  ['gidip te gelmek', 'tdk.bagac', 'gidip de gelmek'],
  ['kitaplar, defterler vb işler', 'tdk.kisaltma', 'kitaplar, defterler vb. işler'],
  ['kelime ,devam', 'tdk.noktalama.once', 'kelime,devam'],
  ['kelime,devam', 'tdk.noktalama.sonra', 'kelime, devam'],
  ['iki  boşluk', 'tdk.bosluk', 'iki boşluk'],
  ['İlk cümle. ikinci cümle.', 'tdk.cumlebasi', 'İlk cümle. İkinci cümle.'],
  ['tamam bu yazı', 'tdk.cumlebasi', 'Tamam bu yazı'],
  ['unvanı belirtilen kişi', 'tdk.2023', null],
  ['resmi yazışma kuralları', 'tdk.duzeltme', 'resmî yazışma kuralları'],
  ['milli eğitim', 'tdk.duzeltme', 'millî eğitim'],
  ['olması halinde', 'tdk.duzeltme', 'olması hâlinde'],
  ['25 Kg ve 3 mt', 'tdk.birim', '25 kg ve 3 m'],
  ['mail gönderildi', 'tdk.yabanci', null],
  ['Bu [konu] için', 'tdk.yertutucu', null],
];
for (const [girdi, id, sonuc] of YAKALANMALI) {
  test(`yakalar: ${id} ← “${girdi}”`, () => {
    assert.ok(ids(girdi).includes(id), `${id} bekleniyordu, bulunanlar: ${ids(girdi)}`);
    if (sonuc !== null) assert.equal(fixed(girdi, id), sonuc);
  });
}

// Yanlış alarm vermemeli
const TEMIZ = [
  'T.C. Kimlik No: 12345678901 olan vatandaş',
  '2876 sayılı Kanun ile 5442 sayılı İl İdaresi Kanunu’nun 11’inci maddesi',
  '2023 yılında ve 1985’te yapılan çalışmalar',
  'E-67915368-903.07.02-4752 sayılı yazı',
  'Resmî Gazete’de 27738 sayı ile yayımlandı.',
  'Madde 15. madde gereğince işlem yapılır.',
  'Dr. Ahmet YILMAZ ile görüşüldü, vb. işlemler yapıldı.',
  'Toplantı Ankara’da, saat 17.30’da yapılacaktır.',
  'Millî Eğitim Bakanlığına bağlı okullar',
  'Bursalı ve Konyalı öğrenciler Ankaralı idarecilerle görüştü.',
  'Posta kodu 06100, telefon 0312 000 00 00.',
  'Bilgi için www.meb.gov.tr veya ornek@meb.gov.tr adresine bakınız.',
  'Gereğini arz ederim.',
  'Hizmet 29 Ekim 1923 tarihinden beri sürmektedir.',
  'Atatürk’ün ilke ve inkılapları',
  'Bu nedenle %25 oranında artış öngörülmektedir.',
  'Vana açıldı. Ordu geldi. Kilise yıkıldı.',
];
for (const girdi of TEMIZ) {
  test(`yanlış alarm yok: “${girdi}”`, () => {
    assert.deepEqual(KY.lintTDK(girdi).filter((i) => i.sev !== 'info').map((i) => `${i.id}:${i.bul}`), []);
  });
}

test('hepsiniUygula çakışmasız ve sondan başa uygular', () => {
  const s = 'Toplantı 17:30 da,saat 14:00.Sayın bakan geldi';
  const out = fixed(s);
  assert.equal(out, 'Toplantı 17.30 da, saat 14.00. Sayın Bakan geldi');
  assert.equal(KY.lintTDK(out).filter((i) => i.sev === 'warn').length, 0, 'düzeltilmiş metinde uyarı kalmamalı');
});
test('yer tutucu hatadır ve otomatik düzeltilmez', () => {
  const i = KY.lintTDK('Konu [gg.aa.yyyy] hakkında ...').filter((x) => x.id === 'tdk.yertutucu');
  assert.equal(i.length, 2);
  assert.ok(i.every((x) => x.sev === 'error' && x.repl === undefined));
});
test('TDK 2023: unvan→ünvan kök değişir, ekler korunur', () => {
  assert.equal(fixed('Unvanı ve unvansız', 'tdk.2023'), 'Ünvanı ve ünvansız');
  assert.equal(fixed('yeşilbiber ve yeşilzeytin', 'tdk.2023'), 'yeşil biber ve yeşil zeytin');
  assert.equal(fixed('mentorluk', 'tdk.2023'), 'mentörluk');
});
test('konu için paragraf kuralı kapatılabilir', () => {
  assert.ok(!ids('personel atama', { paragraf: false }).includes('tdk.cumlebasi'));
  assert.ok(ids('personel atama').includes('tdk.cumlebasi'));
});

test('küçük harfli kurum adı büyük harfe çevrilir (TDK büyük harfler 18-21)', () => {
  assert.equal(fixed('il milli eğitim müdürlüğü ve resmi gazete', 'tdk.kurumadi'), 'İl Millî Eğitim Müdürlüğü ve Resmî Gazete');
  assert.equal(fixed('türkiye büyük millet meclisi', 'tdk.kurumadi'), 'Türkiye Büyük Millet Meclisi');
  assert.equal(ids('İl Millî Eğitim Müdürlüğü ve Resmî Gazete').includes('tdk.kurumadi'), false);
  assert.equal(KY.lintTDK('il milli eğitim müdürlüğü').filter((i) => i.id === 'tdk.kurumadi').length, 1, 'iç içe geçen kalıplar çift sayılmaz');
});

test('cümle başında büyük harfle (İ, I) başlayan hatalı kelimeler de yakalanır', () => {
  assert.equal(fixed('İnsiyatif kullanıldı', 'tdk.yazim'), 'İnisiyatif kullanıldı');
  assert.equal(fixed('İçerde bekleyin', 'tdk.yazim'), 'İçeride bekleyin');
  assert.ok(ids('Yada bu yada şu').filter((i) => i === 'tdk.yazim').length === 2);
});
