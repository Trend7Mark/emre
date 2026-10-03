const test = require('node:test');
const assert = require('node:assert/strict');
const KY = require('./load.js');

function belge(patch = {}) {
  const d = KY.bosBelge();
  const merge = (t, s) => { for (const k of Object.keys(s)) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) merge(t[k], s[k]); else t[k] = s[k]; } };
  merge(d, {
    meta: { yon: 'alt' },
    baslik: { s2: 'ankara valiliği', s3: 'il millî eğitim müdürlüğü' },
    sayi: { detsis: '67915368', dosya: '903.07.02', kayit: '4752' },
    tarih: { deger: '2026-10-03' },
    konu: 'personel atama talebi',
    muhatap: { ad: 'Ankara Valiliği' },
    metin: 'Okullarımızda görev yapan personelin atama işlemleri tamamlanmıştır.\nGereğini rica ederim.',
    imza: [{ ad: 'ahmet', soyad: 'yılmaz', unvan: 'müdür', tip: 'normal' }],
    iletisim: { adres: 'Atatürk Bulvarı No: 1', posta: '06100', tel: '(312) 000 00 00', eposta: 'a@b.gov.tr', kisiAd: 'Ayşe', kisiTel: '1' },
  }, {});
  merge(d, patch);
  return d;
}
const calistir = (d, ctx) => KY.validate(d, KY.compose(d), ctx || { sayfa: 1 });
const var_ = (r, ref, sev) => r.sonuclar.some((x) => x.ref.includes(ref) && (!sev || x.sev === sev));

test('eksiksiz belge: hata ve uyarı yok', () => {
  const r = calistir(belge());
  const kotu = r.sonuclar.filter((x) => x.sev === 'error' || x.sev === 'warn');
  assert.deepEqual(kotu.map((x) => `${x.ref}: ${x.msg}`), []);
});

test('compose: sayı, konu, muhatap, başlık biçimleri', () => {
  const c = KY.compose(belge({ konu: 'PERSONEL atama ve MEB talebi.', muhatap: { ad: 'Ankara Valiliği', birim: 'bilgi işlem şubesi' } }));
  assert.equal(c.sayi, 'E-67915368-903.07.02-4752');
  assert.equal(c.tarih, '03.10.2026');
  assert.deepEqual(c.baslik, ['T.C.', 'ANKARA VALİLİĞİ', 'İl Millî Eğitim Müdürlüğü']);
  assert.equal(c.konu, 'Personel Atama ve MEB Talebi');
  assert.deepEqual(c.muhatap, ['ANKARA VALİLİĞİNE', '(Bilgi İşlem Şubesi)']);
});

