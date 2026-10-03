/* Arayüz: form bağlama, liste editörleri, denetim / EBYS / kurallar panelleri. */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function setPath(o, p, v) {
    const ks = p.split('.');
    const last = ks.pop();
    const t = ks.reduce((a, k) => a[k], o);
    t[last] = v;
  }

  let H = { doc: () => null, changed: () => {}, refresh: () => {} };

  /* ================= Form bağlama ================= */
  function readInput(inp) {
    if (inp.type === 'checkbox') return inp.checked;
    if (inp.dataset.lines) return inp.value.split(/\r?\n/);
    if (inp.dataset.type === 'number') return parseInt(inp.value, 10);
    return inp.value;
  }
  function writeInput(inp, v) {
    if (inp.type === 'checkbox') inp.checked = !!v;
    else if (inp.dataset.lines) inp.value = (v || []).join('\n');
    else inp.value = v == null ? '' : v;
  }
  function bindStatic() {
    $$('[data-bind]').forEach((inp) => {
      inp.addEventListener('input', () => {
        setPath(H.doc(), inp.dataset.bind, readInput(inp));
        applyVisibility();
        H.changed(inp.dataset.bind);
      });
    });
  }
  function populate() {
    $$('[data-bind]').forEach((inp) => writeInput(inp, getPath(H.doc(), inp.dataset.bind)));
    applyVisibility();
    renderLists();
  }
  function syncPath(path) {
    const inp = $(`[data-bind="${path}"]`);
    if (inp) writeInput(inp, getPath(H.doc(), path));
  }
  function applyVisibility() {
    $$('[data-show]').forEach((e) => {
      const [path, vals] = e.dataset.show.split('=');
      e.hidden = !vals.split('|').includes(String(getPath(H.doc(), path)));
    });
  }

  /* ================= Liste editörleri ================= */
  const SEC = (arr) => arr.map(([v, ad]) => ({ v, ad }));
  const LISTS = {
    ilgi: {
      host: '#list-ilgi', baslik: (_, i) => `İlgi ${i + 1}`,
      yeni: () => ({ tur: 'belge', idare: '', idareYok: false, tarih: '', sayi: '', belge: 'yazı', kisiAd: '', kisiSoyad: '' }),
      alanlar: [
        { k: 'tur', ad: 'Tür', t: 'select', wide: true, yeniden: true, sec: SEC([['belge', 'Belge (yazı)'], ['basvuru', 'Gerçek kişi başvurusu / dilekçesi'], ['isimsiz', 'İsimsiz ve tarihsiz başvuru/dilekçe']]) },
        { k: 'idare', ad: 'Gönderen idare', t: 'text', wide: true, ph: 'Millî Eğitim Bakanlığı', if: (i) => i.tur === 'belge' },
        { k: 'idareYok', ad: 'Belge, muhatap idarenin yazısı / muhataba daha önce gönderilmiş (idare adı yazılmaz)', t: 'check', wide: true, if: (i) => i.tur === 'belge' },
        { k: 'tarih', ad: 'Tarih', t: 'date', if: (i) => i.tur !== 'isimsiz' },
        { k: 'sayi', ad: 'Sayı', t: 'text', ph: 'E-12345678-903.07.02-1234', if: (i) => i.tur === 'belge' },
        { k: 'belge', ad: 'Belge türü', t: 'text', ph: 'yazı', if: (i) => i.tur === 'belge' },
        { k: 'belge', ad: 'Belge türü', t: 'select', if: (i) => i.tur === 'basvuru', sec: SEC([['dilekçe', 'Dilekçe'], ['başvuru', 'Başvuru']]) },
        { k: 'kisiAd', ad: 'Başvuru sahibi adı (muhatap dışındaysa)', t: 'text', if: (i) => i.tur === 'basvuru' },
        { k: 'kisiSoyad', ad: 'Soyadı', t: 'text', if: (i) => i.tur === 'basvuru' },
      ],
    },
    imza: {
      host: '#list-imza', baslik: (_, i) => `İmzacı ${i + 1}`, min: 1,
      yeni: () => ({ onUnvan: '', ad: '', soyad: '', unvan: '', tip: 'normal', makam: '' }),
      alanlar: [
        { k: 'tip', ad: 'İmza biçimi', t: 'select', wide: true, yeniden: true, sec: SEC([['normal', 'Kendi unvanıyla'], ['ae', 'Yetki devri (Vali a.)'], ['vekalet', 'Vekâleten (Genel Müdür V.)']]) },
        { k: 'onUnvan', ad: 'Akademik unvan / rütbe (isteğe bağlı)', t: 'text', wide: true, ph: 'Prof. Dr.' },
        { k: 'ad', ad: 'Ad', t: 'text', ph: 'Ahmet' },
        { k: 'soyad', ad: 'Soyad', t: 'text', ph: 'Yılmaz' },
        { k: 'makam', ad: 'Yetkiyi devreden makam (ör. Vali, Bakan)', t: 'text', wide: true, if: (i) => i.tip === 'ae' },
        { k: 'makam', ad: 'Vekâlet edilen makam (ör. Genel Müdür)', t: 'text', wide: true, if: (i) => i.tip === 'vekalet' },
        { k: 'unvan', ad: 'Unvan', t: 'text', wide: true, ph: 'Vali Yardımcısı', if: (i) => i.tip !== 'vekalet' },
      ],
    },
    'olur.katilan': {
      host: '#list-olur-katilan', baslik: (_, i) => `Katılan makam ${i + 1}`,
      yeni: () => ({ ad: '', soyad: '', unvan: '' }),
      alanlar: [
        { k: 'ad', ad: 'Ad', t: 'text' }, { k: 'soyad', ad: 'Soyad', t: 'text' },
        { k: 'unvan', ad: 'Unvan', t: 'text', wide: true },
      ],
    },
    'ek.liste': {
      host: '#list-ek', baslik: (_, i) => `Ek ${i + 1}`,
      yeni: () => ({ ad: '', aciklama: '', gonderilmez: false }),
      alanlar: [
        { k: 'ad', ad: 'Ek adı', t: 'text', wide: true, ph: 'Personel listesi' },
        { k: 'aciklama', ad: 'Açıklama (sayfa, adet…)', t: 'text', wide: true, ph: '3 sayfa' },
        { k: 'gonderilmez', ad: 'Muhataba gönderilmiyor (“Ek konulmadı”)', t: 'check', wide: true },
      ],
    },
    paraf: {
      host: '#list-paraf', baslik: (_, i) => `Paraf ${i + 1}`,
      yeni: () => ({ tarih: '', unvan: '', ad: '', soyad: '' }),
      alanlar: [
        { k: 'tarih', ad: 'Tarih', t: 'date' }, { k: 'unvan', ad: 'Unvan (kısaltmasız)', t: 'text' },
        { k: 'ad', ad: 'Ad', t: 'text' }, { k: 'soyad', ad: 'Soyad', t: 'text' },
      ],
    },
    koordinasyon: {
      host: '#list-koordinasyon', baslik: (_, i) => `Koordinasyon ${i + 1}`,
      yeni: () => ({ unvan: '', ad: '', soyad: '' }),
      alanlar: [
        { k: 'unvan', ad: 'Unvan', t: 'text', wide: true },
        { k: 'ad', ad: 'Ad', t: 'text' }, { k: 'soyad', ad: 'Soyad', t: 'text' },
      ],
    },
  };

  function mk(tag, props, ...kids) {
    const e = document.createElement(tag);
    Object.assign(e, props || {});
    kids.forEach((k) => e.append(k));
    return e;
  }

  function renderList(key) {
    const def = LISTS[key];
    const host = $(def.host);
    const arr = getPath(H.doc(), key);
    host.replaceChildren();
    arr.forEach((item, idx) => {
      const card = mk('div', { className: 'item' });
      const head = mk('div', { className: 'item-head' }, mk('span', { textContent: def.baslik(item, idx) }));
      const btns = mk('div', { className: 'btns' });
      const mkBtn = (txt, label, fn, disabled) => {
        const b = mk('button', { type: 'button', textContent: txt, title: label, disabled: !!disabled });
        b.setAttribute('aria-label', label);
        b.addEventListener('click', fn);
        return b;
      };
      btns.append(
        mkBtn('↑', 'Yukarı taşı', () => { arr.splice(idx - 1, 0, arr.splice(idx, 1)[0]); renderList(key); H.changed(key); }, idx === 0),
        mkBtn('↓', 'Aşağı taşı', () => { arr.splice(idx + 1, 0, arr.splice(idx, 1)[0]); renderList(key); H.changed(key); }, idx === arr.length - 1),
        mkBtn('✕', 'Sil', () => { if (def.min && arr.length <= def.min) return; arr.splice(idx, 1); renderList(key); H.changed(key); }, def.min && arr.length <= def.min),
      );
      head.append(btns);
      const grid = mk('div', { className: 'fgrid' });
      def.alanlar.forEach((f) => {
        if (f.if && !f.if(item)) return;
        let ctl;
        if (f.t === 'check') {
          ctl = mk('label', { className: 'check wide' });
          const cb = mk('input', { type: 'checkbox', checked: !!item[f.k] });
          cb.addEventListener('change', () => { item[f.k] = cb.checked; H.changed(key); });
          ctl.append(cb, document.createTextNode(' ' + f.ad));
        } else {
          ctl = mk('label', { className: f.wide ? 'wide' : '' }, document.createTextNode(f.ad));
          let inp;
          if (f.t === 'select') {
            inp = mk('select');
            f.sec.forEach((o) => inp.append(mk('option', { value: o.v, textContent: o.ad })));
            inp.value = item[f.k];
          } else {
            inp = mk('input', { type: f.t === 'date' ? 'date' : 'text', value: item[f.k] || '', placeholder: f.ph || '' });
          }
          inp.addEventListener('input', () => {
            item[f.k] = inp.value;
            if (f.yeniden) renderList(key);
            H.changed(key);
          });
          ctl.append(inp);
        }
        grid.append(ctl);
      });
      card.append(head, grid);
      host.append(card);
    });
  }
  function renderLists() {
    Object.keys(LISTS).forEach(renderList);
  }
  function bindLists() {
    $$('[data-add]').forEach((b) =>
      b.addEventListener('click', () => {
        const key = b.dataset.add;
        getPath(H.doc(), key).push(LISTS[key].yeni());
        renderList(key);
        H.changed(key);
        const sec = $(LISTS[key].host).closest('details');
        if (sec) sec.open = true;
        const last = $(LISTS[key].host).lastElementChild;
        const f = last && last.querySelector('input,select');
        if (f) f.focus();
      }),
    );
  }

  /* ================= Logo yükleme ================= */
  function kucult(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(new Error('Dosya okunamadı'));
      fr.onload = () => {
        if (file.type === 'image/svg+xml') return res(fr.result);
        const im = new Image();
        im.onerror = () => rej(new Error('Görsel açılamadı'));
        im.onload = () => {
          const max = 700;
          const k = Math.min(1, max / Math.max(im.width, im.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(im.width * k);
          cv.height = Math.round(im.height * k);
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          res(cv.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function bindLogo() {
    $$('[data-logo]').forEach((inp) =>
      inp.addEventListener('change', async () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        try {
          H.doc().logo[inp.dataset.logo] = await kucult(f);
          H.changed('logo');
        } catch (e) {
          toast(e.message);
        }
      }),
    );
    $$('[data-logo-sil]').forEach((b) =>
      b.addEventListener('click', () => {
        H.doc().logo[b.dataset.logoSil] = '';
        const inp = $(`[data-logo="${b.dataset.logoSil}"]`);
        if (inp) inp.value = '';
        H.changed('logo');
      }),
    );
  }

  /* ================= Gezinme ================= */
  const SEC_ALIAS = { metin: 'konu' }; // metin ve konu aynı bölümde
  function gotoAlan(alan, aralik) {
    if (H.gorunum) H.gorunum('editor');
    const sec = $(`#sec-${SEC_ALIAS[alan] || alan}`) || $('#sec-meta');
    sec.open = true;
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    sec.classList.remove('flash');
    void sec.offsetWidth;
    sec.classList.add('flash');
    if (aralik && (alan === 'metin' || alan === 'konu')) {
      const ta = alan === 'metin' ? $('#ta-metin') : $('[data-bind="konu"]');
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(aralik.start, aralik.end);
      }, 300);
    }
  }

  /* ================= Bildirim ================= */
  let toastT;
  function toast(msg, eylem) {
    const t = $('#toast');
    t.replaceChildren(document.createTextNode(msg));
    if (eylem) {
      const b = mk('button', { type: 'button', textContent: eylem.ad });
      b.style.cssText = 'margin-left:12px;background:none;border:1px solid #fff6;color:#fff;border-radius:6px;padding:2px 10px;cursor:pointer';
      b.addEventListener('click', () => { eylem.fn(); t.hidden = true; });
      t.append(b);
    }
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.hidden = true), eylem ? 8000 : 3200);
  }
  async function kopyala(metin) {
    try {
      await navigator.clipboard.writeText(metin);
    } catch {
      const ta = mk('textarea', { value: metin });
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Kopyalandı');
  }

  /* ================= Denetim paneli ================= */
  const SEV_AD = { error: 'Hata', warn: 'Uyarı', info: 'Bilgi', ok: 'Geçti', auto: 'Otomatik' };
  const SEV_SIRA = { error: 0, warn: 1, info: 2, auto: 3, ok: 4 };

  function renderResults(v, eylemler) {
    const f = { info: $('#f-info').checked, auto: $('#f-auto').checked, ok: $('#f-ok').checked };
    const o = v.ozet;
    $('#ozet').replaceChildren(
      mk('span', { className: 'pill error', textContent: `${o.error} hata` }),
      mk('span', { className: 'pill warn', textContent: `${o.warn} uyarı` }),
      mk('span', { className: 'pill info', textContent: `${o.info} bilgi` }),
      mk('span', { className: 'pill ok', textContent: `${o.ok} geçen` }),
    );
    const badge = $('#vt-badge');
    const bad = o.error + o.warn;
    badge.textContent = bad || '✓';
    badge.className = 'badge' + (bad ? '' : ' ok');

    const list = v.sonuclar
      .filter((r) => r.sev === 'error' || r.sev === 'warn' || f[r.sev])
      .map((r, i) => ({ r, i }))
      .sort((a, b) => SEV_SIRA[a.r.sev] - SEV_SIRA[b.r.sev] || a.i - b.i)
      .map((x) => x.r);

    const ul = $('#sonuclar');
    ul.replaceChildren();
    if (!list.length) ul.append(mk('li', { className: 'empty', textContent: 'Gösterilecek bulgu yok.' }));
    list.forEach((r) => {
      const li = mk('li', { className: `res ${r.sev}` });
      const top = mk('div', { className: 'top' }, mk('span', { className: `tag ${r.sev}`, textContent: SEV_AD[r.sev] }), mk('span', { className: 'ref', textContent: `${r.kaynak} · ${String(r.ref).replace(/^TDK:\s*/, '')}` }));
      const msg = mk('div', { className: 'msg' });
      msg.append(document.createTextNode(r.msg));
      const gor = (x) => (/^\s+$/.test(x) ? x.replace(/ /g, '·') : x);
      if (r.bul !== undefined && r.repl !== undefined) {
        msg.append(mk('br'), mk('mark', { textContent: gor(r.bul) || '(yok)' }), document.createTextNode(' → '), mk('mark', { textContent: gor(r.repl) || '(sil)' }));
      } else if (r.bul) {
        msg.append(mk('br'), mk('mark', { textContent: r.bul }));
      }
      const acts = mk('div', { className: 'acts' });
      if (r.fix && (r.fix.issue ? r.repl !== undefined : r.fix.tip === 'bosSatirSil')) {
        const b = mk('button', { type: 'button', className: 'fix', textContent: 'Düzelt' });
        b.addEventListener('click', () => eylemler.duzelt(r));
        acts.append(b);
      }
      if (r.oneri) {
        r.oneri.forEach((s) => {
          const b = mk('button', { type: 'button', textContent: `Ekle: ${s}` });
          b.addEventListener('click', () => eylemler.kapanis(s));
          acts.append(b);
        });
      }
      if (r.alan) {
        const b = mk('button', { type: 'button', textContent: 'Alana git' });
        const ar = r.fix && r.fix.issue ? { start: r.fix.issue.start, end: r.fix.issue.end } : null;
        b.addEventListener('click', () => gotoAlan(r.alan, ar));
        acts.append(b);
      }
      li.append(top, msg);
      if (acts.childElementCount) li.append(acts);
      ul.append(li);
    });
  }

  /* ================= EBYS aktarım ================= */
  function renderEbys(alanlar) {
    const host = $('#ebys-alanlar');
    host.replaceChildren();
    const hepsi = mk('button', { type: 'button', className: 'small', textContent: 'Tümünü kopyala' });
    hepsi.addEventListener('click', () => kopyala(alanlar.map((a) => `${a.ad}:\n${a.deger}`).join('\n\n')));
    host.append(hepsi);
    alanlar.forEach((a) => {
      const box = mk('div', { className: 'ebys-f' });
      const b = mk('button', { type: 'button', className: 'small', textContent: 'Kopyala' });
      b.addEventListener('click', () => kopyala(a.deger));
      box.append(mk('header', {}, mk('span', { textContent: a.ad }), b), mk('pre', { textContent: a.deger || '—' }));
      if (a.not) box.append(mk('div', { className: 'not', textContent: a.not }));
      host.append(box);
    });
  }

  /* ================= Kurallar ================= */
  const MOD_AD = { otomatik: 'Otomatik uygulanır', denetim: 'Denetlenir', elle: 'EBYS / elle' };
  function renderKurallar(q) {
    const host = $('#kural-liste');
    host.replaceChildren();
    const s = (q || '').toLocaleLowerCase('tr-TR').trim();
    ['Yönetmelik', 'TDK'].forEach((kaynak) => {
      const items = KY.RULES.filter((r) => r.kaynak === kaynak && (!s || `${r.ref} ${r.baslik} ${r.ozet}`.toLocaleLowerCase('tr-TR').includes(s)));
      if (!items.length) return;
      host.append(mk('div', { className: 'kural-grup', textContent: kaynak === 'TDK' ? 'TDK Yazım Kuralları' : 'Resmî Yazışma Yönetmeliği' }));
      items.forEach((r) => {
        const d = mk('div', { className: 'kural' });
        d.append(mk('h4', {}, mk('span', { textContent: `${r.ref} · ${r.baslik}` }), mk('span', { className: `mod ${r.mod}`, textContent: MOD_AD[r.mod] })), mk('p', { textContent: r.ozet }));
        host.append(d);
      });
    });
    if (!host.childElementCount) host.append(mk('p', { className: 'hint', textContent: 'Eşleşen kural yok.' }));
  }
  function renderTdk23() {
    const host = $('#tdk23');
    const tb = mk('table', { className: 't23' });
    tb.append(mk('thead', {}, mk('tr', {}, ...['No', 'Eski hâli', 'Güncel hâli'].map((h) => mk('th', { textContent: h })))));
    const body = mk('tbody');
    KY.TDK2023.forEach((e, i) => body.append(mk('tr', {}, mk('td', { textContent: i + 1 }), mk('td', { textContent: e.eski }), mk('td', { textContent: e.guncel + (e.ek ? ` (${e.ek})` : '') }))));
    tb.append(body);
    host.append(tb, mk('p', { className: 't23-not', textContent: 'Listedeki tüm kelimeler 27.09.2023 itibarıyla TDK’nin resmî sitesinden teyit edilmiştir (PDF kaynağı).' }));
    KY.TDK2023_NOTLAR.forEach((n, i) => host.append(mk('p', { className: 't23-not', textContent: `${i + 1}- ${n}` })));
  }

  /* ================= Kapanış çipleri ================= */
  function renderKapanis() {
    const host = $('#kapanis-chips');
    host.replaceChildren();
    const spec = KY.KAPANIS[H.doc().meta.yon];
    if (!spec) return;
    spec.oneri.forEach((s) => {
      const b = mk('span', { className: 'chip', textContent: s, role: 'button', tabIndex: 0 });
      const ekle = () => H.kapanis(s);
      b.addEventListener('click', ekle);
      b.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), ekle()));
      host.append(b);
    });
  }

  function init(h) {
    H = Object.assign(H, h);
    const sel = $('#sel-yon');
    KY.YON_SECENEKLERI.forEach((y) => sel.append(mk('option', { value: y.v, textContent: y.ad })));
    const sb = $('#sel-sablon');
    KY.SABLONLAR.forEach((s) => sb.append(mk('option', { value: s.id, textContent: s.ad })));
    bindStatic();
    bindLists();
    bindLogo();
    renderTdk23();
    renderKurallar('');
    $('#kural-ara').addEventListener('input', (e) => renderKurallar(e.target.value));
  }

  KY.ui = { init, populate, syncPath, applyVisibility, renderLists, renderResults, renderEbys, renderKapanis, goto: gotoAlan, toast, kopyala, getPath, setPath };
})();
