# Rehabilitasyon Takvimi ve Planı

Bu klasör, kişiselleştirilebilir bir rehabilitasyon planı ve takvimi üretmek için bir şablon içerir. Aşağıdaki adımlarla hızlıca başlayabilirsiniz.

## 1) Plan ve içerik
- `plan.md`: 8 haftalık aşamalı bir (genel) rehabilitasyon şablonu.
- Kendi durumunuza göre düzenleyin (ameliyat türü, tanı, kısıtlamalar, hedefler vb.).

## 2) Takvim üretimi
- `config.json`: Takvim olaylarını (klinik seanslar, ev egzersizleri, yürüyüş/kardiyo, haftalık değerlendirme) tanımlar.
- `generate_rehab_calendar.py`: `config.json` dosyasına göre `.ics` ve `.csv` takvim çıktıları üretir.

### Kullanım
```bash
python /workspace/rehab/generate_rehab_calendar.py \
  --config /workspace/rehab/config.json \
  --outdir /workspace/rehab
```

Çıktılar:
- `/workspace/rehab/rehab_calendar.ics` (Google Calendar, Apple Calendar vb. içe aktarabilirsiniz)
- `/workspace/rehab/rehab_calendar.csv` (Excel/Sheets veya bazı takvim uygulamalarına içe aktarım)

## 3) Özelleştirme
- `config.json` içindeki alanları kendi programınıza göre güncelleyin:
  - Başlangıç tarihi, toplam hafta, zaman dilimi
  - Klinik seans gün/saatleri ve süresi
  - Ev egzersizi gün/saatleri ve süresi
  - Yürüyüş/kardiyo günleri, saatleri ve haftaya göre süre artışı
  - Haftalık değerlendirme günü/saatleri
  - Açıklama ve kısıtlama notu

## 4) Güvenlik ve sorumluluk
Bu şablon genel amaçlıdır. Kendi doktorunuzun/fizyoterapistinizin önerileri her zaman önceliklidir. Aşağıdaki durumlarda programınızı DERHAL sağlık profesyoneli ile yeniden değerlendirin:
- Ağrı/şişlikte artış, beklenmeyen kızarıklık/ateş, şiddetli yorgunluk
- Baş dönmesi, göğüs ağrısı, nefes darlığı
- Nörolojik belirtiler (uyușma, kuvvet kaybı vb.)

## 5) İçe aktarma ipuçları
- Google Calendar: Ayarlar → İçe aktar → `.ics` dosyasını seçin.
- Apple Calendar: Dosya → İçe Aktar → `.ics`.
- Outlook: Dosya → Aç ve Dışa Aktar → İçe Aktar/Çıkart → `.ics`.

## 6) Yapı
- `config.json`: Takvim konfigürasyonu
- `plan.md`: Haftalık içerik ve egzersiz önerileri
- `generate_rehab_calendar.py`: Takvim üretici
- `rehab_calendar.ics` ve `rehab_calendar.csv`: Üretilen çıktılar (komutu çalıştırınca oluşur)