test('compose: ilgi tarih sırasına dizilir, harflenir, biçim m.16/6-7', () => {
  const c = KY.compose(belge({ ilgi: [
    { tur: 'belge', idare: 'Millî Eğitim Bakanlığı', tarih: '2026-09-20', sayi: 'E-1-903-2', belge: 'yazı' },
    { tur: 'belge', idare: '', tarih: '2026-08-01', sayi: 'E-2-903-3', belge: 'yazı' },
  ] }));
  assert.equal(c.ilgi[0].harf, 'a)');
  assert.equal(c.ilgi[0].metin, '01.08.2026 tarihli ve E-2-903-3 sayılı yazı.');
  assert.equal(c.ilgi[1].harf, 'b)');
  assert.equal(c.ilgi[1].metin, 'Millî Eğitim Bakanlığının 20.09.2026 tarihli ve E-1-903-2 sayılı yazısı.');
  assert.ok(c.auto.some((a) => /tarih sırasına/.test(a.msg)));
});
test('compose: tek ilgide harf yok; kişi başvurusu m.16/9; isimsiz m.16/10', () => {
  const tek = KY.compose(belge({ ilgi: [{ tur: 'basvuru', kisiAd: 'Ahmet', kisiSoyad: 'Yılmaz', tarih: '2026-09-01', belge: 'dilekçe' }] }));
  assert.equal(tek.ilgi[0].harf, '');
  assert.equal(tek.ilgi[0].metin, 'Ahmet YILMAZ’ın 01.09.2026 tarihli dilekçesi.');
  const isimsiz = KY.compose(belge({ ilgi: [{ tur: 'isimsiz' }] }));
  assert.equal(isimsiz.ilgi[0].metin, 'İsimsiz ve tarihsiz başvuru/dilekçe.');
});
test('compose: imza biçimleri m.17/9-11', () => {
  const c = KY.compose(belge({ imza: [
    { ad: 'ahmet', soyad: 'yılmaz', unvan: 'vali yardımcısı', tip: 'ae', makam: 'vali' },
    { ad: 'ali', soyad: 'kaya', unvan: '', tip: 'vekalet', makam: 'genel müdür' },
  ] }));
  assert.deepEqual(c.imza[0].satirlar, ['Ahmet YILMAZ', 'Vali a.', 'Vali Yardımcısı']);
  assert.deepEqual(c.imza[1].satirlar, ['Ali KAYA', 'Genel Müdür V.']);
  assert.equal(c.imzaSirasi[0].kaynak.ad, 'ali', 'iki imzada üst unvan (ilk girilen) sağa gelir');
});
test('compose: ek ve "Ek konulmadı" m.18/5', () => {
  const c = KY.compose(belge({ ek: { liste: [{ ad: 'liste', aciklama: '2 sayfa', gonderilmez: true }] } }));
  assert.equal(c.ek.liste[0].metin, 'Liste (2 sayfa)');
  assert.equal(c.ek.konulmadi, 'Ek konulmadı');
});

