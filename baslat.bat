@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Basin Masasi

where node >nul 2>nul
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi.
  echo https://nodejs.org adresinden LTS surumunu kurun, bilgisayari yeniden baslatip tekrar deneyin.
  pause
  exit /b 1
)

if not exist node_modules\express (
  echo Ilk calistirma: paketler kuruluyor, bu birkac dakika surebilir...
  call npm install
  if errorlevel 1 (
    echo.
    echo [HATA] Paketler kurulamadi. Internet baglantisini veya kurum agindaki proxy/filtreyi kontrol edin.
    pause
    exit /b 1
  )
)

if not exist .env (
  copy .env.example .env >nul
  echo .env dosyasi olusturuldu. API anahtarinizi yazip kaydedin, sonra Not Defteri penceresini kapatin.
  notepad .env
)

node server/index.js
echo.
echo Uygulama durdu. Yukaridaki mesaji kontrol edin.
pause
