const test = require('node:test');
const assert = require('node:assert/strict');
const KY = require('./load.js');
const t = KY.tr;

test('büyük/küçük harf Türkçe kurallarına uyar', () => {
  assert.equal(t.upper('ılık işçi'), 'ILIK İŞÇİ');
  assert.equal(t.lower('IŞIK İNCİ'), 'ışık inci');
});
test('ad-soyad biçimi: ad ilk harf büyük, soyad büyük (m.17/2)', () => {
  assert.equal(t.fmtName('ahmet ali', 'yılmaz'), 'Ahmet Ali YILMAZ');
  assert.equal(t.fmtName('IŞIL', 'ınanç'), 'Işıl INANÇ');
});
test('titleCase: kısaltma korunur, tamamı büyükse dönüştürülür, bağlaç küçük kalır', () => {
  assert.equal(t.titleCase('bilgi işlem daire başkanlığı MEB'), 'Bilgi İşlem Daire Başkanlığı MEB');
  assert.equal(t.titleCase('BİLGİ İŞLEM ŞUBESİ'), 'Bilgi İşlem Şubesi');
  assert.equal(t.titleCase('çankaya/ankara'), 'Çankaya/Ankara');
  assert.equal(t.titleCase('Okul Müdürlerine YÖNELİK bilgi'), 'Okul Müdürlerine Yönelik Bilgi');
  assert.equal(t.titleCase('personel atama ve nakil', { small: KY.KONU_KUCUK }), 'Personel Atama ve Nakil');
});
test('muhatap idare adı: büyük harf + yönelme eki, kesme yok (m.14/2)', () => {
  assert.equal(t.addDative('ANKARA VALİLİĞİ'), 'ANKARA VALİLİĞİNE');
  assert.equal(t.addDative('ADALET BAKANLIĞI'), 'ADALET BAKANLIĞINA');
  assert.equal(t.addDative('TÜRKİYE BÜYÜK MİLLET MECLİSİ'), 'TÜRKİYE BÜYÜK MİLLET MECLİSİNE');
  assert.equal(t.addDative('GENEL KURUL'), 'GENEL KURULA');
  assert.equal(t.addDative('MİLLÎ KÜTÜPHANE'), 'MİLLÎ KÜTÜPHANEYE');
  assert.equal(t.addDative('ANKARA VALİLİĞİNE'), 'ANKARA VALİLİĞİNE', 'zaten ekli ise tekrar eklenmez');
});
test('tamlayan ve iyelik ekleri', () => {
  assert.equal(t.genitiveSuffix('Ahmet'), 'in');
  assert.equal(t.genitiveSuffix('Ayşe'), 'nin');
  assert.equal(t.genitiveSuffix('Hasan'), 'ın');
  assert.equal(t.genitiveSuffix('Ömer'), 'in');
  assert.equal(t.genitiveSuffix('Bakanlığı'), 'nın');
  assert.equal(t.possessive3('yazı'), 'yazısı');
  assert.equal(t.possessive3('rapor'), 'raporu');
  assert.equal(t.possessive3('tutanak'), 'tutanağı');
});
test('tarih ve sayı biçimleri (m.12/1, TDK sayılar 7)', () => {
  assert.equal(t.fmtDate('2019-09-01', 'rakam'), '01.09.2019');
  assert.equal(t.fmtDate('2019-10-10', 'harf'), '10 Ekim 2019');
  assert.equal(t.fmtDate('', 'rakam'), '');
  assert.equal(t.groupThousands('1452'), '1.452');
  assert.equal(t.groupThousands('28434250310500'), '28.434.250.310.500');
  assert.equal(t.groupThousands('326197'), '326.197');
});
