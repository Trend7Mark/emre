/* Kural kataloğu ve veri tabloları.
 * Kaynaklar:
 *  - Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik (CB Kararı 9/6/2020, Sayı: 2646, RG 10/6/2020-31151)
 *  - TDK Yazım Kuralları (2023 değişiklikleri dâhil) – Kemal Deniz derlemesi
 * mod: "otomatik" = uygulama kendisi uygular, "denetim" = denetler/uyarır, "elle" = kullanıcı veya EBYS sorumluluğunda
 */
(function () {
  const KY = (globalThis.KY = globalThis.KY || {});

  const Y = 'Yönetmelik';
  const T = 'TDK';
  KY.RULES = [
    { kaynak: Y, ref: 'm.4', baslik: 'Yazışma ortamı', mod: 'elle', ozet: 'Resmî yazışmalar e-Yazışma Teknik Rehberi’ne uygun, güvenli elektronik imzalı belgelerle yapılır. Zorunlu hâl/olağanüstü durumda el yazısıyla imza ve fiziksel ortam. Bu uygulama taslağı hazırlar; e-imza ve kayıt EBYS’de yapılır.' },
    { kaynak: Y, ref: 'm.5', baslik: 'Nüsha sayısı', mod: 'denetim', ozet: 'Elektronik belge tek nüsha. Zorunlu hâl/olağanüstü durumda en az iki nüsha; paraflı nüsha idarede kalır.' },
    { kaynak: Y, ref: 'm.6', baslik: 'Sayfa boyutu', mod: 'otomatik', ozet: 'A4 (210x297 mm). Fiziksel üst yazıda kâğıdın tek yüzü kullanılır.' },
    { kaynak: Y, ref: 'm.7', baslik: 'Yazı tipi ve punto', mod: 'otomatik', ozet: 'Times New Roman 12 veya Arial 11 punto esastır. Gerekirse yazı alanında 9, iletişim bilgilerinde 8 puntoya kadar düşürülebilir.' },
    { kaynak: Y, ref: 'm.8', baslik: 'Yazı alanı', mod: 'otomatik', ozet: 'Üst, sol, sağ kenardan 1,5 cm boşluk. Logo kullanılırsa üst boşluk 0,5 cm.' },
    { kaynak: Y, ref: 'm.9', baslik: 'Kurumsal logo', mod: 'otomatik', ozet: 'Tek logo: üst orta (T.C. ibaresini ortalayacak) veya üst sol (başlığı ortalayacak). İki logo: hiyerarşik üst idare solda, alt idare sağda. En fazla iki logo.' },
    { kaynak: Y, ref: 'm.10', baslik: 'Başlık', mod: 'otomatik', ozet: '1. satır “T.C.”, 2. satır idare adı BÜYÜK harf, 3. satır birim adı ilk harfleri büyük. Bağlı/ilgili idarede 4 satır. DETSİS kayıtları esas alınır.' },
    { kaynak: Y, ref: 'm.11', baslik: 'Sayı', mod: 'otomatik', ozet: 'E/Z/O + DETSİS no + standart dosya planı kodu + kayıt no, aralarında “-”. Örnek: E-67915368-903.07.02-4752. “Sayı:” başlıktan iki satır sonra, soldan başlar.' },
    { kaynak: Y, ref: 'm.12', baslik: 'Tarih', mod: 'otomatik', ozet: 'Sayı ile aynı satırda, en sağda; gg.aa.yyyy (gün/ay iki haneli). Ay harfle de yazılabilir (10 Ekim 2019). Elektronik belgede tarih, son imzanın zaman damgasıdır.' },
    { kaynak: Y, ref: 'm.13', baslik: 'Konu', mod: 'otomatik', ozet: '“Konu:” sayının bir alt satırında. Kelimelerin baş harfleri büyük, sonda noktalama yok, yazı alanının dikey orta hizasını geçmez; taşan satır “Konu:” altı boş bırakılarak yazılır. Kısa ve öz olmalı.' },
    { kaynak: Y, ref: 'm.14', baslik: 'Muhatap', mod: 'otomatik', ozet: 'Konudan iki satır sonra, ortalı. İdare adı BÜYÜK harf + yönelme eki; birim bir alt satırda parantez içinde. Gerçek kişide “Sayın Ad SOYAD”. Birden fazla muhatapta “DAĞITIM YERLERİNE”.' },
    { kaynak: Y, ref: 'm.15-16', baslik: 'İlgi', mod: 'otomatik', ozet: 'Muhataptan iki satır sonra, soldan; tarih sırasına göre (eskiden yeniye), a), b)… “… tarihli ve … sayılı …” ve sonda nokta. Gerçek kişide “…’ın … tarihli başvurusu/dilekçesi.” Taşan satırlar harf altı boş bırakılarak yazılır.' },
    { kaynak: Y, ref: 'm.16', baslik: 'Metin', mod: 'denetim', ozet: 'Paragraf 1,25 cm içeriden, iki yana yaslı, paragraflar arasında boşluk yok. Kelime arası bir boşluk; noktalama önceki harfe bitişik. Dört+ basamaklı sayılar üçlü gruplanır. Türkçe, TDK’ya uygun; yabancı kelime zorunlu değilse kullanılmaz. Kısaltma ilk kullanımda açılır.' },
    { kaynak: Y, ref: 'm.16/12', baslik: 'Metin kapanışı', mod: 'denetim', ozet: 'Üst ve aynı düzeye “… arz ederim.”, alta “… rica ederim.”, dağıtımlıda “… arz ve rica ederim.”, gerçek kişiye “Saygılarımla.” / “İyi dileklerimle.” / “Bilgilerinize sunulur.”, bakanlıklarla yazışmada CB İdari İşler Başkanı imzasıyla “Rica ederim.”' },
    { kaynak: Y, ref: 'm.17', baslik: 'İmza', mod: 'otomatik', ozet: 'Metinden 2-4 satır sonra, sağda ortalı: ad (ilk harf büyük) SOYAD (büyük), altında unvan. E-imzalı belgede “imzalandı” benzeri hiçbir ibare konmaz. Yetki devrinde “Vali a.”, vekâlette “Genel Müdür V.”. İki imzada üst unvan sağda; ikiden fazlada üst unvan solda, soldan sağa sıralı.' },
    { kaynak: Y, ref: 'm.18', baslik: 'Ek', mod: 'otomatik', ozet: '“Ek:” imzadan sonra, soldan. Tek ek aynı satırda; birden çoksa numaralı liste ve parantez içinde sayfa/adet. Ek muhataba gitmiyorsa “Ek konulmadı”. Liste uzunsa ayrı sayfada “EK LİSTESİ”.' },
    { kaynak: Y, ref: 'm.19', baslik: 'Dağıtım', mod: 'otomatik', ozet: '“Dağıtım:” (ek varsa Ek’ten sonra). “Gereği:” altta, “Bilgi:” aynı satırda ortaya doğru. Uzunsa “DAĞITIM LİSTESİ” ayrı sayfada veya ek olarak.' },
    { kaynak: Y, ref: 'm.20', baslik: 'Olur', mod: 'otomatik', ozet: 'İmzadan sonra ortada büyük harfle “OLUR”; altında onaylayanın adı ve unvanı. Zorunlu hâlde “OLUR”dan sonra tarih ve imza boşluğu bırakılır.' },
    { kaynak: Y, ref: 'm.21', baslik: 'Paraf', mod: 'otomatik', ozet: 'Tarih, unvan, ad, soyad kısaltmasız ve ast-üst sırasıyla. Elektronik belgede paraf üstverideki kayıttır, muhataba gitmez. Fiziksel belgede yalnız idarede kalan nüshada, yazı alanı sonunda sol kenarda.' },
    { kaynak: Y, ref: 'm.22', baslik: 'Koordinasyon', mod: 'otomatik', ozet: 'İş birliği yapılan birimlerin unvan/ad/soyadı paraf bölümünden sonra “Koordinasyon” altında belirtilir.' },
    { kaynak: Y, ref: 'm.23', baslik: 'Belge doğrulama', mod: 'elle', ozet: 'E-imzalı belgede “Bu belge, güvenli elektronik imza ile imzalanmıştır.” ibaresi, altında doğrulama kodu; karekod iletişim alanının en sağında. Kod ve karekodu EBYS üretir.' },
    { kaynak: Y, ref: 'm.24', baslik: 'İletişim bilgileri', mod: 'denetim', ozet: 'Sayfa sonunda çizgi ile ayrılır: solda adres, posta kodu, telefon, faks, e-posta, KEP, internet adresi; sağda bilgi alınacak kişinin adı, unvanı, telefonu.' },
    { kaynak: Y, ref: 'm.25', baslik: 'Gizlilik dereceli belgeler', mod: 'denetim', ozet: '“Hizmete Özel” elektronik ortamda hazırlanabilir. “Özel” ve üstü fiziksel ortamda hazırlanır. Gizlilik derecesinden imzacı makam sorumludur.' },
    { kaynak: Y, ref: 'm.26', baslik: 'Süreli ve kişiye özel yazışma', mod: 'otomatik', ozet: '“ACELE”/“GÜNLÜDÜR” yazı alanının sağ üst köşesinde kırmızı, yalnız ilk sayfada. GÜNLÜDÜR’de cevap süresi/tarihi metinde ve üstveride belirtilir. “KİŞİYE ÖZEL” belge ilgilisine teslim edilir.' },
    { kaynak: Y, ref: 'm.27', baslik: 'Sayfa numarası', mod: 'otomatik', ozet: 'Birden fazla sayfalı belgede iletişim bilgilerinin altında, sayfa ortasında, toplam sayfanın kaçıncısı olduğu gösterilir.' },
    { kaynak: Y, ref: 'm.16/5', baslik: 'Çok sayfalı belge', mod: 'otomatik', ozet: 'Sayı, tarih, konu, muhatap, ilgi yalnız ilk sayfada; imza, ek, dağıtım yalnız son sayfada; iletişim ve doğrulama bilgisi her sayfanın altında.' },
    { kaynak: Y, ref: 'm.28', baslik: 'Üstveri', mod: 'elle', ozet: 'Elektronik belgede e-Yazışma Teknik Rehberi’ndeki üstveri elemanları kullanılır; belge görüntüsü ile üstveri arasında fark olamaz.' },
    { kaynak: Y, ref: 'm.29-32', baslik: 'Çoğaltma, gönderme, iade', mod: 'elle', ozet: 'Çıktı “ASLI GİBİDİR” ile onaylanır; belge KEP/EBYS aracılığıyla gönderilir; muhatabı olmayan belge iade edilir. EBYS işlemidir.' },
    { kaynak: Y, ref: 'm.33', baslik: 'Süre', mod: 'denetim', ozet: 'Görüş/bilgi/belge talepleri günlü yazılır. Süre belirtilmeyen belge talepleri 5 iş günü, bilgi ve görüş talepleri 15 iş günü içinde yerine getirilir.' },
    { kaynak: Y, ref: 'm.34', baslik: 'Tekit yazısı', mod: 'otomatik', ozet: 'Süresinde cevap verilmeyen belgede muhataba tekit yazısı yazılabilir (taslak şablonu mevcut).' },
    { kaynak: Y, ref: 'm.35', baslik: 'Uygun yazılmayan belgeler', mod: 'otomatik', ozet: 'Yönetmeliğe uygun yazılmamış belgeye cevapta ilgili maddeler belirtilerek muhatap uyarılabilir; durum sürerse müteakip belgeler iade edilebilir (taslak şablonu mevcut).' },

    { kaynak: T, ref: 'Büyük harfler', baslik: 'Büyük harflerin kullanıldığı yerler', mod: 'denetim', ozet: 'Cümle başı; özel adlar; “Sayın”dan sonra gelen unvanlar; kurum, kanun, yönetmelik adlarının her kelimesi; belirli tarih bildiren ay adları (29 Ekim 1923); “Bakanlığımız” gibi kendi kurumunuz.' },
    { kaynak: T, ref: 'Sayılar', baslik: 'Sayıların yazılışı', mod: 'denetim', ozet: 'Dört+ basamaklı sayılar sondan üçlü gruplanır (1.452), kesirler virgülle (10,5); yüzde işareti sayıdan önce, bitişik (%25); sıra sayısı 8’inci (8.inci değil); saat 17.30.' },
    { kaynak: T, ref: 'Kesme işareti', baslik: 'Kesme işareti', mod: 'denetim', ozet: 'Özel adlara (Ankara’da, Türkiye’de), sayılara (1985’te), kısaltmalara (TBMM’nin) gelen ekler kesmeyle ayrılır. Kurum adlarına gelen ekler ayrılmaz (Millî Eğitim Bakanlığına).' },
    { kaynak: T, ref: 'Birleşik kelimeler', baslik: 'Ayrı / bitişik yazım', mod: 'denetim', ozet: 'her şey, hiçbir, birçok, birkaç, herhangi, ya da, söz konusu, yurt dışı, hafta sonu… Sık yapılan hatalar denetlenir.' },
    { kaynak: T, ref: 'de/da, ki, mı', baslik: 'Bağlaç da/de, ki, soru eki', mod: 'denetim', ozet: 'Bağlaç da/de ayrı yazılır ve “ta/te” biçiminde yazılmaz (gidip de). Soru eki ayrı yazılır.' },
    { kaynak: T, ref: 'Noktalama', baslik: 'Noktalama ve boşluk', mod: 'denetim', ozet: 'Noktalama kendinden önceki harfe bitişik yazılır, sonrasında bir boşluk bırakılır; kelime arası tek boşluk.' },
    { kaynak: T, ref: 'Kısaltmalar', baslik: 'Kısaltmalar', mod: 'denetim', ozet: 'vb., vs., vd. nokta ile; T.C.; ölçü birimleri uluslararası kısaltmayla (kg, km, cm); ilk kullanımda açık biçim + parantez içinde kısaltma.' },
    { kaynak: T, ref: 'Düzeltme işareti', baslik: 'Düzeltme işareti', mod: 'denetim', ozet: 'hâl (durum) / hal (sebze hali), hâlâ, resmî, millî, dinî, askerî gibi kelimeler.' },
    { kaynak: T, ref: '2023 değişiklikleri', baslik: 'TDK 2023 yazım değişiklikleri', mod: 'denetim', ozet: 'unvan→ünvan, albinos→albino, yeşilbiber→yeşil biber, yasa koyuculuğu→yasa koyuculuk vb. (aşağıdaki tabloya bakın).' },
  ];

  /* ---- TDK 2023 değişiklikleri (PDF s.24-25 tablosu; birebir) ---- */
  // eski, guncel: tablodaki hâller. onay: sitede her iki hâl de mevcutsa (yıldızlı) true.
  // detect: metinde taranır; stem: ek alan biçimleri de yakalanır; ek: açıklama.
  KY.TDK2023 = [
    { eski: 'akça armudu', guncel: 'akçaarmut', detect: true },
    { eski: 'akzambak', guncel: 'ak zambak', detect: true },
    { eski: 'albinos', guncel: 'albino', detect: true },
    { eski: 'Allah müstahakını versin', guncel: 'Allah müstahakkını versin', detect: true },
    { eski: 'arslanın adı çıkmış, çakallar baş keser', guncel: 'aslanın adı çıkmış, çakallar baş keser', detect: true },
    { eski: 'ata dostu oğul mirastır', guncel: 'ata dostu oğula mirastır', detect: true },
    { eski: 'atbalığı', guncel: 'at balığı', detect: true },
    { eski: 'bekârın yakasını it yer, yakasını bit', guncel: 'bekârın parasını it yer, yakasını bit', detect: false },
    { eski: 'boy bos*', guncel: 'boy pos', ek: 'Sitede boy bos hâli de mevcut.', detect: false },
    { eski: 'boyuna bosuna bakmadan', guncel: 'boyuna posuna bakmadan', detect: true },
    { eski: 'boyu bosu yerinde', guncel: 'boyu posu yerinde', detect: true },
    { eski: 'boyu bosu devrilsin (veya devrilesi)', guncel: 'boyu posu devrilsin (veya devrilesi)', detect: false },
    { eski: 'boyunduruğa vurmak', guncel: 'boyunduruk vurmak', detect: true },
    { eski: 'bumbar*', guncel: 'mumbar', ek: 'Sitede bumbar hâli de mevcut.', detect: false },
    { eski: 'bükün', guncel: 'büküm', detect: false },
    { eski: 'bükünlü', guncel: 'bükümlü', detect: false },
    { eski: 'bükünlü dil', guncel: 'bükümlü dil', detect: false },
    { eski: 'çiğ börek*', guncel: 'çi börek', ek: 'Sitede çiğ börek hâli de mevcut.', detect: false },
    { eski: 'çömlek patlatmak', guncel: 'çanak çömlek patlatmak/patlamak', detect: false },
    { eski: 'Doğubeyazıt', guncel: 'Doğubayazıt', detect: true, stem: true },
    { eski: 'ek eylem', guncel: 'ek-eylem', detect: true },
    { eski: 'ek fiil', guncel: 'ek-fiil', detect: true },
    { eski: 'ek fiil çekimi', guncel: 'ek-fiil çekimi', detect: true },
    { eski: 'Eyüp', guncel: 'Eyüpsultan', detect: false },
    { eski: 'göksoğan', guncel: 'gök soğan', detect: true },
    { eski: 'hasıraltı', guncel: 'hasır altı', detect: true },
    { eski: 'hatasıyla sevabıyla', guncel: 'hatasıyla savabıyla', detect: true },
    { eski: 'hudayinabit', guncel: 'hüdayinabit', detect: true },
    { eski: 'iki arslan bir posta sığmaz', guncel: 'iki aslan bir posta sığmaz', detect: true },
    { eski: 'kanun koyuculuğu', guncel: 'kanun koyuculuk', detect: true },
    { eski: 'karakutu*', guncel: 'karakutu', ek: 'Kelime, Yazım Kılavuzu’nda (2012, 27. Baskı) eskiden de aynıymış zaten. Bazı sitelerde eski hâlinin “kara kutu” olduğu yazıyor.', detect: false },
    { eski: 'kayyum*', guncel: 'kayyım', ek: 'Sitede kayyum hâli de mevcut.', detect: true, stem: true, onay: true },
    { eski: 'kayyumluk*', guncel: 'kayyımlık', ek: 'Sitede kayyumluk hâli de mevcut.', detect: false },
    { eski: 'kendi hesabana çalışmak', guncel: 'kendi hesabına çalışmak', detect: false },
    { eski: 'kontuar', guncel: 'kontuvar', detect: true, stem: true },
    { eski: 'kükürt çiçeği', guncel: 'kükürtçiçeği', detect: true },
    { eski: 'kümeden düşmek', guncel: 'küme düşmek', detect: true },
    { eski: 'Marmara Ereğlisi', guncel: 'Marmaraereğlisi', detect: true, stem: true },
    { eski: 'maskulen', guncel: 'maskülen', detect: true },
    { eski: 'mentor', guncel: 'mentör', detect: true, stem: true },
    { eski: 'müskat', guncel: 'muskat', detect: true },
    { eski: 'neftimsi', guncel: 'neftîmsi', ek: 'Kelime düzeltme işareti almış.', detect: true },
    { eski: 'nev', guncel: 'nevi', detect: false },
    { eski: 'oduncunun gözü omçada', guncel: 'oduncunun gözü omcada', detect: true },
    { eski: 'orman koruma memuru', guncel: 'orman muhafaza memuru', detect: true, stem: true },
    { eski: 'oyun kuruculuğu', guncel: 'oyun kuruculuk', detect: true },
    { eski: 'pili', guncel: 'pile', detect: false },
    { eski: 'pilili', guncel: 'pileli', detect: false },
    { eski: 'sıcaklıkyayar', guncel: 'sıcaklıkyazar', detect: false },
    { eski: 'sıla sıygası', guncel: 'sıla sigası', detect: true },
    { eski: 'sıyga', guncel: 'siga', detect: true },
    { eski: 'sıygaya çekmek', guncel: 'sigaya çekmek', detect: true },
    { eski: 'sifin', guncel: 'zifin', detect: false },
    { eski: 'siyem siyem', guncel: 'siyim siyim', ek: 'Sitede siyem siyem, süyüm süyüm hâlleri de mevcut.', detect: false },
    { eski: 'sultan efendi', guncel: 'sultanefendi', detect: false },
    { eski: 'tıntın', guncel: 'tın tın', detect: true },
    { eski: 'truakar', guncel: 'truvakar', detect: true },
    { eski: 'unvan', guncel: 'ünvan', detect: true, stem: true, resmi: 'Yönetmelik metni hâlâ “unvan” yazıyor; TDK’nın güncel yazımı “ünvan”dır.' },
    { eski: 'unvanlı', guncel: 'ünvanlı', detect: false },
    { eski: 'unvansız', guncel: 'ünvansız', detect: false },
    { eski: 'yakan top', guncel: 'yakantop', detect: true },
    { eski: 'yasa koyuculuğu', guncel: 'yasa koyuculuk', detect: true },
    { eski: 'yeşilbiber', guncel: 'yeşil biber', detect: true },
    { eski: 'yeşilfasulye', guncel: 'yeşil fasulye', detect: true },
    { eski: 'yeşilsoğan', guncel: 'yeşil soğan', detect: true },
    { eski: 'yeşilzeytin', guncel: 'yeşil zeytin', detect: true },
    { eski: 'yürük', guncel: 'Yörük', ek: 'Sitede Yürük hâli de mevcut.', detect: false },
  ];
  KY.TDK2023_NOTLAR = [
    'TDK’nin sitesinde “kırmızıbiber” bu şekliyle (bitişik) yer almaktadır.',
    '“Sarı yağız” kelimesinin eskiden (Yazım Kılavuzu, 27. Baskı, 2012) sadece “sarı yağız” şekli varken bugün sitede iki farklı hâli de mevcut; anlam farklıdır: sarı yağız (Sarı benizli erkek), sarıyağız (Kula renkli at).',
    'Eskiden “hatasıyla sevabıyla” varken güncel durum “hatasıyla savabıyla”dır. Her “sevap” yerine “savap” yazılamaz; ikisi de mevcuttur, anlamları farklıdır: sevap (Hayırlı bir davranış karşısında Tanrı tarafından verileceğine inanılan ödül); savap (doğru).',
    'Siteye “selfie” kelimesinin Türkçe karşılığı olarak “özçekim” eklenmiştir; “özçekim yapmak” ve “özçekim çubuğu” da mevcuttur.',
    'Sitede hem “horon vurmak” hem “horon tepmek” şeklinde 2 kullanım vardır; anlamları aynıdır.',
  ];

  /* ---- Sık yazım hataları / ayrı-bitişik (TDK) ---- */
  // [yanlış, doğru, açıklama]
  KY.YAZIM = [
    ['hiç bir', 'hiçbir', 'hiçbir, hiçbiri bitişik yazılır.'],
    ['her hangi', 'herhangi', 'herhangi bitişik yazılır.'],
    ['bir kaç', 'birkaç', 'birkaç, birkaçı bitişik yazılır.'],
    ['bir çok', 'birçok', 'birçok, birçoğu bitişik yazılır.'],
    ['birşey', 'bir şey', '“bir şey”, “her şey”, “hiçbir şey” ayrı yazılır.'],
    ['herşey', 'her şey', '“bir şey”, “her şey”, “hiçbir şey” ayrı yazılır.'],
    ['hiçbirşey', 'hiçbir şey', '“bir şey”, “her şey”, “hiçbir şey” ayrı yazılır.'],
    ['hiçkimse', 'hiç kimse', '“hiç kimse” ayrı yazılır.'],
    ['yada', 'ya da', '“ya da” ayrı yazılır.'],
    ['yinede', 'yine de', 'Bağlaç olan “de” ayrı yazılır.'],
    ['yanlız', 'yalnız', 'Doğru yazım “yalnız”.'],
    ['herkez', 'herkes', 'Doğru yazım “herkes”.'],
    ['hergün', 'her gün', '“her gün” ayrı yazılır.'],
    ['herzaman', 'her zaman', '“her zaman” ayrı yazılır.'],
    ['şuanda', 'şu anda', '“şu anda” ayrı yazılır.'],
    ['sözkonusu', 'söz konusu', '“söz konusu” ayrı yazılır.'],
    ['pekçok', 'pek çok', '“pek çok” ayrı yazılır.'],
    ['malesef', 'maalesef', 'Doğru yazım “maalesef”.'],
    ['teşekür', 'teşekkür', 'Doğru yazım “teşekkür”.'],
    ['kordinasyon', 'koordinasyon', 'Doğru yazım “koordinasyon”.'],
    ['orjinal', 'orijinal', 'Doğru yazım “orijinal”.'],
    ['döküman', 'doküman', 'Doğru yazım “doküman”.'],
    ['dökümantasyon', 'dokümantasyon', 'Doğru yazım “dokümantasyon”.'],
    ['insiyatif', 'inisiyatif', 'Doğru yazım “inisiyatif”.'],
    ['laboratuar', 'laboratuvar', 'Doğru yazım “laboratuvar”.'],
    ['klavuz', 'kılavuz', 'Doğru yazım “kılavuz”.'],
    ['tabi ki', 'tabii ki', '“tabii” (elbette) iki i ile yazılır.'],
    ['arzetmek', 'arz etmek', 'Yardımcı fiille kurulan birleşik fiiller ayrı yazılır.'],
    ['farketmek', 'fark etmek', 'Yardımcı fiille kurulan birleşik fiiller ayrı yazılır.'],
    ['terketmek', 'terk etmek', 'Yardımcı fiille kurulan birleşik fiiller ayrı yazılır.'],
    ['kabuletmek', 'kabul etmek', 'Yardımcı fiille kurulan birleşik fiiller ayrı yazılır.'],
    ['yoketmek', 'yok etmek', 'Yardımcı fiille kurulan birleşik fiiller ayrı yazılır.'],
    ['ilanetmek', 'ilan etmek', 'Yardımcı fiille kurulan birleşik fiiller ayrı yazılır.'],
    ['varolmak', 'var olmak', '“var olmak”, “yok olmak” ayrı yazılır.'],
    ['yokolmak', 'yok olmak', '“var olmak”, “yok olmak” ayrı yazılır.'],
    ['orda', 'orada', 'orada, burada, şurada, içeride, dışarıda biçiminde yazılır.'],
    ['burda', 'burada', 'orada, burada, şurada, içeride, dışarıda biçiminde yazılır.'],
    ['şurda', 'şurada', 'orada, burada, şurada, içeride, dışarıda biçiminde yazılır.'],
    ['içerde', 'içeride', 'orada, burada, şurada, içeride, dışarıda biçiminde yazılır.'],
    ['dışarda', 'dışarıda', 'orada, burada, şurada, içeride, dışarıda biçiminde yazılır.'],
    ['yukarda', 'yukarıda', 'Doğru yazım “yukarıda”.'],
    ['yurtdışı', 'yurt dışı', '“dışı, içi, sıra” sözleriyle kurulan birleşikler ayrı yazılır.'],
    ['yurtiçi', 'yurt içi', '“dışı, içi, sıra” sözleriyle kurulan birleşikler ayrı yazılır.'],
    ['haftasonu', 'hafta sonu', 'Zamanla ilgili birleşik kelimeler ayrı yazılır (hafta sonu, hafta başı).'],
  ];

  /* ---- Düzeltme işareti / nispet eki (TDK) ---- */
  KY.DUZELTME = [
    { re: '(?<![\\p{L}])([Mm])illi(?![\\p{L}])', to: (m) => m[1] + 'illî', msg: '“millî”: nispet ekli sözcüklerde düzeltme işareti kullanılır (Millî Eğitim, millî takım).' },
    { re: '(?<![\\p{L}])([Rr])esmi(?= (?:yazışma|yazı|gazete|kurum|makam|belge|işlem|tatil|bayram|dil|daire|sıfat|evrak|kuruluş|görevli|kayıt|hizmet|mühür|talep)\\b)', to: (m) => m[1] + 'esmî', msg: '“resmî”: “resmi (onun resmi)” ile karışmaması için düzeltme işareti kullanılır.' },
    { re: '(?<![\\p{L}])(h)alinde(?![\\p{L}])', to: () => 'hâlinde', msg: 'Durum anlamında “hâl” düzeltme işaretiyle yazılır (hal: sebze/meyve hali).' },
    { re: '(?<![\\p{L}])(h)allerde(?![\\p{L}])', to: () => 'hâllerde', msg: 'Durum anlamında “hâl” düzeltme işaretiyle yazılır.' },
    { re: '(?<![\\p{L}])(h)alde(?![\\p{L}])', to: () => 'hâlde', msg: 'Durum anlamında “hâl” düzeltme işaretiyle yazılır.' },
  ];

  /* ---- Yabancı kelime (Yön. m.16/8) ---- */
  KY.YABANCI = [
    ['mail', 'e-posta'], ['e-mail', 'e-posta'], ['email', 'e-posta'], ['fax', 'faks'],
    ['deadline', 'son tarih'], ['meeting', 'toplantı'], ['feedback', 'geri bildirim'],
    ['update', 'güncelleme'], ['online', 'çevrim içi'], ['offline', 'çevrim dışı'],
    ['link', 'bağlantı'], ['download', 'indirme'],
  ];

  /* ---- Özel ad listeleri (kesme işareti denetimi) ---- */
  KY.OZEL_ADLAR = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın',
    'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale',
    'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş',
    'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
    'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Osmaniye', 'Rize',
    'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli',
    'Uşak', 'Yalova', 'Yozgat', 'Zonguldak',
    'Türkiye', 'Atatürk', 'Avrupa', 'Anadolu',
  ]; // Van, Ordu, Kilis: sık kullanılan sözcüklerle (vana, ordu, kilise) karışabildiği için dışarıda bırakıldı.

  /* Kurum adı sonu (kesme almaz): Millî Eğitim Bakanlığına, Ankara Valiliğinden … */
  KY.KURUM_KOKLERI = [
    'Bakanlığ', 'Bakanlık', 'Müdürlüğ', 'Müdürlük', 'Başkanlığ', 'Başkanlık', 'Valiliğ', 'Kaymakamlığ', 'Rektörlüğ',
    'Dekanlığ', 'Belediye', 'Üniversite', 'Fakülte', 'Meclis', 'Kurul', 'Komisyon', 'Okul', 'Lise', 'Daire', 'Kurum',
  ];

  /* Kendi kurumuna gönderme: asılları kastedildiğinde büyük harf (TDK, “Büyük harfler” md.20) */
  KY.KURUM_ANMA = [
    'bakanlığımız', 'bakanlığınız', 'müdürlüğümüz', 'müdürlüğünüz', 'başkanlığımız', 'başkanlığınız', 'valiliğimiz', 'valiliğiniz',
    'kaymakamlığımız', 'kaymakamlığınız', 'rektörlüğümüz', 'rektörlüğünüz', 'dekanlığımız', 'dekanlığınız', 'belediyemiz',
    'belediyeniz', 'üniversitemiz', 'üniversiteniz', 'fakültemiz', 'fakülteniz', 'kurumumuz', 'kurumunuz', 'okulumuz', 'okulunuz',
    'genel müdürlüğümüz', 'genel müdürlüğünüz',
  ];


  /* Küçük harfle yazılırsa büyük harfe çevrilecek yaygın kurum/eser adları (TDK: Büyük harfler 18-21) */
  KY.KURUM_ADLARI = [
    ['türkiye büyük millet meclisi', 'Türkiye Büyük Millet Meclisi'],
    ['türkiye cumhuriyeti', 'Türkiye Cumhuriyeti'],
    ['cumhurbaşkanlığı idari işler başkanlığı', 'Cumhurbaşkanlığı İdari İşler Başkanlığı'],
    ['cumhurbaşkanlığı kararnamesi', 'Cumhurbaşkanlığı Kararnamesi'],
    ['cumhurbaşkanlığı', 'Cumhurbaşkanlığı'],
    ['bakanlar kurulu', 'Bakanlar Kurulu'],
    ['resmî gazete', 'Resmî Gazete'],
    ['resmi gazete', 'Resmî Gazete'],
    ['il millî eğitim müdürlüğü', 'İl Millî Eğitim Müdürlüğü'],
    ['il milli eğitim müdürlüğü', 'İl Millî Eğitim Müdürlüğü'],
    ['ilçe millî eğitim müdürlüğü', 'İlçe Millî Eğitim Müdürlüğü'],
    ['ilçe milli eğitim müdürlüğü', 'İlçe Millî Eğitim Müdürlüğü'],
    ['millî eğitim bakanlığı', 'Millî Eğitim Bakanlığı'],
    ['milli eğitim bakanlığı', 'Millî Eğitim Bakanlığı'],
    ['devlet arşivleri başkanlığı', 'Devlet Arşivleri Başkanlığı'],
    ['dijital dönüşüm ofisi', 'Dijital Dönüşüm Ofisi'],
    ['türk dil kurumu', 'Türk Dil Kurumu'],
  ];

  /* Cümle başı büyük harf denetiminde sonrasında küçük harf gelebilen kısaltmalar */
  KY.KISALTMA_NOKTALI = new Set([
    'vb', 'vs', 'vd', 'bkz', 'örn', 'dr', 'prof', 'doç', 'yrd', 'öğr', 'uzm', 'av', 'sn', 'no', 'md', 'müd', 'tel', 'adr',
    'sok', 'cad', 'mah', 'apt', 'blv', 'kat', 'sf', 'ort', 'yy', 'mö', 'ms', 'gen', 'alb', 'alm', 'ing', 'fr', 'bşk', 'başk', 'mad',
    'ilçe', 'sy', 'syf', 'say', 'fak', 'böl', 'dn', 'tc',
  ]);

  /* Konu’da küçük kalan bağlaçlar (TDK: kitap/eser adlarında ve, ile, ya, veya, yahut, ki, da, de, mı…) */
  KY.KONU_KUCUK = new Set(['ve', 'ile', 'ya', 'veya', 'yahut', 'ki', 'da', 'de', 'mı', 'mi', 'mu', 'mü']);

  /* Kapanış ibareleri (Yön. m.16/12) */
  KY.YON_SECENEKLERI = [
    { v: 'ust', ad: 'Üst makama (arz)' },
    { v: 'esit', ad: 'Aynı düzeydeki makama (arz)' },
    { v: 'alt', ad: 'Alt makama (rica)' },
    { v: 'dagitimli', ad: 'Üst, aynı düzey ve alt makamlara dağıtımlı (arz ve rica)' },
    { v: 'bakanlik', ad: 'Bakanlıklarla yazışma, CB İdari İşler Başkanı imzası (Rica ederim.)' },
    { v: 'gercek', ad: 'Gerçek kişiye (Saygılarımla / İyi dileklerimle / Bilgilerinize sunulur)' },
  ];
  KY.KAPANIS = {
    ust: { re: /(?:^|[\s.])arz ederim\.$/i, oneri: ['Bilgilerinize arz ederim.', 'Gereğini arz ederim.', 'Uygun görüşlerinize arz ederim.'], ibare: '“… arz ederim.”' },
    esit: { re: /(?:^|[\s.])arz ederim\.$/i, oneri: ['Bilgilerinize arz ederim.', 'Gereğini arz ederim.'], ibare: '“… arz ederim.”' },
    alt: { re: /(?:^|[\s.])rica ederim\.$/i, oneri: ['Gereğini rica ederim.', 'Bilgilerini rica ederim.', 'Gereğinin yapılmasını rica ederim.'], ibare: '“… rica ederim.”' },
    dagitimli: { re: /(?:^|[\s.])arz(?: ve |\/)rica ederim\.$/i, oneri: ['Gereğini arz ve rica ederim.', 'Bilgilerinizi arz ve rica ederim.'], ibare: '“… arz ve rica ederim.” veya “… arz/rica ederim.”' },
    bakanlik: { re: /(?:^|[\s.])rica ederim\.$/i, oneri: ['Rica ederim.', 'Gereğini rica ederim.'], ibare: '“Rica ederim.”' },
    gercek: { re: /(?:Saygılarımla|İyi dileklerimle|Bilgilerinize sunulur)\.$/, oneri: ['Saygılarımla.', 'İyi dileklerimle.', 'Bilgilerinize sunulur.'], ibare: '“Saygılarımla.”, “İyi dileklerimle.” veya “Bilgilerinize sunulur.”' },
  };

  /* ---- Taslak metin şablonları ---- */
  KY.SABLONLAR = [
    {
      id: 'talep', ad: 'Bilgi / belge talebi (günlü)', yon: 'alt', sureli: 'GUNLUDUR',
      konu: '[Konu] Hakkında Bilgi Talebi',
      metin: '[Konunun kısa açıklaması] ile ilgili olarak aşağıda belirtilen bilgi ve belgelerin en geç [gg.aa.yyyy] tarihine kadar Müdürlüğümüze gönderilmesi hususunda;\na) [Talep edilen bilgi/belge 1]\nb) [Talep edilen bilgi/belge 2]\nGereğini rica ederim.',
      not: 'Yön. m.33: görüş/bilgi/belge talep yazıları günlü yazılır. Süre belirtilmezse belge talepleri 5, bilgi ve görüş talepleri 15 iş günü içinde cevaplanır.',
    },
    {
      id: 'cevap', ad: 'Cevap yazısı (üst / aynı düzey)', yon: 'ust', sureli: '',
      konu: '[Konu] Hakkında',
      metin: 'İlgi yazıda, [talep edilen hususun kısa özeti] belirtilmektedir.\nKonuya ilişkin yapılan inceleme sonucunda, [inceleme sonucu / alınan karar].\nBilgilerinize arz ederim.',
      not: 'İlgi bölümüne cevap verilen yazıyı ekleyin.',
    },
    {
      id: 'tekit', ad: 'Tekit yazısı (Yön. m.34)', yon: 'alt', sureli: 'ACELE',
      konu: '[Konu] Hakkında (Tekit)',
      metin: 'İlgi yazı ile [talep edilen husus] istenilmiş olup, süresi içinde cevap alınamamıştır.\nSöz konusu yazının cevabının en geç [gg.aa.yyyy] tarihine kadar Müdürlüğümüze gönderilmesi hususunda gereğini rica ederim.',
      not: 'Belgeye süresi içinde cevap verilmemesi hâlinde muhataba tekit yazısı yazılabilir.',
    },
    {
      id: 'iade', ad: 'Uygun yazılmayan belge – uyarı (Yön. m.35)', yon: 'esit', sureli: '',
      konu: '[Konu] Hakkında',
      metin: 'İlgi yazı incelenmiş olup, Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik’in [ilgili madde/maddeler] hükümlerine uygun hazırlanmadığı görülmüştür.\nAnılan Yönetmelik hükümleri doğrultusunda yeniden düzenlenerek gönderilmesi hususunda gereğini arz ederim.',
      not: 'Belgeyi reddeden idare, durumu sebepleriyle birlikte belgenin kendisine ulaştığı tarihi takip eden ikinci iş gününün sonuna kadar gönderen idareye bildirir (m.30/4). Süreli belgeler hariç müteakip belgeler gerekçesi belirtilerek iade edilebilir (m.35).',
    },
    {
      id: 'kisi', ad: 'Gerçek kişiye cevap (dilekçe)', yon: 'gercek', sureli: '',
      konu: '[Konu] Hakkında',
      metin: 'İlgi dilekçenizde [talep edilen husus] belirtilmiştir.\nYapılan inceleme sonucunda, [inceleme sonucu / bilgilendirme].\nBilgilerinize sunulur.',
      not: 'Muhatap, ilgi dilekçenin sahibi ise ilgi bölümünde kişinin adı yazılmaz (m.16/9).',
    },
    {
      id: 'olur', ad: 'Olur teklifi', yon: 'ust', sureli: '',
      konu: '[Konu] Hakkında Olur',
      metin: '[Konunun gerekçesi ve kısa açıklaması].\nYukarıda arz edilen hususun uygun görülmesi hâlinde Olurlarınıza arz ederim.',
      not: '“Olur” bloğunu İmza bölümünden açabilirsiniz (m.20).',
    },
  ];

  /* Boş / başlangıç belgesi */
  KY.bosBelge = function () {
    const bugun = new Date();
    const iso = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, '0')}-${String(bugun.getDate()).padStart(2, '0')}`;
    return {
      v: 1,
      meta: { ortam: 'E', yon: 'esit', gizlilik: '', sureli: '', sure: '', kisiyeOzel: false, font: 'tnr', punto: 12, iletisimPunto: 9, konuBaglac: true, kalin: true, sablon: '' },
      baslik: { s2: '', s3: '', s4: '' },
      logo: { mod: 'yok', sol: '', sag: '' },
      sayi: { detsis: '', dosya: '', kayit: '' },
      tarih: { deger: iso, bicim: 'rakam' },
      konu: '',
      muhatap: { tur: 'idare', dativeOtomatik: true, ad: '', kisiAd: '', kisiSoyad: '', birim: '', adres: '' },
      ilgi: [],
      metin: '',
      imza: [{ onUnvan: '', ad: '', soyad: '', unvan: '', tip: 'normal', makam: '' }],
      olur: { aktif: false, ad: '', soyad: '', unvan: '', katilan: [] },
      ek: { liste: [], ayriSayfa: false },
      dagitim: { geregi: [], bilgi: [], ayriSayfa: false },
      paraf: [],
      koordinasyon: [],
      iletisim: { adres: '', posta: '', tel: '', faks: '', eposta: '', kep: '', web: '', kisiAd: '', kisiUnvan: '', kisiTel: '', dogrulama: '' },
    };
  };
})();
