#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def basit_toplam():
    """
    Basit toplama işlemi
    """
    print("=== Basit Toplama İşlemi ===")
    
    # Kullanıcıdan sayıları al
    sayi1 = float(input("Birinci sayıyı girin: "))
    sayi2 = float(input("İkinci sayıyı girin: "))
    
    # Toplama işlemi
    toplam = sayi1 + sayi2
    
    # Sonucu göster
    print(f"Toplam: {sayi1} + {sayi2} = {toplam}")
    
    return toplam

def liste_toplam():
    """
    Liste içindeki sayıları toplar
    """
    print("=== Liste Toplama İşlemi ===")
    
    # Kullanıcıdan sayıları al
    sayilar = []
    while True:
        sayi = input("Sayı girin (bitirmek için 'q'): ")
        if sayi.lower() == 'q':
            break
        try:
            sayilar.append(float(sayi))
        except ValueError:
            print("Geçersiz sayı! Tekrar deneyin.")
    
    if sayilar:
        toplam = sum(sayilar)
        print(f"Girilen sayılar: {sayilar}")
        print(f"Toplam: {toplam}")
        print(f"Ortalama: {toplam/len(sayilar):.2f}")
        return toplam
    else:
        print("Hiç sayı girilmedi!")
        return 0

def carpim_tablosu():
    """
    Çarpım tablosu gösterir
    """
    print("=== Çarpım Tablosu ===")
    
    n = int(input("Hangi sayının çarpım tablosunu görmek istiyorsunuz? "))
    
    print(f"\n{n} sayısının çarpım tablosu:")
    print("-" * 20)
    
    for i in range(1, 11):
        sonuc = n * i
        print(f"{n} x {i} = {sonuc}")

def menu():
    """
    Ana menü
    """
    while True:
        print("\n" + "="*30)
        print("BASİT HESAP MAKİNESİ")
        print("="*30)
        print("1. İki sayı toplama")
        print("2. Liste toplama")
        print("3. Çarpım tablosu")
        print("4. Çıkış")
        
        secim = input("\nSeçiminiz (1-4): ")
        
        if secim == '1':
            basit_toplam()
        elif secim == '2':
            liste_toplam()
        elif secim == '3':
            carpim_tablosu()
        elif secim == '4':
            print("Program sonlandırılıyor...")
            break
        else:
            print("Geçersiz seçim! Lütfen 1-4 arası bir sayı girin.")

if __name__ == "__main__":
    menu()