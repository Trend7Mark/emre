/* =========================================================
   Bitlis Eğitim İzleme — uygulama mantığı
   Bağımlılık yok, derleme adımı yok.
   ========================================================= */
'use strict';

const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const durum = {
  veri: null,
  gostergeVeri: null,
  katHarita: new Map(),
  durumHarita: new Map(),
  filtre: { arama: '', kategori: 'hepsi', ilce: 'hepsi', dogrulama: 'hepsi', sira: 'yeni' }
};

/* ---------- yardımcılar ---------- */

const $ = (sec) => document.querySelector(sec);

function kacis(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function tarihYaz(iso, kesin, not) {
  if (!iso) return { kisa: 'Tarihsiz', uzun: not || 'Tarih doğrulanamadı', belirsiz: true };
  const [y, a, g] = iso.split('-').map(Number);
  const ayAd = AY[a - 1] || '';
  if (kesin === false) {
    return { kisa: `${ayAd} ${y}`, uzun: `${ayAd} ${y}${not ? ' — ' + not : ''}`, belirsiz: true };
  }
  return { kisa: `${g} ${ayAd.slice(0, 3)} ${y}`, uzun: `${g} ${ayAd} ${y}${not ? ' — ' + not : ''}`, belirsiz: false };
}

function siraAnahtari(k) {
  return k.tarih ? k.tarih : '0000-00-00';
}

function normalize(s) {
  return String(s).toLocaleLowerCase('tr-TR')
    .replace(/[ıi̇]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
}

/* ---------- veri yükleme ---------- */

async function yukle() {
  try {
    const [k, g] = await Promise.all([
      fetch('data/kayitlar.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch('data/gostergeler.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    ]);
    durum.veri = k;
    durum.gostergeVeri = g;
    k.kategoriler.forEach((x) => durum.katHarita.set(x.id, x));
    k.durumlar.forEach((x) => durum.durumHarita.set(x.id, x));
    kur();
  } catch (e) {
    $('#kartListesi').innerHTML = `
      <div class="uyari-kutu">
        <strong>Veri yüklenemedi</strong>
        <p>Sayfa dosya sisteminden (<code>file://</code>) açıldıysa tarayıcı JSON okumasını engeller.
        Klasörde bir yerel sunucu başlatın:</p>
        <p><code>python3 -m http.server 8000</code> &nbsp;→&nbsp; <code>http://localhost:8000</code></p>
      </div>`;
    console.error('Veri yükleme hatası:', e);
  }
}

/* ---------- kurulum ---------- */

function kur() {
  cipleriKur();
  secimleriKur();
  yontemPaneliKur();
  gostergePaneliKur();
  olaylariBagla();
  ciz();
  $('#veriDamgasi').textContent =
    `Veri sürümü ${durum.veri.surum} — son güncelleme ${tarihYaz(durum.veri.guncelleme, true).uzun}. ` +
    `${durum.veri.kayitlar.length} kayıt, ${durum.veri.haricTutulanlar.length} hariç tutulan haber.`;
  $('#markaAlt').textContent = `${durum.veri.kayitlar.length} kayıt · ${tarihYaz(durum.veri.guncelleme, true).kisa} güncel`;
  hashOku();
}

function kategoriSayisi(katId) {
  return durum.veri.kayitlar.filter((k) => k.kategori === katId).length;
}

function cipleriKur() {
  const serit = $('#kategoriSerit');
  const hepsi = `<button type="button" class="cip aktif" data-kategori="hepsi">
      Tümü <span class="cip-sayi">${durum.veri.kayitlar.length}</span></button>`;
  const digerleri = durum.veri.kategoriler.map((k) => `
    <button type="button" class="cip" data-kategori="${kacis(k.id)}" style="--cip-renk:${kacis(k.renk)}">
      <span class="cip-nokta"></span>${kacis(k.kisa)}
      <span class="cip-sayi">${kategoriSayisi(k.id)}</span>
    </button>`).join('');
  serit.innerHTML = hepsi + digerleri;
}

function secimleriKur() {
  const ilceler = ['hepsi'].concat(durum.veri.ilceler);
  $('#ilceSecim').innerHTML = ilceler.map((i) =>
    `<option value="${kacis(i)}">${i === 'hepsi' ? 'Tümü' : kacis(i)}</option>`).join('');

  const durumlar = ['hepsi'].concat(durum.veri.durumlar.map((d) => d.id));
  $('#durumSecim').innerHTML = durumlar.map((d) => {
    if (d === 'hepsi') return '<option value="hepsi">Tümü</option>';
    const o = durum.durumHarita.get(d);
    return `<option value="${kacis(d)}">${kacis(o.kisa)}</option>`;
  }).join('');
}

/* ---------- filtreleme ---------- */

function filtrele() {
  const f = durum.filtre;
  const q = f.arama.trim() ? normalize(f.arama.trim()) : '';

  let liste = durum.veri.kayitlar.filter((k) => {
    if (f.kategori !== 'hepsi' && k.kategori !== f.kategori) return false;
    if (f.ilce !== 'hepsi' && !(k.ilce || []).includes(f.ilce)) return false;
    if (f.dogrulama !== 'hepsi' && k.durum !== f.dogrulama) return false;
    if (!q) return true;
    const havuz = [
      k.baslik, k.ozet, (k.etiketler || []).join(' '),
      (k.detay || []).join(' '), (k.ilce || []).join(' '),
      (k.kaynaklar || []).map((s) => s.ad).join(' '),
      (k.alintilar || []).map((a) => a.soz + ' ' + a.kaynak).join(' ')
    ].join(' ');
    return normalize(havuz).includes(q);
  });

  if (f.sira === 'yeni') {
    liste.sort((a, b) => siraAnahtari(b).localeCompare(siraAnahtari(a)));
  } else if (f.sira === 'eski') {
    liste.sort((a, b) => {
      if (!a.tarih && !b.tarih) return 0;
      if (!a.tarih) return 1;
      if (!b.tarih) return -1;
      return a.tarih.localeCompare(b.tarih);
    });
  } else {
    const dizi = durum.veri.kategoriler.map((k) => k.id);
    liste.sort((a, b) => {
      const d = dizi.indexOf(a.kategori) - dizi.indexOf(b.kategori);
      return d !== 0 ? d : siraAnahtari(b).localeCompare(siraAnahtari(a));
    });
  }
  return liste;
}

/* ---------- çizim ---------- */

function ciz() {
  const liste = filtrele();
  const kap = $('#kartListesi');
  kap.innerHTML = liste.map(kartHtml).join('');

  const f = durum.filtre;
  const filtreVar = f.arama || f.kategori !== 'hepsi' || f.ilce !== 'hepsi' || f.dogrulama !== 'hepsi';
  $('#sonucSayisi').textContent = filtreVar
    ? `${liste.length} / ${durum.veri.kayitlar.length} kayıt`
    : `${liste.length} kayıt`;
  $('#filtreSifirla').classList.toggle('gizli', !filtreVar);
  $('#bosDurum').classList.toggle('gizli', liste.length !== 0);
  $('#aramaTemizle').classList.toggle('gizli', !f.arama);
}

function kartHtml(k) {
  const kat = durum.katHarita.get(k.kategori) || { ad: k.kategori, renk: '#888', kisa: k.kategori };
  const dur = durum.durumHarita.get(k.durum) || { kisa: k.durum, sinif: '' };
  const t = tarihYaz(k.tarih, k.tarihKesin, k.tarihNotu);
  const ilceler = (k.ilce || []).slice(0, 2)
    .map((i) => `<span class="rozet rozet-ilce">${kacis(i)}</span>`).join('');
  const fazla = (k.ilce || []).length > 2
    ? `<span class="rozet rozet-ilce">+${k.ilce.length - 2}</span>` : '';
  const kaynakSayisi = (k.kaynaklar || []).length;
  const yerelVar = (k.kaynaklar || []).some((s) => s.yerel);

  return `
  <button type="button" class="kart" data-id="${kacis(k.id)}" style="--kat-renk:${kacis(kat.renk)}">
    <div class="kart-ust">
      <span class="rozet rozet-kategori">${kacis(kat.kisa)}</span>
      <span class="rozet rozet-durum ${kacis(dur.sinif)}">${kacis(dur.kisa)}</span>
      <span class="kart-tarih${t.belirsiz ? ' belirsiz' : ''}">${kacis(t.kisa)}</span>
    </div>
    <h3 class="kart-baslik">${kacis(k.baslik)}</h3>
    <p class="kart-ozet">${kacis(k.ozet)}</p>
    <div class="kart-alt">
      ${ilceler}${fazla}
      <span class="oku">${kaynakSayisi} kaynak${yerelVar ? ' <span class="yerel-isaret">· yerel</span>' : ''} →</span>
    </div>
  </button>`;
}

/* ---------- detay ---------- */

function detayAc(id, hashYaz = true) {
  const k = durum.veri.kayitlar.find((x) => x.id === id);
  if (!k) return;
  const kat = durum.katHarita.get(k.kategori) || { ad: k.kategori, renk: '#888' };
  const dur = durum.durumHarita.get(k.durum) || { ad: k.durum, kisa: k.durum, sinif: '', aciklama: '' };
  const t = tarihYaz(k.tarih, k.tarihKesin, k.tarihNotu);

  const paragraflar = (k.detay || []).map((p) => `<p>${kacis(p)}</p>`).join('');
  const alintilar = (k.alintilar || []).map((a) => `
    <blockquote class="alinti">
      <p>“${kacis(a.soz)}”</p>
      <cite>— ${kacis(a.kaynak)}</cite>
    </blockquote>`).join('');
  const etiketler = (k.etiketler || []).length ? `
    <p class="detay-baslikcik">Etiketler</p>
    <div class="etiket-serit">
      ${k.etiketler.map((e) => `<span class="etiket">${kacis(e)}</span>`).join('')}
    </div>` : '';
  const kaynaklar = `
    <p class="detay-baslikcik">Kaynaklar (${(k.kaynaklar || []).length})</p>
    <ul class="kaynak-listesi">
      ${(k.kaynaklar || []).map((s) => `
        <li>
          <a href="${kacis(s.url)}" target="_blank" rel="noopener noreferrer">${kacis(s.ad)}</a>
          ${s.yerel ? '<span class="yerel-etiket">YEREL</span>' : ''}
          <span class="dis-ok" aria-hidden="true">↗</span>
        </li>`).join('')}
    </ul>`;

  $('#detayGovde').innerHTML = `
    <div style="--kat-renk:${kacis(kat.renk)}">
      <div class="detay-ust">
        <span class="rozet rozet-kategori">${kacis(kat.ad)}</span>
        <span class="rozet rozet-durum ${kacis(dur.sinif)}">${kacis(dur.kisa)}</span>
      </div>
      <h2 id="detayBaslik">${kacis(k.baslik)}</h2>
      <p class="detay-meta">
        ${kacis(t.uzun)} · ${kacis((k.ilce || []).join(', '))}<br>
        <em>${kacis(dur.aciklama)}</em>
      </p>
      ${paragraflar}
      ${alintilar}
      ${etiketler}
      ${kaynaklar}
    </div>`;

  $('#perde').hidden = false; $('#perde').classList.remove('gizli');
  const sayfa = $('#detaySayfa');
  sayfa.hidden = false; sayfa.classList.remove('gizli');
  document.body.style.overflow = 'hidden';
  $('#detayKapat').focus();
  if (hashYaz) history.pushState({ detay: id }, '', '#' + id);
}

function detayKapat(geriGit = true) {
  const sayfa = $('#detaySayfa');
  if (sayfa.hidden) return;
  sayfa.hidden = true; sayfa.classList.add('gizli');
  $('#perde').hidden = true; $('#perde').classList.add('gizli');
  document.body.style.overflow = '';
  if (geriGit && location.hash) history.pushState({}, '', location.pathname + location.search);
}

function hashOku() {
  const id = location.hash.replace('#', '');
  if (id && durum.veri.kayitlar.some((k) => k.id === id)) detayAc(id, false);
}

/* ---------- göstergeler paneli ---------- */

function gostergePaneliKur() {
  const g = durum.gostergeVeri;
  $('#gostergeListesi').innerHTML = g.gostergeler.map((x) => {
    const kotu = x.yon.startsWith('kotu');
    const yuzdeMi = x.birim === '%';
    const dolgu = yuzdeMi ? Math.min(100, x.deger) : null;
    const kiyasYuzde = (yuzdeMi && x.kiyas) ? Math.min(100, x.kiyas.deger) : null;

    const kiyasYazi = x.kiyas ? x.kiyas.deger.toLocaleString('tr-TR') : '';

    const olcek = yuzdeMi ? `
      <div class="olcek">
        <div class="olcek-cubuk">
          <div class="olcek-dolgu${kotu ? '' : ' iyi'}" style="width:${dolgu}%"></div>
          ${kiyasYuzde !== null ? `<div class="olcek-kiyas" style="left:${kiyasYuzde}%" title="${kacis(x.kiyas.ad)}"></div>` : ''}
        </div>
        <div class="olcek-aciklama">
          <span>0%</span>
          ${x.kiyas ? `<span>▎${kacis(x.kiyas.ad)}: ${kiyasYazi}%</span>` : ''}
          <span>100%</span>
        </div>
      </div>` : (x.kiyas ? `
      <div class="olcek">
        <div class="olcek-aciklama"><span>${kacis(x.kiyas.ad)}: <strong>${kiyasYazi}${kacis(x.birim)}</strong></span></div>
      </div>` : '');

    return `
    <div class="gosterge${x.baglamsal ? ' baglamsal' : ''}">
      <p class="gosterge-ad">${kacis(x.ad)}</p>
      <div>
        <span class="gosterge-deger ${kotu ? 'kotu' : 'iyi'}">${x.deger.toLocaleString('tr-TR')}<span class="birim">${kacis(x.birim)}</span></span>
        <span class="gosterge-yil">${kacis(x.yil)}</span>
      </div>
      ${olcek}
      <p class="gosterge-yorum">${kacis(x.yorum)}</p>
      <p class="gosterge-kaynak"><a href="${kacis(x.kaynak.url)}" target="_blank" rel="noopener noreferrer">${kacis(x.kaynak.ad)} ↗</a></p>
    </div>`;
  }).join('');

  $('#gostergeNotlar').innerHTML =
    g.notlar.map((n) => `<p>${kacis(n)}</p>`).join('') +
    `<div class="not-kaynaklari">Ek kaynaklar:
      ${g.notKaynaklari.map((s) => `<a href="${kacis(s.url)}" target="_blank" rel="noopener noreferrer">${kacis(s.ad)} ↗</a>`).join('')}
     </div>`;
}

/* ---------- yöntem paneli ---------- */

function yontemPaneliKur() {
  $('#durumAciklama').innerHTML = durum.veri.durumlar.map((d) => `
    <div class="aciklama-satir">
      <span class="rozet rozet-durum ${kacis(d.sinif)}">${kacis(d.kisa)}</span>
      <span class="metin"><strong>${kacis(d.ad)}.</strong> ${kacis(d.aciklama)}</span>
    </div>`).join('');

  $('#haricListesi').innerHTML = durum.veri.haricTutulanlar.map((h) => `
    <div class="haric-kart">
      <span class="haric-il">${kacis(h.gercekIl)}</span>
      <p class="haric-baslik">${kacis(h.baslik)}</p>
      <p class="haric-not">${kacis(h.not)}</p>
      <a href="${kacis(h.url)}" target="_blank" rel="noopener noreferrer">Kaynağa git ↗</a>
    </div>`).join('');

  $('#kapsanamayanListesi').innerHTML =
    durum.veri.kapsanamayanlar.map((x) => `<li>${kacis(x)}</li>`).join('');

  // kaynak dağılımı: yayın organı başına kayıt sayısı
  const sayac = new Map();
  durum.veri.kayitlar.forEach((k) => (k.kaynaklar || []).forEach((s) => {
    const ad = s.ad.split('—')[0].trim();
    const mevcut = sayac.get(ad) || { sayi: 0, yerel: s.yerel };
    mevcut.sayi += 1;
    sayac.set(ad, mevcut);
  }));
  const sirali = [...sayac.entries()].sort((a, b) => b[1].sayi - a[1].sayi).slice(0, 10);
  const enYuksek = sirali.length ? sirali[0][1].sayi : 1;

  $('#kaynakDagilim').innerHTML = sirali.map(([ad, v]) => `
    <div class="dagilim-satir">
      <span class="dagilim-ad">${kacis(ad)}${v.yerel ? ' <span class="yerel-etiket">YEREL</span>' : ''}</span>
      <span class="dagilim-sayi">${v.sayi}</span>
      <div class="dagilim-cubuk">
        <div class="dagilim-dolgu" style="width:${(v.sayi / enYuksek) * 100}%;background:${v.yerel ? 'var(--d-dogru)' : 'var(--vurgu)'}"></div>
      </div>
    </div>`).join('');
}

/* ---------- olaylar ---------- */

function olaylariBagla() {
  // sekmeler
  document.querySelectorAll('.sekme').forEach((s) => {
    s.addEventListener('click', () => {
      document.querySelectorAll('.sekme').forEach((x) => {
        x.classList.remove('aktif'); x.setAttribute('aria-selected', 'false');
      });
      s.classList.add('aktif'); s.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.remove('aktif'); p.hidden = true;
      });
      const p = $('#panel-' + s.dataset.panel);
      p.classList.add('aktif'); p.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // kategori çipleri
  $('#kategoriSerit').addEventListener('click', (e) => {
    const cip = e.target.closest('.cip');
    if (!cip) return;
    document.querySelectorAll('.cip').forEach((c) => c.classList.remove('aktif'));
    cip.classList.add('aktif');
    durum.filtre.kategori = cip.dataset.kategori;
    ciz();
  });

  // arama
  let zamanlayici;
  $('#aramaKutusu').addEventListener('input', (e) => {
    clearTimeout(zamanlayici);
    const v = e.target.value;
    zamanlayici = setTimeout(() => { durum.filtre.arama = v; ciz(); }, 140);
  });
  $('#aramaTemizle').addEventListener('click', () => {
    $('#aramaKutusu').value = ''; durum.filtre.arama = ''; ciz(); $('#aramaKutusu').focus();
  });

  // seçimler
  $('#ilceSecim').addEventListener('change', (e) => { durum.filtre.ilce = e.target.value; ciz(); });
  $('#durumSecim').addEventListener('change', (e) => { durum.filtre.dogrulama = e.target.value; ciz(); });
  $('#siraSecim').addEventListener('change', (e) => { durum.filtre.sira = e.target.value; ciz(); });

  // sıfırlama
  const sifirla = () => {
    durum.filtre = { arama: '', kategori: 'hepsi', ilce: 'hepsi', dogrulama: 'hepsi', sira: durum.filtre.sira };
    $('#aramaKutusu').value = '';
    $('#ilceSecim').value = 'hepsi';
    $('#durumSecim').value = 'hepsi';
    document.querySelectorAll('.cip').forEach((c) => c.classList.toggle('aktif', c.dataset.kategori === 'hepsi'));
    $('#kategoriSerit').scrollTo({ left: 0, behavior: 'smooth' });
    ciz();
  };
  $('#filtreSifirla').addEventListener('click', sifirla);
  $('#bosSifirla').addEventListener('click', sifirla);

  // kart → detay
  $('#kartListesi').addEventListener('click', (e) => {
    const kart = e.target.closest('.kart');
    if (kart) detayAc(kart.dataset.id);
  });

  // detay kapatma
  $('#detayKapat').addEventListener('click', () => detayKapat());
  $('#perde').addEventListener('click', () => detayKapat());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') detayKapat(); });
  window.addEventListener('popstate', () => {
    if (location.hash) hashOku(); else detayKapat(false);
  });

  // tema
  $('#temaBtn').addEventListener('click', () => {
    const suan = document.documentElement.getAttribute('data-tema');
    const sistemKoyu = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const yeni = suan ? (suan === 'koyu' ? 'acik' : 'koyu') : (sistemKoyu ? 'acik' : 'koyu');
    document.documentElement.setAttribute('data-tema', yeni);
    try { localStorage.setItem('bitlis-tema', yeni); } catch (e) { /* yok say */ }
    $('#temaIkon').textContent = yeni === 'koyu' ? '☀' : '☾';
  });
}

/* ---------- tema (erken uygulama) ---------- */

(function temaBaslat() {
  let kayitli = null;
  try { kayitli = localStorage.getItem('bitlis-tema'); } catch (e) { /* yok say */ }
  if (kayitli) {
    document.documentElement.setAttribute('data-tema', kayitli);
    document.addEventListener('DOMContentLoaded', () => {
      $('#temaIkon').textContent = kayitli === 'koyu' ? '☀' : '☾';
    });
  }
})();

/* ---------- servis çalışanı (çevrimdışı) ---------- */

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* çevrimdışı desteği isteğe bağlı */ });
  });
}

/* ---------- başlat ---------- */

yukle();
