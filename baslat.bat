@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kurun. & pause & exit /b 1)
if not exist node_modules (echo Ilk calistirma: paketler kuruluyor... & call npm install)
if not exist .env (copy .env.example .env >nul & echo .env dosyasi olusturuldu. API anahtarinizi bu dosyaya yazin. & notepad .env)
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
call npm start
pause
