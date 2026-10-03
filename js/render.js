/* A4 sayfa düzeni: derlenmiş belgeyi (compose çıktısı) bloklara ayırıp sayfalara akıtır.
 * Yönetmelik düzeni: m.6 (A4), m.8 (1,5 cm yazı alanı), m.9-27 (bölümler), m.16/5 (çok sayfalı belge). */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});

  const FONTS = {
    tnr: '"Times New Roman", Tinos, "Liberation Serif", Times, serif',
    arial: 'Arial, Arimo, "Liberation Sans", Helvetica, sans-serif',
  };
  const SATIR = 1.2; // satır yüksekliği (em)

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const kv = (label, value, cls) => {
    const d = el('div', 'kv ' + (cls || ''));
    d.append(el('span', 'k', label), el('span', 'c', ':'), el('span', 'v', value));
    return d;
  };

  /** Bloklar: { el, mt (satır), alan, para?, keep? (bir sonrakiyle aynı sayfada), brk? (yeni sayfa) } */
  function bloklar(doc, c, opt) {
    const B = [];
    const m = doc.meta;
    const E = m.ortam === 'E';
    const push = (e, o) => {
      B.push(Object.assign({ el: e, mt: 0 }, o));
      return e;
    };

    /* ---- Başlık + logo + süreli bayrakları */
    const hd = el('div', 'hd mod-' + doc.logo.mod);
    const txt = el('div', 'hd-text');
    c.baslik.forEach((s, i) => txt.append(el('div', i === 0 ? 'hd-tc' : 'hd-line', s)));
    const logo = (src) => {
      const b = el('div', 'hd-logo');
      if (src) {
        const im = el('img');
        im.src = src;
        im.alt = 'Kurumsal logo';
        b.append(im);
      } else b.classList.add('bos');
      return b;
    };
    if (doc.logo.mod === 'orta') hd.append(logo(doc.logo.sol), txt);
    else if (doc.logo.mod === 'sol') hd.append(logo(doc.logo.sol), txt, el('div', 'hd-logo gizli'));
    else if (doc.logo.mod === 'iki') hd.append(logo(doc.logo.sol), txt, logo(doc.logo.sag));
    else hd.append(txt);
    if (c.bayraklar.length) {
      const fl = el('div', 'flags');
      c.bayraklar.forEach((b) => fl.append(el('div', '', b)));
      hd.append(fl);
    }
    push(hd, { alan: 'baslik' });

    /* ---- Sayı + tarih */
    const sr = el('div', 'sayi-row');
    sr.append(kv('Sayı', c.sayi), el('div', 'tarih', c.tarih || '……'));
    push(sr, { mt: 2, alan: 'sayi' });

    /* ---- Konu */
    push(kv('Konu', c.konu || '……', 'konu'), { mt: 0, alan: 'konu' });

    /* ---- Muhatap */
    const mu = el('div', 'muhatap');
    c.muhatap.forEach((s, i) => mu.append(el('div', i === 0 && !/^\(/.test(s) ? 'mu-ad' : 'mu-alt', s)));
    c.adres.forEach((s) => mu.append(el('div', 'mu-adres', s)));
    if (!c.muhatap.length) mu.append(el('div', 'mu-ad', '……'));
    push(mu, { mt: 2, alan: 'muhatap' });

    /* ---- İlgi */
    if (c.ilgi.length) {
      const ig = el('div', 'ilgi');
      ig.append(el('span', 'k', 'İlgi'), el('span', 'c', ':'));
      const list = el('div', 'ilgi-list');
      c.ilgi.forEach((i) => {
        const r = el('div', 'ilgi-item' + (i.harf ? ' harfli' : ''));
        if (i.harf) r.append(el('span', 'h', i.harf));
        r.append(el('span', 'tx', i.metin));
        list.append(r);
      });
      ig.append(list);
      push(ig, { mt: 2, alan: 'ilgi' });
    }

    /* ---- Metin */
    const paragraflar = c.paragraflar.length ? c.paragraflar : ['……'];
    paragraflar.forEach((p, i) => {
      const pe = el('p', 'para', p);
      push(pe, { mt: i === 0 ? (c.ilgi.length ? 1 : 2) : 0, alan: 'metin', para: true });
    });
    const sonPara = B[B.length - 1];

    /* ---- İmza (son paragrafla aynı sayfada tutulur) */
    const imz = el('div', 'imza n' + Math.min(c.imzaSirasi.length, 3));
    c.imzaSirasi.forEach((s) => {
      const d = el('div', 'sig');
      s.satirlar.forEach((l, i) => d.append(el('div', i === 0 ? 'sig-ad' : 'sig-alt', l)));
      imz.append(d);
    });
    sonPara.keep = true;
    push(imz, { mt: E ? 3 : 4, alan: 'imza', keep: !!c.olur });

    /* ---- Olur */
    if (c.olur) {
      c.olur.katilan.forEach((k) => {
        const o = el('div', 'olur-katilan');
        const kutu = el('div', 'olur-kutu');
        kutu.append(el('div', '', 'Uygun görüşle arz ederim.'));
        const nm = el('div', 'olur-ad');
        k.forEach((l) => nm.append(el('div', '', l)));
        kutu.append(nm);
        o.append(kutu);
        push(o, { mt: 2, alan: 'imza', keep: true });
      });
      const ol = el('div', 'olur');
      ol.append(el('div', 'olur-ibare', 'OLUR'));
      if (!E) ol.append(el('div', 'olur-tarih', ' '));
      c.olur.satirlar.forEach((l, i) => ol.append(el('div', i === 0 ? 'olur-ad1' : 'olur-ad2', l)));
      push(ol, { mt: 2, alan: 'imza' });
    }

    /* ---- Ek */
    if (c.ek.liste.length) {
      const ek = el('div', 'ek');
      if (c.ek.ayriSayfa) ek.append(kv('Ek', 'Ek Listesi', 'ek1'));
      else if (c.ek.liste.length === 1) ek.append(kv('Ek', c.ek.liste[0].metin, 'ek1'));
      else {
        ek.append(el('div', 'ek-b', 'Ek:'));
        c.ek.liste.forEach((e) => {
          const r = el('div', 'ek-item');
          r.append(el('span', 'no', `${e.no}-`), el('span', '', e.metin));
          ek.append(r);
        });
      }
      if (c.ek.konulmadi) ek.append(el('div', 'ek-konulmadi', c.ek.konulmadi));
      push(ek, { mt: 2, alan: 'ek' });
    }

    /* ---- Dağıtım */
    const dagitimGovdesi = () => {
      const g = el('div', 'dag');
      if (c.dagitim.bilgi.length) {
        const sol = el('div', 'dag-sol');
        const sag = el('div', 'dag-sag');
        if (c.dagitim.geregi.length) {
          sol.append(el('div', 'dag-b', 'Gereği:'));
          c.dagitim.geregi.forEach((x) => sol.append(el('div', '', x)));
        }
        sag.append(el('div', 'dag-b', 'Bilgi:'));
        c.dagitim.bilgi.forEach((x) => sag.append(el('div', '', x)));
        g.append(sol, sag);
      } else {
        const sol = el('div', 'dag-tek');
        c.dagitim.geregi.forEach((x) => sol.append(el('div', '', x)));
        g.append(sol);
      }
      return g;
    };
    if (c.dagitim.var) {
      const dg = el('div', 'dagitim');
      dg.append(el('div', 'dag-baslik', 'Dağıtım:'));
      if (c.dagitim.ayriSayfa) dg.append(el('div', 'dag-liste-ibare', 'DAĞITIM LİSTESİ'));
      else dg.append(dagitimGovdesi());
      push(dg, { mt: c.ek.liste.length ? 1 : 2, alan: 'dagitim' });
    }

    /* ---- Paraf / koordinasyon (yalnız fiziksel ortamda, idarede kalan nüsha) */
    if (!E && opt.parafGoster && (c.paraf.length || c.koordinasyon.length)) {
      const pr = el('div', 'paraf');
      if (c.paraf.length) {
        pr.append(el('div', 'pr-b', 'Paraf'));
        c.paraf.forEach((l) => pr.append(el('div', '', l)));
      }
      if (c.koordinasyon.length) {
        pr.append(el('div', 'pr-b', 'Koordinasyon'));
        c.koordinasyon.forEach((l) => pr.append(el('div', '', l)));
      }
      push(pr, { mt: 2, alan: 'paraf' });
    }

    /* ---- Ayrı sayfalar: Ek Listesi, Dağıtım Listesi */
    if (c.ek.liste.length && c.ek.ayriSayfa) {
      const s = el('div', 'liste-sayfa');
      s.append(el('div', 'liste-baslik', 'EK LİSTESİ'));
      c.ek.liste.forEach((e) => {
        const r = el('div', 'ek-item');
        r.append(el('span', 'no', `${e.no}-`), el('span', '', e.metin));
        s.append(r);
      });
      push(s, { brk: true, alan: 'ek' });
    }
    if (c.dagitim.var && c.dagitim.ayriSayfa) {
      const s = el('div', 'liste-sayfa');
      s.append(el('div', 'liste-baslik', 'DAĞITIM LİSTESİ'));
      s.append(dagitimGovdesi());
      push(s, { brk: true, alan: 'dagitim' });
    }
    return B;
  }

  function altBilgi(doc, c, no, toplam) {
    const m = doc.meta;
    const f = el('div', 'footer');
    if (m.gizlilik) f.append(el('div', 'gizlilik', m.gizlilik.toLocaleUpperCase('tr-TR')));
    if (m.ortam === 'E') {
      const d = el('div', 'dogrulama');
      d.append(el('div', '', 'Bu belge, güvenli elektronik imza ile imzalanmıştır.'));
      const kod = String(doc.iletisim.dogrulama || '').trim();
      d.append(el('div', '', `Belge Doğrulama Kodu: ${kod || '…………………'}   Doğrulama Adresi: https://www.turkiye.gov.tr/belge-dogrulama`));
      f.append(d);
    }
    const ic = el('div', 'iletisim');
    const sol = el('div', 'ic-sol');
    c.iletisim.sol.forEach((s) => sol.append(el('div', '', s)));
    const sag = el('div', 'ic-sag');
    c.iletisim.sag.forEach((s) => sag.append(el('div', '', s)));
    ic.append(sol, sag);
    if (m.ortam === 'E') {
      const q = el('div', 'karekod');
      q.append(el('span', '', 'karekod'));
      q.title = 'Karekodu EBYS üretir';
      ic.append(q);
    }
    f.append(ic);
    const sn = el('div', 'sayfano', toplam > 1 ? `Sayfa ${no}/${toplam}` : ' ');
    f.append(sn);
    return f;
  }

  /**
   * Dönüş: { pages: HTMLElement[], sayfa, tasan }.
   * Sayfalar ölçüm için ekran dışında kurulur; çağıran, dönen düğümleri kendi kabına taşır.
   */
  function render(doc, c, opt = {}) {
    const host = el('div', 'measure-host');
    document.body.append(host);
    const m = doc.meta;
    const font = FONTS[m.font] || FONTS.tnr;
    const logoVar = doc.logo.mod !== 'yok';
    const pages = [];
    let tasan = false;

    const yeniSayfa = () => {
      const p = el('section', 'page' + (m.kalin === false ? ' duz' : ''));
      p.style.setProperty('--font', font);
      p.style.setProperty('--fs', `${m.punto}pt`);
      p.style.setProperty('--ifs', `${m.iletisimPunto}pt`);
      p.style.setProperty('--mt', pages.length === 0 && logoVar ? '5mm' : '15mm');
      const body = el('div', 'content');
      p.append(body);
      p.append(altBilgi(doc, c, 1, 2));
      host.append(p);
      pages.push(p);
      return body;
    };
    const dolu = (body) => body.scrollHeight - body.clientHeight > 1;
    const marj = (b) => {
      b.el.style.marginTop = b.mt ? `${(b.mt * SATIR).toFixed(2)}em` : '0';
      if (b.alan) b.el.dataset.alan = b.alan;
    };

    let body = yeniSayfa();
    const blokYerlestir = (b) => {
      marj(b);
      body.append(b.el);
      if (!dolu(body)) return true;
      b.el.remove();
      return false;
    };

    /** Paragrafı sığdığı kadar bölerek yerleştirir; kalan metni döndürür. */
    const bolYerlestir = (b) => {
      const tam = b.el.textContent;
      const words = tam.split(/\s+/);
      const n = words.length;
      marj(b);
      body.append(b.el);
      let lo = 0;
      let hi = n;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        b.el.textContent = words.slice(0, mid).join(' ');
        if (dolu(body)) hi = mid - 1;
        else lo = mid;
      }
      let k = lo;
      const satirAdet = () => Math.round(b.el.offsetHeight / (parseFloat(getComputedStyle(b.el).fontSize) * SATIR));
      if (k >= 1 && n - k < 12 && k - (12 - (n - k)) >= 6) k -= 12 - (n - k); // tek satırlık artık bırakma
      b.el.textContent = words.slice(0, k).join(' ');
      if (k === 0 || (k < n && satirAdet() < 2)) {
        b.el.textContent = tam;
        b.el.remove();
        return { kalan: b };
      }
      if (k >= n) return { kalan: null };
      b.el.classList.add('devam-sonraki');
      const ek = el('p', 'para devam', words.slice(k).join(' '));
      return { kalan: { el: ek, mt: 0, alan: b.alan, para: true, keep: b.keep } };
    };

    const B = bloklar(doc, c, opt);
    let i = 0;
    while (i < B.length) {
      // keep zinciri: [b, b+1, ...] son eleman keep=false
      let j = i;
      while (j < B.length - 1 && B[j].keep) j++;
      const grup = B.slice(i, j + 1);
      i = j + 1;

      if (grup[0].brk && body.childElementCount) body = yeniSayfa();

      if (grup.length > 1) {
        const hepsi = () => grup.every((b) => blokYerlestir(b) || (grup.forEach((x) => x.el.remove()), false));
        if (hepsi()) continue;
        if (body.childElementCount) body = yeniSayfa();
        if (hepsi()) continue;
      }
      for (const b0 of grup) {
        let b = b0;
        while (b) {
          if (blokYerlestir(b)) break;
          if (b.para) {
            const r = bolYerlestir(b);
            if (r.kalan === null) break;
            if (r.kalan === b && !body.childElementCount) {
              tasan = true;
              body.append(b.el);
              break;
            }
            body = yeniSayfa();
            b = r.kalan;
            continue;
          }
          if (body.childElementCount) {
            body = yeniSayfa();
            continue;
          }
          tasan = true; // tek başına sayfaya sığmayan blok
          marj(b);
          body.append(b.el);
          break;
        }
      }
    }

    // Alt bilgileri nihai sayfa sayısıyla yenile
    const toplam = pages.length;
    pages.forEach((p, k) => {
      p.querySelector('.footer').replaceWith(altBilgi(doc, c, k + 1, toplam));
    });
    pages.forEach((p) => p.remove());
    host.remove();
    return { pages, sayfa: toplam, tasan };
  }

  KY.render = render;
  KY.FONTS = FONTS;
})();
