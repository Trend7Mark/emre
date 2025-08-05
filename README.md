# Excel Toplama İşlemleri

Bu proje Excel'de basit toplama işlemleri yapmak için Python kodu içerir.

## Özellikler

1. **OpenPyXL ile Excel Oluşturma**: Manuel olarak Excel dosyası oluşturur ve toplama formülleri ekler
2. **Pandas ile Excel İşlemleri**: Pandas kullanarak veri analizi ve Excel'e kaydetme
3. **Basit Hesap Makinesi**: Konsol üzerinden temel matematik işlemleri

## Kurulum

1. Gerekli kütüphaneleri yükleyin:
```bash
pip install -r requirements.txt
```

## Kullanım

Programı çalıştırmak için:
```bash
python excel_toplam.py
```

## Çıktılar

Program çalıştırıldığında:
- `toplama_islemi.xlsx`: OpenPyXL ile oluşturulan Excel dosyası
- `pandas_toplam.xlsx`: Pandas ile oluşturulan Excel dosyası
- Konsol üzerinden hesap makinesi

## Excel Dosyası İçeriği

Oluşturulan Excel dosyalarında:
- A, B, C sütunlarında örnek sayılar
- Toplam sütununda otomatik toplama formülleri
- Genel toplam satırı
- Formatlanmış başlıklar

## Örnek Kullanım

```python
# Sadece Excel dosyası oluşturmak için
excel_toplam_ornegi()

# Sadece Pandas ile Excel oluşturmak için
pandas_ile_toplam()

# Sadece hesap makinesi için
basit_hesap_makinesi()
```