test('m.25/2: Özel ve üstü gizlilik elektronik ortamda hata; Hizmete Özel serbest', () => {
  assert.ok(var_(calistir(belge({ meta: { gizlilik: 'Özel' } })), 'm.25/2', 'error'));
  assert.ok(var_(calistir(belge({ meta: { gizlilik: 'Gizli' } })), 'm.25/2', 'error'));
  assert.ok(!var_(calistir(belge({ meta: { gizlilik: 'Hizmete Özel' } })), 'm.25/2', 'error'));
  assert.ok(!var_(calistir(belge({ meta: { gizlilik: 'Özel', ortam: 'Z' } })), 'm.25/2', 'error'));
});
test('m.26: GÜNLÜDÜR süre ister ve metinde geçmesini bekler', () => {
  assert.ok(var_(calistir(belge({ meta: { sureli: 'GUNLUDUR', sure: '' } })), 'm.26/1', 'error'));
  assert.ok(var_(calistir(belge({ meta: { sureli: 'GUNLUDUR', sure: '15.10.2026' } })), 'm.26/1', 'warn'));
  const ok = calistir(belge({ meta: { sureli: 'GUNLUDUR', sure: '15.10.2026' }, metin: '15.10.2026 tarihine kadar bildirilmesi hususunda gereğini rica ederim.' }));
  assert.ok(var_(ok, 'm.26/1', 'ok'));
});
test('m.16/12: kapanış ibaresi yazışma yönüne göre', () => {
  const metin = (son) => `Konu incelenmiştir.\n${son}`;
  assert.ok(!var_(calistir(belge({ meta: { yon: 'alt' }, metin: metin('Gereğini rica ederim.') })), 'm.16/12', 'warn'));
  assert.ok(var_(calistir(belge({ meta: { yon: 'alt' }, metin: metin('Gereğini arz ederim.') })), 'm.16/12', 'warn'));
  assert.ok(!var_(calistir(belge({ meta: { yon: 'ust' }, metin: metin('Bilgilerinize arz ederim.') })), 'm.16/12', 'warn'));
  assert.ok(var_(calistir(belge({ meta: { yon: 'ust' }, metin: metin('Gereğini rica ederim.') })), 'm.16/12', 'warn'));
  assert.ok(!var_(calistir(belge({ meta: { yon: 'dagitimli' }, metin: metin('Gereğini arz ve rica ederim.') })), 'm.16/12', 'warn'));
  assert.ok(!var_(calistir(belge({ meta: { yon: 'dagitimli' }, metin: metin('Gereğini arz/rica ederim.') })), 'm.16/12', 'warn'));
  assert.ok(!var_(calistir(belge({ meta: { yon: 'gercek' }, muhatap: { tur: 'kisi', kisiAd: 'Ali', kisiSoyad: 'Veli' }, metin: metin('Bilgilerinize sunulur.') })), 'm.16/12', 'warn'));
  assert.ok(!var_(calistir(belge({ meta: { yon: 'bakanlik' }, metin: metin('Rica ederim.') })), 'm.16/12', 'warn'));
  assert.ok(var_(calistir(belge({ meta: { yon: 'alt' }, metin: metin('Gereğini rica ederim') })), 'm.16/12', 'warn'), 'sonda nokta olmalı');
});
test('m.17/3: e-imzalı belgede imza alanında imza ibaresi hata', () => {
  assert.ok(var_(calistir(belge({ imza: [{ ad: 'Ali', soyad: 'Veli', unvan: 'Müdür (e-imzalıdır)', tip: 'normal' }] })), 'm.17/3', 'error'));
  assert.ok(!var_(calistir(belge({ meta: { ortam: 'Z' }, imza: [{ ad: 'Ali', soyad: 'Veli', unvan: 'Müdür (e-imzalıdır)', tip: 'normal' }] })), 'm.17/3', 'error'));
});
test('m.17: eksik imza bilgileri hata', () => {
  assert.ok(var_(calistir(belge({ imza: [{ ad: '', soyad: '', unvan: '', tip: 'normal' }] })), 'm.17/1', 'error'));
  assert.ok(var_(calistir(belge({ imza: [{ ad: 'Ali', soyad: 'Veli', unvan: 'Müdür', tip: 'ae', makam: '' }] })), 'm.17/9', 'error'));
  assert.ok(var_(calistir(belge({ imza: [{ ad: 'Ali', soyad: 'Veli', unvan: '', tip: 'vekalet', makam: '' }] })), 'm.17/10', 'error'));
});
test('m.11: sayı bileşenleri', () => {
  const r = calistir(belge({ sayi: { detsis: '', dosya: '', kayit: 'abc' } }));
  assert.ok(var_(r, 'm.11/1', 'error'));
  assert.equal(r.sonuclar.filter((x) => x.ref === 'm.11/1' && x.sev === 'error').length, 3);
  assert.ok(var_(calistir(belge({ sayi: { detsis: '123', dosya: '903.07.02', kayit: '' } })), 'm.11/1', 'warn'));
  assert.ok(var_(calistir(belge({ sayi: { kayit: '' } })), 'm.11/2', 'info'));
});
test('m.14/m.19: dağıtım ve muhatap tutarlılığı', () => {
  assert.ok(var_(calistir(belge({ dagitim: { geregi: ['A', 'B'] } })), 'm.14/6', 'error'));
  assert.ok(var_(calistir(belge({ muhatap: { tur: 'dagitim' }, dagitim: { geregi: ['A'] } })), 'm.14/6', 'warn'));
  const ok = calistir(belge({ meta: { yon: 'dagitimli' }, muhatap: { tur: 'dagitim' }, metin: 'Konu.\nGereğini arz ve rica ederim.', dagitim: { geregi: ['A', 'B'], bilgi: ['C'] } }));
  assert.ok(!ok.sonuclar.some((x) => x.sev === 'error' || x.sev === 'warn'));
});
test('m.16/9: muhatap başvuru sahibiyse ilgide ad yazılmaz', () => {
  const r = calistir(belge({ meta: { yon: 'gercek' }, muhatap: { tur: 'kisi', kisiAd: 'Ali', kisiSoyad: 'Veli' }, metin: 'Konu.\nBilgilerinize sunulur.', ilgi: [{ tur: 'basvuru', kisiAd: 'Ali', kisiSoyad: 'Veli', tarih: '2026-09-01' }] }));
  assert.ok(var_(r, 'm.16/9', 'warn'));
});
test('m.7: punto sınırları', () => {
  assert.ok(var_(calistir(belge({ meta: { punto: 8 } })), 'm.7', 'error'));
  assert.ok(var_(calistir(belge({ meta: { punto: 10 } })), 'm.7', 'info'));
  assert.ok(var_(calistir(belge({ meta: { font: 'arial', punto: 12 } })), 'm.7', 'warn'));
  assert.ok(var_(calistir(belge({ meta: { font: 'arial', punto: 11 } })), 'm.7', 'ok'));
});
test('m.16/4: boş satır uyarısı ve düzeltmesi', () => {
  const d = belge({ metin: 'Birinci paragraf.\n\nİkinci paragraf.\nGereğini rica ederim.' });
  const r = calistir(d);
  const x = r.sonuclar.find((s) => s.ref === 'm.16/4');
  assert.ok(x && x.fix.tip === 'bosSatirSil');
});
test('m.16/11: kısaltma ilk kullanımda açılır (Ad SOYAD hariç)', () => {
  const r = calistir(belge({ metin: 'KEP adresine gönderiniz. Ahmet YILMAZ ile görüşünüz.\nGereğini rica ederim.' }));
  const k = r.sonuclar.filter((x) => x.ref === 'm.16/11').map((x) => x.bul);
  assert.deepEqual(k, ['KEP']);
  const ok = calistir(belge({ metin: 'Kayıtlı Elektronik Posta (KEP) adresine gönderiniz. KEP adresi şarttır.\nGereğini rica ederim.' }));
  assert.ok(!var_(ok, 'm.16/11'));
});
test('e-posta/posta kodu biçimleri', () => {
  const r = calistir(belge({ iletisim: { posta: '123', eposta: 'abc' } }));
  assert.equal(r.sonuclar.filter((x) => x.ref === 'm.24/1' && x.sev === 'warn').length, 2);
});
test('paraf: elektronik ortamda gösterilmez bilgisi; fiziksel ortamda kısaltma uyarısı', () => {
  const p = [{ tarih: '', unvan: 'Şb. Md.', ad: 'Ali', soyad: 'Veli' }];
  assert.ok(var_(calistir(belge({ paraf: p })), 'm.21/1-2', 'info'));
  assert.ok(var_(calistir(belge({ meta: { ortam: 'Z' }, paraf: p })), 'm.21/1', 'warn'));
});
test('TDK bulguları belge denetimine düşer ve düzeltilebilir', () => {
  const r = calistir(belge({ metin: 'Toplantı 17:30 da yapılacak.\nGereğini rica ederim.' }));
  const x = r.sonuclar.find((s) => s.tdk && s.bul === '17:30');
  assert.ok(x && x.repl === '17.30' && x.fix.alan === 'metin');
});
test('“ilgili” kelimesi İlgi bölümü uyarısını tetiklemez; “İlgi (a) yazı” tetikler', () => {
  assert.ok(!var_(calistir(belge({ metin: 'İlgili birimlerle görüşülmüştür.\nGereğini rica ederim.' })), 'm.15/1'));
  assert.ok(var_(calistir(belge({ metin: 'İlgi (a) yazı incelenmiştir.\nGereğini rica ederim.' })), 'm.15/1', 'warn'));
  assert.ok(!var_(calistir(belge({ metin: 'İlgi (a) yazı incelenmiştir.\nGereğini rica ederim.', ilgi: [{ tur: 'belge', tarih: '2026-01-01', sayi: 'E-1-2-3' }] })), 'm.15/1'));
});
