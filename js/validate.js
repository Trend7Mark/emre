/* Yönetmelik (CB Kararı 2646) denetimi: yapısal alanlar + metin.
 * validate(doc, c, ctx) -> { sonuclar: [...], ozet: {error, warn, info, ok, auto} }
 * Her sonuç: { sev: error|warn|info|ok|auto, kaynak, ref, msg, alan, fix?, oneri? } */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});
  const t = KY.tr;
  const trim = (s) => String(s == null ? '' : s).trim();
  const empty = (s) => !trim(s);

  const GIZLI_ELEKTRONIK_YASAK = ['Özel', 'Gizli', 'Çok Gizli'];

  function validate(doc, c, ctx = {}) {
    const R = [];
    const Y = 'Yönetmelik';
    const push = (sev, ref, msg, alan, extra) => R.push(Object.assign({ sev, kaynak: Y, ref, msg, alan }, extra));
    const m = doc.meta;
    const E = m.ortam === 'E';

    /* ---------- Belge ortamı / genel ---------- */
    if (E) push('info', 'm.4/1, m.23', 'Taslak, e-Yazışma Teknik Rehberi’ne uygun hazırlanır; güvenli elektronik imza, kayıt numarası, doğrulama kodu ve karekod EBYS’de oluşur.', 'meta');
    if (m.ortam === 'Z') push('info', 'm.4/2, m.5/2, m.6/3, m.17/6', 'Zorunlu hâl: belge fiziksel ortamda, en az iki nüsha (paraflı nüsha idarede kalır) hazırlanır; üst yazı için kâğıdın tek yüzü kullanılır; imza ve paraf mavi kalemle atılır. Kayıt numarası el yazısı imzadan sonra EBYS/kurumsal belge kayıt sisteminden alınır (m.11/2).', 'meta');
    if (m.ortam === 'O') push('info', 'm.11/3', 'Olağanüstü durum: belgeye yetkili birim kurumsal belge kayıt sisteminden “O” kayıt numarası alır; EBYS’ye erişilince belge ve üstveri EBYS’ye kaydedilir.', 'meta');

    const base = m.font === 'arial' ? 11 : 12;
    if (m.punto < 9) push('error', 'm.7', `Yazı alanında harf büyüklüğü en fazla 9 puntoya düşürülebilir (seçili: ${m.punto}).`, 'meta');
    else if (m.punto !== base) push(m.punto > base ? 'warn' : 'info', 'm.7', `Esas punto ${m.font === 'arial' ? 'Arial için 11' : 'Times New Roman için 12'}; ${m.punto} puntonun gerekçesi “gerekli hâllerde” olmalıdır.`, 'meta');
    else push('ok', 'm.7', `Yazı tipi ve punto Yönetmeliğe uygun (${m.font === 'arial' ? 'Arial 11' : 'Times New Roman 12'}).`, 'meta');
    if (m.iletisimPunto < 8) push('error', 'm.7', 'İletişim bilgileri en fazla 8 puntoya düşürülebilir.', 'meta');

    /* ---------- Gizlilik ---------- */
    if (m.gizlilik) {
      if (E && GIZLI_ELEKTRONIK_YASAK.includes(m.gizlilik)) push('error', 'm.25/2', `“${m.gizlilik}” gizlilik dereceli belgeler elektronik ortamda hazırlanamaz; fiziksel ortamda (Z/O) hazırlanmalıdır.`, 'meta');
      else if (m.gizlilik === 'Hizmete Özel') push('info', 'm.25/1', '“Hizmete Özel” belgeler elektronik ortamda hazırlanabilir.', 'meta');
      push('info', 'm.25/3', 'Gizlilik derecesinin belirlenmesinden belgeyi imzalayan yetkili makam sorumludur. (Kaynaklarda derecenin sayfadaki yeri tanımlı değildir; önizlemede alt bilginin üstünde, ortada gösterilir.)', 'meta');
    }

    /* ---------- Süreli / kişiye özel (m.26) ---------- */
    if (m.sureli === 'GUNLUDUR') {
      if (empty(m.sure)) push('error', 'm.26/1', '“GÜNLÜDÜR” belgede cevap verilecek süre veya tarih belirtilmelidir.', 'meta');
      else if (!t.lower(doc.metin || '').includes(t.lower(trim(m.sure)))) push('warn', 'm.26/1', 'Cevap süresi/tarihi metin içinde de belirtilmelidir; girdiğiniz süre metinde bulunamadı.', 'metin');
      else push('ok', 'm.26/1', 'GÜNLÜDÜR: süre metinde belirtilmiş.', 'metin');
    } else if (m.sureli === 'ACELE') {
      push('info', 'm.26/2', '“ACELE” ibaresi taşıyan belgeye derhâl ve süratle cevap verilir.', 'meta');
    }
    if (!m.sureli && /(?:[tT]alep|[iİ]stenil|[iİ]stenmekte|gönderilmesi|bildirilmesi)/.test(`${doc.konu} ${doc.metin}`) && m.sureli !== 'GUNLUDUR')
      push('info', 'm.33/1', 'Görüş, bilgi ve belge talep yazıları günlü yazılır. Bu belge bir talep içeriyorsa “GÜNLÜDÜR” ve süre ekleyin (süre belirtilmezse belge talepleri 5, bilgi/görüş talepleri 15 iş günü içinde cevaplanır, m.33/1).', 'meta');
    if (m.kisiyeOzel) push('info', 'm.26/4-5', '“KİŞİYE ÖZEL” belge, zarf açılmadan ilgilisine teslim edilir; zarf üzerindeki bilgiler EBYS/kurumsal belge kayıt sistemine kaydedilir.', 'meta');

    /* ---------- Logo (m.9) ---------- */
    if (doc.logo.mod !== 'yok') {
      const eksik = doc.logo.mod === 'iki' ? empty(doc.logo.sol) || empty(doc.logo.sag) : empty(doc.logo.sol);
      if (eksik) push('warn', 'm.9/1', doc.logo.mod === 'iki' ? 'İki logo seçili ancak görsellerden biri veya ikisi yüklenmedi.' : 'Logo seçili ancak görsel yüklenmedi.', 'baslik');
      else push('ok', 'm.8/1, m.9/1', 'Logo yerleşimi Yönetmeliğe göre (üst boşluk 0,5 cm).', 'baslik');
    }

    /* ---------- Başlık (m.10) ---------- */
    if (c.baslikEksik) push('error', 'm.10/2', 'Başlığın 2. satırı (idare adı) boş.', 'baslik');
    else {
      push('ok', 'm.10/2', 'Başlık: “T.C.” + idare adı' + (c.baslik.length > 2 ? ' + birim adı.' : '.'), 'baslik');
      if (empty(doc.baslik.s3)) push('info', 'm.10/2, m.10/6', 'Birim adı (3. satır) girilmedi. Başlık yazımında DETSİS’teki başlık kayıtları esas alınır.', 'baslik');
    }

    /* ---------- Sayı (m.11) ---------- */
    const sp = c.sayiParcalari;
    if (empty(doc.sayi.detsis)) push('error', 'm.11/1', 'DETSİS numarası girilmedi (Sayı: E-<DETSİS>-<dosya planı>-<kayıt no>).', 'sayi');
    else if (!/^\d{8}$/.test(sp.detsis)) push('warn', 'm.11/1', 'DETSİS (Devlet Teşkilatı) numarası, Yönetmelikteki örneklerde 8 haneli rakamdır (67915368).', 'sayi');
    if (empty(doc.sayi.dosya)) push('error', 'm.11/1', 'Standart dosya planı kodu girilmedi (örn. 903.07.02).', 'sayi');
    else if (!/^\d{3}(?:\.\d{1,3}){0,4}$/.test(sp.dosya)) push('warn', 'm.11/1', 'Standart dosya planı kodu “903.07.02” gibi üç haneli ana kod ve nokta ile ayrılmış alt kodlardan oluşur.', 'sayi');
    if (empty(doc.sayi.kayit)) push('info', 'm.11/2', 'Kayıt numarası belge hazırlanırken EBYS’den alınır (zorunlu hâlde el yazısı imzadan sonra). Boş bırakılırsa “……” görünür.', 'sayi');
    else if (!/^\d+$/.test(sp.kayit)) push('error', 'm.11/1', 'Kayıt numarası yalnız rakamlardan oluşur.', 'sayi');
    if (!R.some((r) => r.alan === 'sayi' && (r.sev === 'error' || r.sev === 'warn'))) push('ok', 'm.11/1', `Sayı biçimi uygun: ${c.sayi}`, 'sayi');

    /* ---------- Tarih (m.12) ---------- */
    if (empty(doc.tarih.deger)) push('error', 'm.12/1', 'Tarih girilmedi.', 'sayi');
    else push('ok', 'm.12/1', `Tarih: ${c.tarih}`, 'sayi');
    if (E) push('info', 'm.12/2', 'Elektronik belgede belge tarihi, belgenin en son yetkili tarafından imzalandığı zaman damgasındaki tarihtir; EBYS bunu otomatik yazar.', 'sayi');

    /* ---------- Konu (m.13) ---------- */
    if (empty(doc.konu)) push('error', 'm.13/1', 'Konu boş.', 'konu');
    else {
      if (c.konu.length > 110) push('warn', 'm.13/2', `Konu “kısa ve öz” olmalıdır (${c.konu.length} karakter).`, 'konu');
      else push('ok', 'm.13/2', 'Konu kısa ve öz; baş harfler büyük, sonda noktalama yok.', 'konu');
      for (const i of KY.lintTDK(doc.konu, { paragraf: false }).filter((x) => !['tdk.cumlebasi', 'tdk.ay', 'tdk.sayin'].includes(x.id)))
        push(i.sev, i.ref, i.msg, 'konu', { fix: { alan: 'konu', issue: i }, bul: i.bul, repl: i.repl, tdk: true, kaynak: 'TDK' });
    }

    /* ---------- Muhatap (m.14) ---------- */
    const mu = doc.muhatap;
    if (mu.tur === 'idare') {
      if (empty(mu.ad)) push('error', 'm.14/1', 'Muhatap boş.', 'muhatap');
      else {
        if (mu.dativeOtomatik === false && !t.hasDative(mu.ad)) push('warn', 'm.14/2', 'Muhatap idare adının sonuna yönelme hâli eki getirilmelidir (…VALİLİĞİNE). Otomatik eki açabilirsiniz.', 'muhatap');
        else push('ok', 'm.14/2', `Muhatap: ${c.muhatap[0]}`, 'muhatap');
      }
      if (!empty(mu.birim)) push('info', 'm.16/12(c)', 'Muhatap ikinci satırda parantez içinde birim belirtiyorsa, “arz/rica” ibaresi birinci satırdaki idareye göre seçilir.', 'muhatap');
    } else if (mu.tur === 'kisi') {
      if (empty(mu.kisiAd) && empty(mu.kisiSoyad)) push('error', 'm.14/3', 'Gerçek kişi muhatabın adı ve soyadı girilmedi.', 'muhatap');
      else push('ok', 'm.14/3', `Muhatap: ${c.muhatap[0]}`, 'muhatap');
      if (empty(mu.adres)) push('info', 'm.14/3', 'İdare dışına gönderilen belgede, gerekiyorsa gideceği yerin adresi muhatap satırının altına yazılır.', 'muhatap');
      if (doc.metin && !KY.KAPANIS.gercek.re.test(c.paragraflar.slice(-1)[0] || '') && m.yon !== 'gercek') push('info', 'm.16/12(e)', 'Muhatap gerçek kişi ise “Yazışma yönü” olarak “Gerçek kişiye” seçin.', 'meta');
    } else if (mu.tur === 'dagitim') {
      const n = c.dagitim.geregi.length + c.dagitim.bilgi.length;
      if (n < 2) push('warn', 'm.14/6, m.19/1', '“DAĞITIM YERLERİNE” seçili ancak Dağıtım bölümünde en az iki muhatap yok.', 'dagitim');
      else push('ok', 'm.14/6', 'Muhatap: DAĞITIM YERLERİNE.', 'muhatap');
    } else if (mu.tur === 'cby') {
      push('ok', 'm.14/2', 'Muhatap: CUMHURBAŞKANI YARDIMCISINA.', 'muhatap');
    }
    if (mu.tur !== 'dagitim' && c.dagitim.var) push('error', 'm.14/6, m.19/1', 'Dağıtım bölümü dolu ancak muhatap “DAĞITIM YERLERİNE” değil. Birden fazla muhataba iletilecek belgede muhatap bölümüne “DAĞITIM YERLERİNE” yazılır.', 'muhatap');

    /* ---------- İlgi (m.15-16) ---------- */
    let ilgiSorun = false;
    doc.ilgi.forEach((i, k) => {
      const ad = `İlgi ${k + 1}`;
      if (i.tur === 'belge') {
        if (empty(i.tarih)) { push('error', 'm.16/6', `${ad}: tarih girilmedi.`, 'ilgi'); ilgiSorun = true; }
        if (empty(i.sayi)) { push('error', 'm.16/6', `${ad}: sayı girilmedi.`, 'ilgi'); ilgiSorun = true; }
      } else if (i.tur === 'basvuru') {
        if (empty(i.tarih)) { push('error', 'm.16/9', `${ad}: başvuru/dilekçe tarihi girilmedi.`, 'ilgi'); ilgiSorun = true; }
        if (mu.tur === 'kisi' && (!empty(i.kisiAd) || !empty(i.kisiSoyad))) { push('warn', 'm.16/9', `${ad}: muhatap, ilgi başvurunun sahibi ise ilgi bölümünde kişinin adı yazılmaz.`, 'ilgi'); ilgiSorun = true; }
      }
    });
    if (doc.ilgi.length && !ilgiSorun) push('ok', 'm.16/6-7', `İlgi bölümü tamam (${doc.ilgi.length} kayıt, tarih sırasında).`, 'ilgi');
    if (doc.ilgi.some((i) => i.tur === 'basvuru') && mu.tur === 'kisi') push('info', 'm.16/9', 'Muhatap başvuru sahibi olduğundan ilgi, “… tarihli dilekçeniz/başvurunuz.” biçiminde ad verilmeden yazıldı.', 'ilgi');
    if (!doc.ilgi.length && /(?<![\p{L}])[iİ]lgi(?:\s*\([a-zçğıöşü\d]\)|\s+(?:yaz[ıi]|dilek|belge|tarihli|sayılı))/u.test(doc.metin)) push('warn', 'm.15/1', 'Metinde “ilgi”ye atıf var ancak İlgi bölümü boş.', 'ilgi');

    /* ---------- Metin (m.16) ---------- */
    if (!c.paragraflar.length) push('error', 'm.16/1', 'Metin boş.', 'metin');
    else {
      if (c.bosSatirVar) push('warn', 'm.16/4', 'Paragraflar arasında satır boşluğu bırakılmaz.', 'metin', { fix: { tip: 'bosSatirSil' } });
      const spec = KY.KAPANIS[m.yon] || KY.KAPANIS.esit;
      const son = c.paragraflar[c.paragraflar.length - 1];
      if (!spec.re.test(son)) push('warn', 'm.16/12', `Metnin son bölümü seçtiğiniz yazışma yönüne göre ${spec.ibare} ibaresiyle bitirilmelidir.`, 'metin', { oneri: spec.oneri, fix: { tip: 'kapanis' } });
      else push('ok', 'm.16/12', 'Metnin son bölümü yazışma yönüne uygun bitiyor.', 'metin');
      if (m.yon === 'dagitimli' && mu.tur !== 'dagitim') push('info', 'm.16/12(b)', '“Üst, aynı düzey ve alt makamlara dağıtımlı” seçili; muhatap “DAĞITIM YERLERİNE” değil.', 'meta');
      if (mu.tur === 'dagitim' && m.yon !== 'dagitimli') push('warn', 'm.16/12(b)', 'Dağıtımlı belgeler “… arz ve rica ederim.” veya “… arz/rica ederim.” ile bitirilir; yazışma yönünü “dağıtımlı” yapın.', 'meta');
      if (m.yon === 'bakanlik') push('info', 'm.17/8, m.16/12(ç)', 'Bakanlıklarla yazışmada belge, CB İdari İşler Başkanı tarafından veya adına imzalanır ve “Rica ederim.” ile bitirilir.', 'meta');

      for (const i of KY.lintTDK(doc.metin)) push(i.sev, i.ref, i.msg, 'metin', { fix: { alan: 'metin', issue: i }, bul: i.bul, repl: i.repl, tdk: true, kaynak: i.ref.startsWith('Yön') ? Y : 'TDK' });

      // Kısaltma ilk kullanımda açılır (m.16/11)
      const metin = doc.metin;
      const gor = new Set();
      const re = /(?<![\p{L}])\p{Lu}{2,7}(?![\p{L}])/gu;
      let mm;
      while ((mm = re.exec(metin))) {
        const k = mm[0];
        if (gor.has(k) || /^[IVXLCDM]+$/.test(k) || ['TL', 'KİŞİYE', 'ÖZEL', 'ACELE', 'OLUR'].includes(k)) continue;
        gor.add(k);
        if (metin.includes(`(${k})`)) continue;
        if (/\p{Lu}\p{Ll}+\s$/u.test(metin.slice(Math.max(0, mm.index - 24), mm.index))) continue; // Ad SOYAD
        push('info', 'm.16/11', `“${k}” kısaltması: kısaltma ilk kullanıldığı yerde açık biçimi yazılıp parantez içinde kısaltması gösterilir (Kayıtlı Elektronik Posta (KEP)). Ad-soyaddaki büyük harfli soyadlar için bu uyarıyı yok sayın.`, 'metin', { bul: k, mevcutDegil: true });
      }
    }

    /* ---------- İmza (m.17) ---------- */
    let imzaSorun = false;
    if (!doc.imza.length) { push('error', 'm.17/1', 'İmza bölümünde en az bir imza sahibi olmalıdır.', 'imza'); imzaSorun = true; }
    doc.imza.forEach((s, k) => {
      const ad = doc.imza.length > 1 ? `İmza ${k + 1}` : 'İmza';
      if (empty(s.ad) || empty(s.soyad)) { push('error', 'm.17/1', `${ad}: ad ve soyad girilmelidir.`, 'imza'); imzaSorun = true; }
      if (s.tip === 'normal' && empty(s.unvan)) { push('error', 'm.17/1', `${ad}: unvan girilmelidir.`, 'imza'); imzaSorun = true; }
      if (s.tip === 'ae') {
        if (empty(s.makam)) { push('error', 'm.17/9', `${ad}: yetkiyi devreden makam (ör. Vali, Bakan) girilmelidir.`, 'imza'); imzaSorun = true; }
        if (empty(s.unvan)) { push('error', 'm.17/9', `${ad}: imzalayanın unvanı girilmelidir.`, 'imza'); imzaSorun = true; }
      }
      if (s.tip === 'vekalet' && empty(s.makam)) { push('error', 'm.17/10', `${ad}: vekâlet edilen makam (ör. Genel Müdür) girilmelidir.`, 'imza'); imzaSorun = true; }
      if (E && /[iİ]mzal|e-?[iİ]mza|elektronik|onaylan/i.test([s.ad, s.soyad, s.unvan, s.makam, s.onUnvan].join(' '))) { push('error', 'm.17/3', `${ad}: elektronik ortamda imza alanında belgenin e-imza ile imzalandığına dair hiçbir ibare, şekil veya ifade bulunamaz.`, 'imza'); imzaSorun = true; }
    });
    if (doc.imza.length && !imzaSorun) push('ok', 'm.17/1-2', 'İmza bloğu tamam.', 'imza');
    if (doc.imza.length === 2) push('info', 'm.17/11', 'İki yetkili imzasında üst unvan sahibi sağda yer alır: ilk sıraya üst unvanlıyı yazın.', 'imza');
    if (doc.imza.length > 2) push('info', 'm.17/11', 'İkiden fazla imzada en üst unvan sahibi en solda, diğerleri unvan sırasına göre soldan sağa dizilir: listeye en üst unvandan başlayın.', 'imza');
    if (doc.imza.some((s) => s.tip === 'ae')) push('info', 'm.16/12(d)', 'Yetki devrinde, kapanış ibaresi yetkiyi devreden makamın hiyerarşik durumuna göre seçilir.', 'imza');
    if (!E) push('info', 'm.17/6', 'İmza için ad ve soyadın üzerinde boşluk bırakıldı; el yazısıyla, kaybolmayacak ve kâğıda işlemesini sağlayacak mavi kalemle atılır.', 'imza');

    /* ---------- Olur (m.20) ---------- */
    if (doc.olur.aktif) {
      if (empty(doc.olur.ad) || empty(doc.olur.soyad) || empty(doc.olur.unvan)) push('error', 'm.20/2', 'OLUR bloğunda onaylayan makamın adı, soyadı ve unvanı girilmelidir.', 'imza');
      else push('ok', 'm.20/2', 'OLUR bloğu tamam.', 'imza');
      if (E) push('info', 'm.20/2', 'Oluru alınan makamın e-imza tarihi belge tarihi olarak esas alınır ve belge görüntüsünde 12. maddedeki alanda gösterilir.', 'imza');
      doc.olur.katilan.forEach((k, i) => { if (empty(k.ad) || empty(k.soyad) || empty(k.unvan)) push('error', 'm.20/4', `OLUR’a katılan makam ${i + 1}: ad, soyad ve unvan girilmelidir.`, 'imza'); });
    }

    /* ---------- Ek (m.18) ---------- */
    const ekler = c.ek.liste;
    if (ekler.length) {
      if (doc.ek.liste.some((e) => !empty(e.ad) && empty(e.aciklama))) push('info', 'm.18/2', 'Eklerin sayfa, adet, kişi sayısı gibi açıklayıcı ifadeleri parantez içinde belirtilir.', 'ek');
      if (ekler.length > 1) push('info', 'm.18/2', 'Birden fazla ek varsa eklerin üzerinde, yazı alanının sağ üst köşesinde ek numarası (EK-1, EK-2) belirtilir.', 'ek');
      if (ekler.length > 8 && !doc.ek.ayriSayfa) push('warn', 'm.18/4', 'Ek listesi yazı alanına sığmayacak kadar uzunsa ayrı sayfada “EK LİSTESİ” olarak gösterilir. “Ek listesini ayrı sayfada göster” seçeneğini kullanın.', 'ek');
      if (E) push('info', 'm.18/3', 'Elektronik ortamda eklenen dosyalar, Kamu Bilgi Sistemlerinde Birlikte Çalışabilirlik Esasları’nda belirtilen biçimlerde olmalıdır.', 'ek');
    }

    /* ---------- Dağıtım (m.19) ---------- */
    if (c.dagitim.var) {
      if (!c.dagitim.geregi.length) push('warn', 'm.19/2', 'Dağıtımda “Gereği:” kısmı boş; belgenin gereğini yerine getirecek muhatapları “Gereği:” altına yazın.', 'dagitim');
      const toplam = c.dagitim.geregi.length + c.dagitim.bilgi.length;
      if (toplam > 10 && !doc.dagitim.ayriSayfa) push('warn', 'm.19/3', 'Dağıtım bölümü uzunsa “DAĞITIM LİSTESİ” ayrı sayfada gösterilir. Seçeneği açın.', 'dagitim');
      else if (c.dagitim.geregi.length) push('ok', 'm.19/1-2', 'Dağıtım bölümü tamam.', 'dagitim');
    }

    /* ---------- Paraf & koordinasyon (m.21-22) ---------- */
    if (E && (c.paraf.length || c.koordinasyon.length)) push('info', 'm.21/1-2', 'Elektronik ortamda paraf, güvenli elektronik imza veya elektronik onayla EBYS’de atılır ve üstverisinde tutulur; belge muhataba iletildiğinde paraf bilgileri paylaşılmaz. Bu nedenle çıktıda gösterilmez.', 'paraf');
    if (!E) {
      if ((doc.paraf || []).some((p) => /\./.test(p.unvan || ''))) push('warn', 'm.21/1', 'Paraf bölümünde tarih, unvan, ad ve soyad bilgileri kısaltma kullanılmadan yazılır.', 'paraf');
      if (!c.paraf.length) push('info', 'm.21/3', 'Fiziksel belgede paraflar yalnız idarede kalan nüshada, yazı alanının sonunda ve sol kenarında yer alır.', 'paraf');
    }

    /* ---------- İletişim (m.24) ---------- */
    const ic = doc.iletisim;
    const eksikler = [];
    if (empty(ic.adres)) eksikler.push('adres');
    if (empty(ic.tel)) eksikler.push('telefon');
    if (empty(ic.eposta)) eksikler.push('e-posta');
    if (eksikler.length) push('warn', 'm.24/1', `İletişim bilgileri eksik: ${eksikler.join(', ')}. (İdarenin adresi, posta kodu, telefon, faks, e-posta, KEP ve internet adresi sayfa sonunda yer alır.)`, 'iletisim');
    else push('ok', 'm.24/1', 'İletişim bilgileri girilmiş.', 'iletisim');
    if (!empty(ic.posta) && !/^\d{5}$/.test(trim(ic.posta))) push('warn', 'm.24/1', 'Posta kodu 5 haneli olmalıdır.', 'iletisim');
    if (!empty(ic.eposta) && !/^\S+@\S+\.\S+$/.test(trim(ic.eposta))) push('warn', 'm.24/1', 'E-posta adresi geçerli görünmüyor.', 'iletisim');
    if (!empty(ic.kep) && !/^\S+@\S+\.\S+$/.test(trim(ic.kep))) push('warn', 'm.24/1', 'KEP adresi geçerli görünmüyor.', 'iletisim');
    if (empty(ic.kisiAd) && empty(ic.kisiTel)) push('info', 'm.24/1', 'Sağ tarafta “bilgi alınacak kişi” (ad, unvan, telefon) belirtilmedi.', 'iletisim');

    /* ---------- Sayfa düzeni ---------- */
    if (ctx.sayfa > 1) push('info', 'm.16/5, m.27', `Belge ${ctx.sayfa} sayfa: sayı, tarih, konu, muhatap ve ilgi yalnız ilk sayfada; imza, ek ve dağıtım son sayfada; iletişim/doğrulama bilgisi ve sayfa numarası (x/${ctx.sayfa}) her sayfada gösterilir.`, 'metin');
    if (ctx.tasan) push('warn', 'm.8/1', 'Bir bölüm (ör. çok uzun liste) tek sayfaya sığmadı ve kesilmiş olabilir. Ek/dağıtım listesini ayrı sayfada gösterin.', 'metin');

    /* ---------- Otomatik uygulananlar ---------- */
    for (const a of c.auto) R.push({ sev: 'auto', kaynak: Y, ref: a.ref, msg: a.msg, alan: 'meta' });

    const ozet = { error: 0, warn: 0, info: 0, ok: 0, auto: 0 };
    R.forEach((r) => (ozet[r.sev] = (ozet[r.sev] || 0) + 1));
    return { sonuclar: R, ozet };
  }

  KY.validate = validate;
})();
