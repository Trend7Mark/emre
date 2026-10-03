/* Ham form verisinden Yönetmelik'e uygun biçimlenmiş belge içeriğini üretir.
 * Hem önizleme (render.js) hem denetim (validate.js) hem de EBYS aktarımı bu çıktıyı kullanır. */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});
  const t = KY.tr;

  const SURE = { ACELE: 'ACELE', GUNLUDUR: 'GÜNLÜDÜR' };
  const trim = (s) => String(s == null ? '' : s).trim();
  const lines = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

  function imzaSatirlari(s) {
    const ad = t.fmtName(s.ad, s.soyad);
    const on = trim(s.onUnvan) ? t.titleCase(s.onUnvan) : '';
    const adSatiri = on ? `${on} ${ad}`.trim() : ad;
    const makam = t.titleCase(trim(s.makam).replace(/\s*(?:a|v)\.\s*$/i, ''));
    const unvan = t.titleCase(s.unvan);
    if (s.tip === 'ae') return [adSatiri, makam ? `${makam} a.` : '… a.', unvan].filter(Boolean); // yetki devri (m.17/9)
    if (s.tip === 'vekalet') return [adSatiri, makam ? `${makam} V.` : '… V.']; // vekâleten (m.17/10)
    return [adSatiri, unvan].filter(Boolean);
  }

  function ilgiMetni(i, muhatapTur) {
    const tarih = t.fmtDate(i.tarih, 'rakam') || '……';
    if (i.tur === 'isimsiz') return 'İsimsiz ve tarihsiz başvuru/dilekçe.';
    if (i.tur === 'basvuru') {
      const belge = i.belge === 'başvuru' ? 'başvuru' : 'dilekçe';
      const kisi = t.fmtName(i.kisiAd, i.kisiSoyad);
      if (kisi) {
        // …’ın … tarihli başvurusu/dilekçesi. (m.16/9)
        const son = (i.kisiSoyad || i.kisiAd || '').trim();
        return `${kisi}’${t.genitiveSuffix(son)} ${tarih} tarihli ${t.possessive3(belge)}.`;
      }
      // muhatap başvuru sahibi: isim yazılmaz (m.16/9)
      return `${tarih} tarihli ${belge === 'başvuru' ? 'başvurunuz' : 'dilekçeniz'}.`;
    }
    const sayi = trim(i.sayi) || '……';
    const belge = trim(i.belge) || 'yazı';
    const idare = trim(i.idare);
    if (idare && !i.idareYok) {
      const ad = /^[\p{Lu}\d.]{2,6}$/u.test(idare) ? idare : t.titleCase(idare);
      const kesme = /^[\p{Lu}\d.]{2,6}$/u.test(idare) ? '’' : '';
      return `${ad}${kesme}${t.genitiveSuffix(ad)} ${tarih} tarihli ve ${sayi} sayılı ${t.possessive3(belge)}.`;
    }
    return `${tarih} tarihli ve ${sayi} sayılı ${belge}.`;
  }

  function compose(doc) {
    const m = doc.meta;
    const out = { auto: [] };
    const auto = (ref, msg) => out.auto.push({ ref, msg });

    // ---- Başlık (m.10)
    const s2r = trim(doc.baslik.s2);
    const s2 = t.upper(s2r);
    if (s2r && s2 !== s2r) auto('m.10/2', 'Başlığın 2. satırı büyük harfe çevrildi.');
    const s3 = t.titleCase(doc.baslik.s3);
    const s4 = t.titleCase(doc.baslik.s4);
    if ((trim(doc.baslik.s3) && s3 !== trim(doc.baslik.s3)) || (trim(doc.baslik.s4) && s4 !== trim(doc.baslik.s4))) auto('m.10/2', 'Birim adı satırları “İlk Harfleri Büyük” biçimine getirildi.');
    out.baslik = ['T.C.', s2, s3, s4].filter(Boolean);
    out.baslikEksik = !s2r;

    // ---- Sayı (m.11)
    const ortam = m.ortam || 'E';
    const d = doc.sayi;
    out.sayiParcalari = { ortam, detsis: trim(d.detsis), dosya: trim(d.dosya), kayit: trim(d.kayit) };
    out.sayi = [ortam, trim(d.detsis) || '……', trim(d.dosya) || '……', trim(d.kayit) || '……'].join('-');

    // ---- Tarih (m.12)
    out.tarih = t.fmtDate(doc.tarih.deger, doc.tarih.bicim);

    // ---- Konu (m.13)
    const konuR = trim(doc.konu);
    let konu = t.titleCase(konuR, m.konuBaglac ? { small: KY.KONU_KUCUK } : {});
    const noktalamasiz = konu.replace(/[\s.,;:!?…]+$/u, '');
    if (noktalamasiz !== konu) auto('m.13/1', 'Konu satırı sonundaki noktalama kaldırıldı.');
    konu = noktalamasiz;
    if (konuR && konu !== konuR.replace(/[\s.,;:!?…]+$/u, '')) auto('m.13/1', 'Konu kelimelerinin baş harfleri büyütüldü.');
    out.konu = konu;

    // ---- Muhatap (m.14)
    const mu = doc.muhatap;
    const adr = lines(mu.adres).map((l) => t.titleCase(l));
    let mlines = [];
    let mAuto = false;
    if (mu.tur === 'dagitim') {
      mlines = ['DAĞITIM YERLERİNE'];
    } else if (mu.tur === 'kisi') {
      const kisi = t.fmtName(mu.kisiAd, mu.kisiSoyad);
      mlines = kisi ? [`Sayın ${kisi}`] : [];
    } else if (mu.tur === 'cby') {
      mlines = ['CUMHURBAŞKANI YARDIMCISINA'];
      const kisi = t.fmtName(mu.kisiAd, mu.kisiSoyad);
      if (kisi) mlines.push(`(Sayın ${kisi})`); // birden fazla CB Yardımcısı (m.14/2)
    } else {
      const ad = trim(mu.ad);
      if (ad) {
        const up = t.upper(ad);
        const full = mu.dativeOtomatik === false ? up : t.addDative(up);
        if (full !== ad) mAuto = true;
        mlines.push(full);
      }
      if (trim(mu.birim)) mlines.push(`(${t.titleCase(mu.birim)})`);
    }
    if (mAuto) auto('m.14/2', 'Muhatap idare adı büyük harfe çevrildi ve yönelme eki eklendi.');
    out.muhatap = mlines;
    out.adres = adr;

    // ---- İlgi (m.15-16)
    const sirali = doc.ilgi
      .map((i, idx) => ({ i, idx }))
      .sort((a, b) => {
        const ta = a.i.tur === 'isimsiz' ? '' : a.i.tarih || '9999-99-99';
        const tb = b.i.tur === 'isimsiz' ? '' : b.i.tarih || '9999-99-99';
        return ta < tb ? -1 : ta > tb ? 1 : a.idx - b.idx;
      });
    const coklu = sirali.length > 1;
    out.ilgi = sirali.map((x, k) => ({ harf: coklu ? `${t.ALFABE[k]})` : '', metin: ilgiMetni(x.i, mu.tur), kaynak: x.i }));
    if (coklu && sirali.some((x, k) => x.idx !== k)) auto('m.16/5', 'İlgiler tarih sırasına (eskiden yeniye) dizildi.');

    // ---- Metin (m.16)
    out.metinHam = String(doc.metin || '');
    out.paragraflar = lines(doc.metin);
    out.bosSatirVar = /\n[ \t]*\n/.test(out.metinHam.trim());

    // ---- İmza (m.17)
    out.imza = doc.imza.map((s) => ({ satirlar: imzaSatirlari(s), kaynak: s }));
    let sirala = out.imza.slice();
    if (sirala.length === 2) sirala = [sirala[1], sirala[0]]; // üst unvan sağda
    out.imzaSirasi = sirala;

    // ---- Olur (m.20)
    out.olur = null;
    if (doc.olur && doc.olur.aktif) {
      out.olur = {
        satirlar: [t.fmtName(doc.olur.ad, doc.olur.soyad), t.titleCase(doc.olur.unvan)].filter(Boolean),
        katilan: (doc.olur.katilan || []).map((k) => [t.fmtName(k.ad, k.soyad), t.titleCase(k.unvan)].filter(Boolean)),
      };
    }

    // ---- Ek (m.18)
    const ekler = (doc.ek.liste || []).filter((e) => trim(e.ad));
    out.ek = {
      liste: ekler.map((e, i) => ({ no: i + 1, metin: t.upFirst(trim(e.ad)) + (trim(e.aciklama) ? ` (${trim(e.aciklama)})` : ''), gonderilmez: !!e.gonderilmez })),
      ayriSayfa: !!doc.ek.ayriSayfa && ekler.length > 0,
    };
    const gonderilmeyen = out.ek.liste.filter((e) => e.gonderilmez);
    out.ek.konulmadi = !out.ek.liste.length ? '' : gonderilmeyen.length === out.ek.liste.length ? 'Ek konulmadı' : gonderilmeyen.length ? `Ek-${gonderilmeyen.map((e) => e.no).join(', Ek-')} konulmadı` : '';

    // ---- Dağıtım (m.19)
    out.dagitim = {
      geregi: (doc.dagitim.geregi || []).map(trim).filter(Boolean),
      bilgi: (doc.dagitim.bilgi || []).map(trim).filter(Boolean),
      ayriSayfa: !!doc.dagitim.ayriSayfa,
    };
    out.dagitim.var = out.dagitim.geregi.length + out.dagitim.bilgi.length > 0;

    // ---- Paraf ve koordinasyon (m.21-22)
    out.paraf = (doc.paraf || []).filter((p) => trim(p.ad) || trim(p.soyad) || trim(p.unvan)).map((p) => `${p.tarih ? t.fmtDate(p.tarih, 'rakam') + ' ' : ''}${t.titleCase(p.unvan)} ${t.fmtName(p.ad, p.soyad)}`.replace(/\s+/g, ' ').trim());
    out.koordinasyon = (doc.koordinasyon || []).filter((p) => trim(p.ad) || trim(p.soyad) || trim(p.unvan)).map((p) => `${t.titleCase(p.unvan)} ${t.fmtName(p.ad, p.soyad)}`.replace(/\s+/g, ' ').trim());

    // ---- Süreli / kişiye özel (m.26)
    out.bayraklar = [];
    if (SURE[m.sureli]) out.bayraklar.push(SURE[m.sureli]);
    if (m.kisiyeOzel) out.bayraklar.push('KİŞİYE ÖZEL');

    // ---- İletişim (m.24)
    const c = doc.iletisim;
    const sol = [];
    const adresSatiri = [trim(c.adres), trim(c.posta)].filter(Boolean).join(' ');
    if (adresSatiri) sol.push(adresSatiri);
    const tf = [trim(c.tel) && `Tel: ${trim(c.tel)}`, trim(c.faks) && `Faks: ${trim(c.faks)}`].filter(Boolean).join('  ');
    if (tf) sol.push(tf);
    const ek2 = [trim(c.eposta) && `e-Posta: ${trim(c.eposta)}`, trim(c.kep) && `KEP: ${trim(c.kep)}`].filter(Boolean).join('  ');
    if (ek2) sol.push(ek2);
    if (trim(c.web)) sol.push(`Web: ${trim(c.web)}`);
    const sag = [];
    if (trim(c.kisiAd) || trim(c.kisiUnvan)) sag.push(`Bilgi için: ${[t.fmtName(c.kisiAd, '').trim(), t.titleCase(c.kisiUnvan)].filter(Boolean).join(' / ')}`);
    if (trim(c.kisiTel)) sag.push(`Tel: ${trim(c.kisiTel)}`);
    out.iletisim = { sol, sag };

    return out;
  }

  /** İki yazı aynı görünüyor mu; kayıtlardaki metni EBYS’ye aktarmak için düz metne çevirir. */
  function ebysAlanlari(doc, c) {
    const f = [];
    f.push({ ad: 'Sayı', deger: c.sayi, not: 'Kayıt numarasını EBYS verir; bu alan yalnız görüntü içindir.' });
    f.push({ ad: 'Tarih', deger: c.tarih });
    f.push({ ad: 'Konu', deger: c.konu });
    f.push({ ad: 'Muhatap', deger: [...c.muhatap, ...c.adres].join('\n') });
    if (c.ilgi.length) f.push({ ad: 'İlgi', deger: c.ilgi.map((i) => `${i.harf ? i.harf + ' ' : ''}${i.metin}`).join('\n') });
    f.push({ ad: 'Metin', deger: c.paragraflar.join('\n') });
    f.push({ ad: 'İmza', deger: c.imzaSirasi.map((s) => s.satirlar.join('\n')).join('\n\n') });
    if (c.ek.liste.length) f.push({ ad: 'Ek', deger: c.ek.liste.length === 1 ? c.ek.liste[0].metin : c.ek.liste.map((e) => `${e.no}- ${e.metin}`).join('\n') });
    if (c.dagitim.var) {
      const parts = [];
      if (c.dagitim.geregi.length) parts.push('Gereği:\n' + c.dagitim.geregi.join('\n'));
      if (c.dagitim.bilgi.length) parts.push('Bilgi:\n' + c.dagitim.bilgi.join('\n'));
      f.push({ ad: 'Dağıtım', deger: parts.join('\n\n') });
    }
    return f;
  }

  KY.compose = compose;
  KY.ebysAlanlari = ebysAlanlari;
  KY.SURE_ADI = SURE;
})();
