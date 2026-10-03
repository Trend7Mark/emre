/* TDK yazım kuralları denetimi (kural tabanlı, kesin tespit edilebilenler).
 * Dönen her bulgu: { id, sev, kaynak, ref, msg, start, end, bul, repl }
 *   start/end: metindeki aralık; repl tanımlıysa aralık bununla değiştirilerek düzeltilir.
 * Not: Bu bir imla denetçisi değildir; sözlük kontrolü yapmaz, yalnız belgede sık görülen
 * ve kuralı net olan durumları yakalar. Her uyarı "Neden?" açıklamasıyla gelir. */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});
  const t = KY.tr;

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matchCase = (orig, repl) => (orig && t.upper(orig[0]) === orig[0] && t.lower(orig[0]) !== orig[0] ? t.upFirst(repl) : repl);
  /** Türkçe'ye duyarlı büyük/küçük harf duyarsız desen: JS'in /i bayrağı İ↔i ve I↔ı eşleştirmez. */
  const ci = (raw) =>
    [...raw]
      .map((c) => {
        if (c === ' ') return '\\s+';
        if (!/\p{L}/u.test(c)) return esc(c);
        const lo = t.lower(c);
        const up = t.upper(c);
        return lo === up ? lo : `[${lo}${up}]`;
      })
      .join('');
  const bound = (raw) => new RegExp(`(?<![\\p{L}\\d])${ci(raw)}(?![\\p{L}\\d])`, 'gu');
  const APOS = '[’\']';

  /** URL, e-posta ve sayı kodlarını denetim dışı bırakır (uzunluk korunur). */
  function mask(s) {
    const fill = (m) => '•'.repeat(m.length);
    return s
      .replace(/https?:\/\/\S+|www\.\S+/gi, fill)
      .replace(/\S+@\S+\.\S+/g, fill)
      .replace(/\b[EZO]-[\d…]+-[\d.…]+-[\d…]+/g, fill);
  }

  const ORD = '(?:inci|ıncı|uncu|üncü|nci|ncı|ncu|ncü)';
  const SAYI_EK = '(?:inci|ıncı|uncu|üncü|nci|ncı|ncu|ncü|te|ta|de|da|den|dan|ten|tan|nin|nın|nun|nün|yle|yla|lik|lık|luk|lük)';
  const AY = 'ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık';
  const ISIM_EKLERI = ['nın', 'nin', 'nun', 'nün', 'ndan', 'nden', 'nda', 'nde', 'daki', 'deki', 'taki', 'teki', 'yla', 'yle', 'dan', 'den', 'tan', 'ten', 'da', 'de', 'ta', 'te', 'dır', 'dir', 'dur', 'dür', 'tır', 'tir', 'tur', 'tür', 'ya', 'ye', 'yı', 'yi', 'yu', 'yü', 'na', 'ne', 'ın', 'in', 'un', 'ün', 'la', 'le', 'a', 'e', 'ı', 'i', 'u', 'ü']
    .sort((a, b) => b.length - a.length)
    .join('|');
  const OZEL_RE = new RegExp(`(?<![\\p{L}\\d])(${KY.OZEL_ADLAR.map(esc).join('|')})(${ISIM_EKLERI})(?![\\p{L}\\d'’])`, 'gu');
  const KURUM_RE = new RegExp(`(?<![\\p{L}])(?:${KY.KURUM_KOKLERI.map(esc).join('|')})[\\p{L}]*(${APOS})(?=\\p{L})`, 'gu');
  const KURUM_ADI = KY.KURUM_ADLARI.slice().sort((a, b) => b[0].length - a[0].length).map(([k, d]) => ({ re: bound(k), d }));
  const ANMA_RE = new RegExp(`(?<![\\p{L}\\d])(${KY.KURUM_ANMA.map(esc).join('|')})(?![\\p{L}\\d])`, 'gu');

  const YAZIM = KY.YAZIM.map(([y, d, n]) => ({ re: bound(y), d, n }));
  const YABANCI = KY.YABANCI.map(([y, d]) => ({ re: bound(y), d }));
  const TDK23 = KY.TDK2023.filter((e) => e.detect).map((e) => {
    const eski = e.eski.replace(/\*$/, '');
    return { e, re: e.stem ? new RegExp(`(?<![\\p{L}\\d])${ci(eski)}(?=[\\p{L}’']*(?![\\p{L}]))`, 'gu') : bound(eski) };
  });

  function lintTDK(text, o = {}) {
    const raw = String(text || '');
    const s = mask(raw);
    const out = [];
    const add = (id, sev, ref, msg, start, end, repl) =>
      out.push({ id, sev, kaynak: 'TDK', ref, msg, start, end, bul: raw.slice(start, end), repl });
    const each = (re, fn) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(s))) {
        fn(m);
        if (m[0] === '') re.lastIndex++;
      }
    };

    // 1) Yer tutucular (doldurulmamış şablon)
    each(/\[[^\]\n]{0,80}\]|…|(?<!\.)\.{3,}(?!\.)|_{3,}|\bX{3,}\b/gu, (m) =>
      add('tdk.yertutucu', 'error', 'Doldurulmamış alan', 'Doldurulmamış yer tutucu var: bu ifadeyi gerçek bilgiyle değiştirin.', m.index, m.index + m[0].length));

    // 2) Boşluk ve noktalama (Yön. m.16/3)
    each(/(?<=\S)( {2,})(?=\S)/g, (m) => add('tdk.bosluk', 'warn', 'Yön. m.16/3', 'Kelimeler arasında bir karakter boşluk bırakılır.', m.index, m.index + m[0].length, ' '));
    each(/(?<=[\p{L}\d)”"’'])( +)(?=[,;:!?]|\.(?:\s|$))/gu, (m) =>
      add('tdk.noktalama.once', 'warn', 'Yön. m.16/3', 'Noktalama işaretleri kendinden önce gelen harfe bitişik yazılır.', m.index, m.index + m[0].length, ''));
    each(/(?<=[\p{L}\d)])([,;!?])(?=[\p{L}(])/gu, (m) =>
      add('tdk.noktalama.sonra', 'warn', 'Yön. m.16/3', 'Noktalama işaretinden sonra bir karakter boşluk bırakılır.', m.index, m.index + 1, m[1] + ' '));
    each(/(?<=\p{L}):(?=\p{L})/gu, (m) => add('tdk.noktalama.sonra', 'warn', 'Yön. m.16/3', 'İki noktadan sonra bir karakter boşluk bırakılır.', m.index, m.index + 1, ': '));
    each(/(?<=[a-zçğıöşü\d])\.(?=[A-ZÇĞİÖŞÜ])/gu, (m) => add('tdk.noktalama.sonra', 'warn', 'Yön. m.16/3', 'Noktadan sonra bir karakter boşluk bırakılır.', m.index, m.index + 1, '. '));

    // 3) Cümle başı büyük harf
    each(/([.!?])([ \t]+)(\p{Ll})/gu, (m) => {
      const before = s.slice(0, m.index);
      const tok = /(\p{L}+|\d+)$/u.exec(before);
      if (!tok) return;
      const w = t.lower(tok[1]);
      if (/^\d+$/.test(w) || w.length === 1 || KY.KISALTMA_NOKTALI.has(w)) return;
      if (before.slice(0, tok.index).endsWith('.')) return;
      const at = m.index + m[1].length + m[2].length;
      add('tdk.cumlebasi', 'warn', 'TDK: Büyük harfler A', 'Cümle büyük harfle başlar.', at, at + m[3].length, t.upper(m[3]));
    });
    if (o.paragraf !== false) {
      let pos = 0;
      for (const line of raw.split('\n')) {
        const m = /^(\s*)(\p{Ll})/u.exec(line);
        if (m && !/^\s*\p{L}\)/u.test(line)) add('tdk.cumlebasi', 'warn', 'TDK: Büyük harfler A', 'Cümle büyük harfle başlar.', pos + m[1].length, pos + m[1].length + 1, t.upper(m[2]));
        pos += line.length + 1;
      }
    }

    // 4) Sayılar
    each(new RegExp(`(\\d+)(\\.)(?=${ORD}(?!\\p{L}))`, 'gu'), (m) =>
      add('tdk.sira', 'warn', 'TDK: Sayıların yazılışı 9', 'Sıra sayısında rakamdan sonra nokta değil kesme işareti ve ek kullanılır (8’inci).', m.index, m.index + m[0].length, m[1] + '’'));
    each(new RegExp(`(\\d)(?=${SAYI_EK}(?!\\p{L}))`, 'gu'), (m) =>
      add('tdk.kesme.sayi', 'warn', 'TDK: Kesme işareti 4', 'Sayılara getirilen ekler kesme işaretiyle ayrılır (1985’te, 2’nci).', m.index, m.index + 1, m[1] + '’'));
    each(/(?<![\d.,/:\-•])(\d{4,})(?![\d.,/:\-])/g, (m) => {
      const n = m[1];
      if (n.startsWith('0') || n.length === 11) return; // telefon, posta kodu, T.C. kimlik no
      if (n.length === 4 && +n >= 1900 && +n <= 2100) return; // yıl
      const onceki = s.slice(Math.max(0, m.index - 24), m.index);
      const sonraki = s.slice(m.index + n.length, m.index + n.length + 10);
      if (/(?:say[ıi]s?[ıi]?|[Nn]o|[Nn]umara\w*|[Kk]od\w*|PK|[Pp]osta)\W*$/.test(onceki) || /^\s*say[ıi]l[ıi]/.test(sonraki)) return;
      add('tdk.binlik', 'info', 'TDK: Sayıların yazılışı 7', 'Dört veya daha çok basamaklı sayılar sondan üçlü gruplara ayrılarak nokta ile yazılır.', m.index, m.index + n.length, t.groupThousands(n));
    });
    each(/(?<![\d%])(\d+(?:,\d+)?)\s?%(?!\d)/gu, (m) => add('tdk.yuzde', 'warn', 'TDK: Sayıların yazılışı 4', 'Yüzde işareti sayıdan önce, boşluksuz yazılır (%25).', m.index, m.index + m[0].length, `%${m[1]}`));
    each(/%\s+(?=\d)/gu, (m) => add('tdk.yuzde', 'warn', 'TDK: Sayıların yazılışı 4', 'Yüzde işareti ile sayı arasında boşluk bırakılmaz (%25).', m.index, m.index + m[0].length, '%'));
    each(/(?<![\d:])\b([01]?\d|2[0-3]):([0-5]\d)\b(?![:\d])/g, (m) => add('tdk.saat', 'info', 'TDK: Sayıların yazılışı 1', 'Saat, nokta ile yazılır (17.30’da).', m.index, m.index + m[0].length, `${m[1]}.${m[2]}`));
    each(/(?<![\d.])\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b(?![\d])/g, (m) => {
      if (+m[1] > 31 || +m[2] > 12) return;
      add('tdk.tarih', 'warn', 'Yön. m.12/1', 'Tarih gg.aa.yyyy biçiminde, aralarına nokta konarak yazılır; gün ve ay iki haneli olmalıdır.', m.index, m.index + m[0].length, `${t.pad2(m[1])}.${t.pad2(m[2])}.${m[3]}`);
    });
    each(/(?<![\d.])\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b(?![\d])/g, (m) => {
      if (m[1].length === 2 && m[2].length === 2) return;
      if (+m[1] > 31 || +m[2] > 12) return;
      add('tdk.tarih', 'warn', 'Yön. m.12/1', 'Gün ve ay iki haneli yazılır (01.09.2019).', m.index, m.index + m[0].length, `${t.pad2(m[1])}.${t.pad2(m[2])}.${m[3]}`);
    });
    each(new RegExp(`(\\d{1,2}\\s+)(${AY})(?=\\s+\\d{4})`, 'gu'), (m) =>
      add('tdk.ay', 'warn', 'TDK: Büyük harfler Ç', 'Belirli bir tarih bildiren ay adları büyük harfle başlar (29 Ekim 1923).', m.index + m[1].length, m.index + m[0].length, t.capWord(m[2])));

    // 5) Büyük harf – unvan ve kurum
    each(/\bSayın(\s+)(\p{Ll})/gu, (m) => add('tdk.sayin', 'warn', 'TDK: Büyük harfler C-4', 'Saygı bildiren sözlerden sonra gelen makam, mevki ve unvan sözleri büyük harfle başlar (Sayın Bakan).', m.index + 5 + m[1].length, m.index + m[0].length, t.upper(m[2])));
    const alinan = [];
    for (const r of KURUM_ADI)
      each(r.re, (m) => {
        const a = m.index;
        const z = a + m[0].length;
        if (alinan.some(([x, y]) => a < y && z > x)) return;
        alinan.push([a, z]);
        if (m[0].replace(/\s+/g, ' ') === r.d) return; // zaten doğru yazılmış
        add('tdk.kurumadi', 'warn', 'TDK: Büyük harfler 18-21', 'Kurum, kuruluş ve resmî yayın adlarının her kelimesi büyük harfle başlar.', a, z, r.d);
      });
    each(ANMA_RE, (m) => add('tdk.kurumbuyuk', 'warn', 'TDK: Büyük harfler 20', 'Kurum, kuruluş, bakanlık, müdürlük vb. sözler asılları kastedildiğinde büyük harfle başlar.', m.index, m.index + m[0].length, t.upFirst(m[1])));

    // 6) Kesme işareti
    each(KURUM_RE, (m) => {
      const k = m.index + m[0].length - 1;
      add('tdk.kesme.kurum', 'warn', 'TDK: Kesme işareti (kurum adları)', 'Kurum, kuruluş, kurul, birleşim ve iş yeri adlarına gelen ekler kesmeyle ayrılmaz (Millî Eğitim Bakanlığına).', k, k + 1, '');
    });
    each(OZEL_RE, (m) => add('tdk.kesme.ozel', 'warn', 'TDK: Kesme işareti 1', `Özel adlara getirilen ekler kesme işaretiyle ayrılır (${m[1]}’${m[2]}).`, m.index, m.index + m[0].length, `${m[1]}’${m[2]}`));

    // 7) Bağlaç da/de
    each(/(?<![\p{L}])(\p{L}+(?:ip|ıp|up|üp))(\s+)(ta|te)(?![\p{L}])/gu, (m) =>
      add('tdk.bagac', 'warn', 'TDK: Bağlaç olan da/de', 'Ayrı yazılan bağlaç “da/de” hiçbir zaman “ta/te” biçiminde yazılmaz.', m.index + m[1].length + m[2].length, m.index + m[0].length, m[3] === 'ta' ? 'da' : 'de'));

    // 8) Kısaltmalar
    each(/(?<![\p{L}.])(vb|vs|vd|bkz|örn)(?![\p{L}.])/gu, (m) => add('tdk.kisaltma', 'warn', 'TDK: Kısaltmalar 3', `Türkçe kısaltmalarda nokta kullanılır (${m[1]}.).`, m.index, m.index + m[0].length, `${m[1]}.`));
    each(/(?<![\p{L}.])TC(?![\p{L}.])/gu, (m) => add('tdk.tc', 'info', 'TDK: Kısaltmalar 1', 'Gelenekleşmiş kısaltma “T.C.” noktalı yazılır.', m.index, m.index + 2, 'T.C.'));
    each(/(?<![\d,.])(\d+(?:[.,]\d+)?)\s?(KG|Kg|kG|KM|Km|kM|CM|Cm|MM|Mm|MT|Mt|mt|LT|Lt|lt|GR|Gr|gr)(?![\p{L}])/gu, (m) => {
      const u = { mt: 'm', lt: 'l', gr: 'g' }[t.lower(m[2])] || t.lower(m[2]);
      add('tdk.birim', 'info', 'TDK: Kısaltmalar 2', 'Ölçü birimleri uluslararası kısaltmalarıyla, küçük harfle yazılır (kg, km, cm, mm, m, l, g).', m.index, m.index + m[0].length, `${m[1]} ${u}`);
    });

    // 9) Sık yazım hataları ve ayrı/bitişik yazım
    for (const r of YAZIM) each(r.re, (m) => add('tdk.yazim', 'warn', 'TDK: Yazım', `“${m[0]}” yerine “${matchCase(m[0], r.d)}” yazılır. ${r.n}`, m.index, m.index + m[0].length, matchCase(m[0], r.d)));
    for (const r of KY.DUZELTME) {
      const re = new RegExp(r.re, 'gu');
      each(re, (m) => add('tdk.duzeltme', 'info', 'TDK: Düzeltme işareti', r.msg, m.index, m.index + m[0].length, matchCase(m[0], r.to(m))));
    }
    for (const r of YABANCI)
      each(r.re, (m) => add('tdk.yabanci', 'info', 'Yön. m.16/8', `Belge içinde zorunlu olmadıkça yabancı kelimeye yer verilmez: “${m[0]}” yerine “${r.d}”.`, m.index, m.index + m[0].length, matchCase(m[0], r.d)));

    // 10) TDK 2023 değişiklikleri
    for (const { e, re } of TDK23) {
      each(re, (m) => {
        const eski = e.eski.replace(/\*$/, '');
        const sadeceKok = !!e.stem;
        const yeni = sadeceKok ? e.guncel.replace(/\*$/, '') : e.guncel;
        const sev = e.onay ? 'info' : 'warn';
        const ek = e.resmi ? ` ${e.resmi}` : e.ek ? ` ${e.ek}` : '';
        add('tdk.2023', sev, 'TDK 2023 değişikliği', `Güncel yazım “${yeni}” (eski: “${eski}”).${ek}`, m.index, m.index + (sadeceKok ? eski.length : m[0].length), matchCase(m[0], yeni));
      });
    }

    out.sort((a, b) => a.start - b.start || a.end - b.end);
    return out;
  }

  /** Bulguyu metne uygular; yeni metni döndürür. */
  function uygula(text, issue) {
    if (issue.repl === undefined) return text;
    return text.slice(0, issue.start) + issue.repl + text.slice(issue.end);
  }
  /** Çakışmayan tüm düzeltilebilir bulguları sondan başa uygular. */
  function hepsiniUygula(text, issues, filtre) {
    let son = Infinity;
    let r = text;
    const liste = issues.filter((i) => i.repl !== undefined && (!filtre || filtre(i))).sort((a, b) => b.start - a.start);
    for (const i of liste) {
      if (i.end > son) continue;
      r = uygula(r, i);
      son = i.start;
    }
    return r;
  }

  KY.lintTDK = lintTDK;
  KY.uygula = uygula;
  KY.hepsiniUygula = hepsiniUygula;
})();
