/* Türkçe yardımcılar: büyük/küçük harf, ad-soyad biçimi, ek uyumu, tarih */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});
  const TR = 'tr-TR';
  const upper = (s) => String(s == null ? '' : s).toLocaleUpperCase(TR);
  const lower = (s) => String(s == null ? '' : s).toLocaleLowerCase(TR);
  const isLetter = (ch) => /\p{L}/u.test(ch);

  /** İlk harf büyük, kalan küçük; baştaki harf-dışı karakterleri ("(" gibi) atlar. */
  function capWord(tok) {
    const m = /^([^\p{L}]*)(\p{L})(.*)$/su.exec(tok);
    if (!m) return tok;
    return m[1] + upper(m[2]) + lower(m[3]);
  }

  /** Yalnızca ilk harfi büyütür, kalanına dokunmaz. */
  function upFirst(s) {
    const m = /^([^\p{L}]*)(\p{L})(.*)$/su.exec(String(s || ''));
    return m ? m[1] + upper(m[2]) + m[3] : String(s || '');
  }

  /**
   * "Her kelimenin ilk harfi büyük, diğerleri küçük".
   * Metnin tamamı büyük harfle yazıldıysa her şey dönüştürülür; karışık yazıldıysa
   * 2-6 harfli büyük harfli kısaltmalar (MEB, KEP, TBMM) korunur.
   * opts.small: küçük kalacak bağlaçlar kümesi (ilk kelime hariç).
   */
  function titleCase(s, opts = {}) {
    const str = String(s || '').trim().replace(/\s+/g, ' ');
    if (!str) return '';
    const allCaps = str === upper(str) && str !== lower(str);
    return str
      .split(' ')
      .map((tok, i) =>
        tok.replace(/[^\-/]+/g, (part) => {
          const letters = part.replace(/[^\p{L}]/gu, '');
          if (!letters) return part;
          if (!allCaps && letters.length > 1 && letters.length <= 6 && part === upper(part)) return part; // kısaltma (MEB, KEP, TBMM)
          if (opts.small && i > 0 && opts.small.has(lower(letters))) return lower(part);
          return capWord(part);
        }),
      )
      .join(' ');
  }

  /** "Ahmet Yılmaz" -> "Ahmet YILMAZ" (ad ilk harf büyük, soyad büyük). */
  function fmtName(ad, soyad) {
    return [titleCase(ad), upper(String(soyad || '').trim())].filter(Boolean).join(' ');
  }

  const VOW = 'aeıioöuü';
  const BACK = 'aıou';
  function lastVowel(w) {
    for (let i = w.length - 1; i >= 0; i--) if (VOW.includes(w[i])) return w[i];
    return 'e';
  }

  /** Tamlayan eki: Ahmet'in, Ali'nin, Ayşe'nin, Hasan'ın ("'" olmadan ek döner). */
  function genitiveSuffix(word) {
    const w = lower(String(word || '').replace(/[^\p{L}]/gu, ''));
    if (!w) return '';
    const h = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[lastVowel(w)];
    return VOW.includes(w[w.length - 1]) ? 'n' + h + 'n' : h + 'n';
  }

  /**
   * Büyük harfli idare adının sonuna yönelme hâli eki ekler (Yön. m.14/2).
   * "ANKARA VALİLİĞİ" -> "ANKARA VALİLİĞİNE"; "…KURUL" -> "…KURULA"; "…KÜTÜPHANE" -> "…KÜTÜPHANEYE".
   * Kurum adlarına gelen ekler kesmeyle ayrılmaz (TDK).
   */
  function addDative(nameUpper) {
    const name = String(nameUpper || '').trim();
    if (!name) return '';
    if (hasDative(name)) return name;
    const lw = lower(name.split(/\s+/).pop().replace(/[^\p{L}]/gu, ''));
    if (!lw) return name;
    const back = BACK.includes(lastVowel(lw));
    const end = lw[lw.length - 1];
    let suf;
    if ('ıiuü'.includes(end)) suf = back ? 'NA' : 'NE'; // iyelik eki: Müdürlüğü -> Müdürlüğüne
    else if (VOW.includes(end)) suf = back ? 'YA' : 'YE';
    else suf = back ? 'A' : 'E';
    return name + suf;
  }
  /** İyelik ekli kurum adlarında yönelme eki zaten yazılmış mı? (…Müdürlüğüne, …Bakanlığına) */
  function hasDative(name) {
    const last = lower(String(name).trim().split(/\s+/).pop().replace(/[^\p{L}]/gu, ''));
    return /[ıiuü]n[ae]$/.test(last);
  }

  /** 3. tekil kişi iyelik eki: yazı -> yazısı, rapor -> raporu, tutanak -> tutanağı. */
  function possessive3(word) {
    const w = String(word || '').trim();
    if (!w) return '';
    const lw = lower(w.replace(/[^\p{L}]/gu, ''));
    const h = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[lastVowel(lw)];
    if (VOW.includes(lw[lw.length - 1])) return w + 's' + h;
    const syl = [...lw].filter((c) => VOW.includes(c)).length;
    if (lw.endsWith('k') && syl > 1 && !/(nk|rk|lk)$/.test(lw)) return w.slice(0, -1) + 'ğ' + h;
    return w + h;
  }

  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const pad2 = (n) => String(n).padStart(2, '0');

  /** ISO (YYYY-MM-DD) -> "01.09.2019" ya da "10 Ekim 2019" (Yön. m.12/1). */
  function fmtDate(iso, bicim) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const [, y, mo, d] = m;
    if (bicim === 'harf') return `${parseInt(d, 10)} ${MONTHS[parseInt(mo, 10) - 1]} ${y}`;
    return `${d}.${mo}.${y}`;
  }

  /** Dört veya daha çok basamaklı sayıyı sondan üçlü gruplara ayırır: 1452 -> 1.452 */
  function groupThousands(digits) {
    return String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /** Türk alfabesindeki küçük harfler (ilgi sıralaması: a, b, c, ç, d …). */
  const ALFABE = 'abcçdefgğhıijklmnoöprsştuüvyz'.split('');

  KY.tr = { upper, lower, isLetter, capWord, upFirst, titleCase, fmtName, genitiveSuffix, possessive3, addDative, hasDative, MONTHS, pad2, fmtDate, groupThousands, ALFABE };
})();
