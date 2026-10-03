/* Uygulama çekirdeği: durum, kalıcılık, yenileme hattı, araç çubuğu. */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const KEY_DRAFT = 'ky.draft.v1';
  const KEY_PROFIL = 'ky.profil.v1';
  const A4_PX = (210 / 25.4) * 96;

  const state = { doc: null, ui: { parafGoster: true, filigran: false, zoom: 'fit' }, son: null };
  KY.state = state;

  /* ---------- Depolama (erişilemezse sessizce atla) ---------- */
  const depo = {
    oku(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    yaz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  };

  /** Eksik alanları varsayılanlarla tamamlar; türü uymayan değerleri varsayılanla değiştirir (dışarıdan açılan dosyalar için). */
  function birlestir(taban, gelen) {
    if (gelen === undefined || gelen === null) return taban;
    if (Array.isArray(taban)) return Array.isArray(gelen) ? gelen.filter((x) => x !== null && x !== undefined && typeof x !== 'function') : taban;
    if (typeof taban === 'object' && taban !== null) {
      if (typeof gelen !== 'object' || Array.isArray(gelen)) return taban;
      const o = {};
      for (const k of Object.keys(taban)) o[k] = k in gelen ? birlestir(taban[k], gelen[k]) : taban[k];
      return o;
    }
    return typeof gelen === typeof taban ? gelen : taban;
  }
  const dolu = (d) => !!(d.konu.trim() || d.metin.trim() || d.muhatap.ad.trim() || d.muhatap.kisiAd.trim() || d.ilgi.length);

  function profilUygula(doc) {
    const p = depo.oku(KEY_PROFIL);
    if (!p) return doc;
    doc.baslik = birlestir(doc.baslik, p.baslik);
    doc.logo = birlestir(doc.logo, p.logo);
    doc.sayi.detsis = (p.sayi && p.sayi.detsis) || '';
    doc.iletisim = Object.assign(doc.iletisim, p.iletisim, { dogrulama: '' });
    doc.meta = Object.assign(doc.meta, p.meta);
    if (Array.isArray(p.imza) && p.imza.length) doc.imza = JSON.parse(JSON.stringify(p.imza));
    return doc;
  }
  function yeniBelge() {
    return profilUygula(KY.bosBelge());
  }

  /* ---------- Yenileme hattı ---------- */
  let tRender, tKaydet;
  function degisti() {
    clearTimeout(tRender);
    tRender = setTimeout(yenile, 120);
    clearTimeout(tKaydet);
    tKaydet = setTimeout(taslakKaydet, 600);
  }
  let uyarildi = false;
  function taslakKaydet() {
    if (depo.yaz(KEY_DRAFT, state.doc)) return;
    const hafif = JSON.parse(JSON.stringify(state.doc));
    hafif.logo.sol = hafif.logo.sag = '';
    if (!depo.yaz(KEY_DRAFT, hafif) && !uyarildi) {
      uyarildi = true;
      KY.ui.toast('Tarayıcı depolaması kullanılamıyor: otomatik kayıt çalışmıyor. “Kaydet” ile dosyaya indirin.');
    }
  }

  function yenile() {
    try {
      yenile1();
    } catch (e) {
      console.error(e);
      KY.ui.toast('Önizleme oluşturulamadı: ' + e.message);
    }
  }
  function yenile1() {
    const doc = state.doc;
    const c = KY.compose(doc);
    const r = KY.render(doc, c, { parafGoster: state.ui.parafGoster });
    const v = KY.validate(doc, c, { sayfa: r.sayfa, tasan: r.tasan });
    $('#sheet').replaceChildren(...r.pages);
    state.son = { c, v, r };
    KY.ui.renderResults(v, eylemler);
    KY.ui.renderEbys(KY.ebysAlanlari(doc, c));
    KY.ui.renderKapanis();
    $('#out-sayi').textContent = c.sayi;
    $('#sayfa-say').textContent = `${r.sayfa} sayfa`;
    const metinSay = doc.metin.trim() ? doc.metin.trim().split(/\s+/).length : 0;
    $('#metin-say').textContent = `${c.paragraflar.length} paragraf · ${metinSay} kelime`;
    $('#lbl-paraf').hidden = doc.meta.ortam === 'E';
    zoomUygula();
    document.title = `${c.konu ? c.konu + ' – ' : ''}Resmî Yazışma Hazırlama`;
  }

  /* ---------- Düzeltme eylemleri ---------- */
  let geriAl = null;
  function metinDegistir(alan, yeni, mesaj) {
    const eski = state.doc[alan];
    if (eski === yeni) return;
    geriAl = { alan, eski };
    state.doc[alan] = yeni;
    KY.ui.syncPath(alan);
    yenile();
    taslakKaydet();
    KY.ui.toast(mesaj, { ad: 'Geri al', fn: () => { state.doc[geriAl.alan] = geriAl.eski; KY.ui.syncPath(geriAl.alan); yenile(); taslakKaydet(); } });
  }
  const eylemler = {
    duzelt(r) {
      const doc = state.doc;
      if (r.fix.issue) {
        const a = r.fix.alan;
        const i = r.fix.issue;
        if (doc[a].slice(i.start, i.end) !== i.bul) return yenile();
        metinDegistir(a, KY.uygula(doc[a], i), 'Düzeltme uygulandı');
      } else if (r.fix.tip === 'bosSatirSil') {
        metinDegistir('metin', doc.metin.replace(/\n[ \t]*(?:\n[ \t]*)+/g, '\n'), 'Paragraflar arasındaki boş satırlar silindi');
      }
    },
    kapanis(s) {
      const satirlar = state.doc.metin.replace(/\s+$/, '').split('\n');
      const hepsi = Object.values(KY.KAPANIS);
      const son = satirlar[satirlar.length - 1].trim();
      if (son && hepsi.some((k) => k.re.test(son)) && son.length < 80) satirlar.pop();
      if (satirlar.length === 1 && !satirlar[0].trim()) satirlar.pop();
      satirlar.push(s);
      metinDegistir('metin', satirlar.join('\n'), 'Kapanış ibaresi eklendi');
    },
  };

  const GUVENLI_INFO = ['tdk.saat', 'tdk.binlik', 'tdk.birim', 'tdk.tc', 'tdk.duzeltme'];
  function tumunuDuzelt() {
    const doc = state.doc;
    const filtre = (i) => i.sev === 'warn' || (i.sev === 'info' && GUVENLI_INFO.includes(i.id));
    let adet = 0;
    const eskiK = doc.konu;
    const eskiM = doc.metin;
    const konuI = KY.lintTDK(doc.konu, { paragraf: false }).filter((i) => !['tdk.cumlebasi', 'tdk.ay', 'tdk.sayin'].includes(i.id) && filtre(i));
    const metinI = KY.lintTDK(doc.metin).filter(filtre);
    adet = konuI.filter((i) => i.repl !== undefined).length + metinI.filter((i) => i.repl !== undefined).length;
    const yeniK = KY.hepsiniUygula(doc.konu, konuI);
    let yeniM = KY.hepsiniUygula(doc.metin, metinI);
    yeniM = yeniM.replace(/\n[ \t]*(?:\n[ \t]*)+/g, '\n'); // boş satırlar (m.16/4)
    if (yeniK === eskiK && yeniM === eskiM) return KY.ui.toast('Otomatik düzeltilecek bulgu yok.');
    doc.konu = yeniK;
    doc.metin = yeniM;
    KY.ui.syncPath('konu');
    KY.ui.syncPath('metin');
    yenile();
    taslakKaydet();
    KY.ui.toast(`${adet} düzeltme uygulandı`, { ad: 'Geri al', fn: () => { doc.konu = eskiK; doc.metin = eskiM; KY.ui.syncPath('konu'); KY.ui.syncPath('metin'); yenile(); taslakKaydet(); } });
  }

  /* ---------- Yakınlaştırma ---------- */
  function zoomUygula() {
    const kab = $('#preview');
    const fit = Math.max(0.3, Math.min(1.25, (kab.clientWidth - 40) / A4_PX));
    const z = state.ui.zoom === 'fit' ? fit : state.ui.zoom;
    $('#sheet').style.setProperty('--z', String(z));
    $('#z-val').textContent = `${Math.round(z * 100)}%`;
  }
  function zoomDegis(d) {
    const kab = $('#preview');
    const mevcut = state.ui.zoom === 'fit' ? Math.max(0.3, Math.min(1.25, (kab.clientWidth - 40) / A4_PX)) : state.ui.zoom;
    state.ui.zoom = Math.max(0.3, Math.min(2, Math.round((mevcut + d) * 100) / 100));
    zoomUygula();
  }

  /* ---------- Araç çubuğu ---------- */
  function gorunum(ad) {
    $('.app').dataset.view = ad;
    $$('.viewtabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === ad)));
    if (ad === 'preview') setTimeout(zoomUygula, 0);
  }
  function sekme(ad) {
    $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === ad)));
    $$('.tabpane').forEach((p) => (p.hidden = p.id !== `tab-${ad}`));
  }

  function dosyaAdi() {
    const k = state.son ? state.son.c.konu : '';
    const slug = k.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\d]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'belge';
    const d = new Date();
    return `yazi-${slug}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
  }

  function olayBagla() {
    $('#btn-yeni').addEventListener('click', () => {
      if (dolu(state.doc) && !confirm('Mevcut taslak kapatılacak ve boş bir belge açılacak. Önce “Kaydet” ile dosyaya indirmediyseniz kaybolur. Devam edilsin mi?')) return;
      state.doc = yeniBelge();
      KY.ui.populate();
      yenile();
      taslakKaydet();
      $('#sablon-not').textContent = '';
    });
    $('#btn-kaydet').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.doc, null, 2)], { type: 'application/json' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: dosyaAdi() });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      KY.ui.toast('Belge dosyaya kaydedildi');
    });
    $('#btn-ac').addEventListener('click', () => $('#dosya-ac').click());
    $('#dosya-ac').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        if (!j || typeof j !== 'object' || !j.meta || !('metin' in j)) throw new Error('Bu dosya bir yazı taslağı değil.');
        state.doc = birlestir(KY.bosBelge(), j);
        KY.ui.populate();
        yenile();
        taslakKaydet();
        KY.ui.toast('Belge açıldı');
      } catch (err) {
        KY.ui.toast('Açılamadı: ' + err.message);
      }
    });
    $('#btn-profil').addEventListener('click', () => {
      const d = state.doc;
      const p = { baslik: d.baslik, logo: d.logo, sayi: { detsis: d.sayi.detsis }, iletisim: d.iletisim, meta: { font: d.meta.font, punto: d.meta.punto, iletisimPunto: d.meta.iletisimPunto, konuBaglac: d.meta.konuBaglac, kalin: d.meta.kalin, ortam: d.meta.ortam }, imza: d.imza };
      KY.ui.toast(depo.yaz(KEY_PROFIL, p) ? 'Kurum profili kaydedildi; yeni belgeler bu bilgilerle başlar.' : 'Profil kaydedilemedi (tarayıcı depolaması kapalı).');
    });
    $('#btn-yazdir').addEventListener('click', () => {
      const v = state.son && state.son.v;
      if (v && v.ozet.error && !confirm(`Denetimde ${v.ozet.error} hata var. Yine de yazdırılsın mı?`)) return;
      window.print();
    });
    window.addEventListener('beforeprint', () => { state.eskiBaslik = document.title; document.title = `Yazı – ${(state.son && state.son.c.konu) || 'Belge'}`; });
    window.addEventListener('afterprint', () => { if (state.eskiBaslik) document.title = state.eskiBaslik; });

    $('#btn-sablon').addEventListener('click', () => {
      const s = KY.SABLONLAR.find((x) => x.id === $('#sel-sablon').value);
      if (!s) return KY.ui.toast('Önce bir şablon seçin.');
      const d = state.doc;
      if (d.metin.trim() && !confirm('Mevcut konu ve metin şablonla değiştirilecek. Devam edilsin mi?')) return;
      d.meta.yon = s.yon;
      d.meta.sureli = s.sureli;
      d.konu = s.konu;
      d.metin = s.metin;
      KY.ui.populate();
      yenile();
      taslakKaydet();
      $('#sablon-not').textContent = s.not;
      KY.ui.toast('Şablon uygulandı: köşeli parantezli alanları doldurun.');
    });
    $('#btn-duzelt-hepsi').addEventListener('click', tumunuDuzelt);
    $('#btn-guvenli').addEventListener('click', tumunuDuzelt);

    $('#z-in').addEventListener('click', () => zoomDegis(0.1));
    $('#z-out').addEventListener('click', () => zoomDegis(-0.1));
    $('#z-fit').addEventListener('click', () => { state.ui.zoom = 'fit'; zoomUygula(); });
    window.addEventListener('resize', () => state.ui.zoom === 'fit' && zoomUygula());
    $('#chk-paraf').addEventListener('change', (e) => { state.ui.parafGoster = e.target.checked; yenile(); });
    $('#chk-filigran').addEventListener('change', (e) => $('#sheet').classList.toggle('filigran', e.target.checked));
    ['#f-info', '#f-auto', '#f-ok'].forEach((s) => $(s).addEventListener('change', () => state.son && KY.ui.renderResults(state.son.v, eylemler)));

    $$('.viewtabs button').forEach((b) => b.addEventListener('click', () => gorunum(b.dataset.view)));
    $$('.tabs button').forEach((b) => b.addEventListener('click', () => sekme(b.dataset.tab)));
    $('#sheet').addEventListener('click', (e) => {
      const b = e.target.closest('[data-alan]');
      if (b) KY.ui.goto(b.dataset.alan);
    });
  }

  function basla() {
    const kayit = depo.oku(KEY_DRAFT);
    state.doc = kayit && kayit.meta ? birlestir(KY.bosBelge(), kayit) : yeniBelge();
    KY.ui.init({ doc: () => state.doc, changed: degisti, gorunum, kapanis: eylemler.kapanis });
    KY.ui.populate();
    olayBagla();
    yenile();
  }

  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', basla);
})();
