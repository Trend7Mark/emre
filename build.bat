@echo off
REM Windows'ta tek dosyalik BHI-Paylasim.exe olusturur (Python 3.11+ kurulu olmali).
REM Python kurmak istemiyorsaniz GitHub "Actions" sekmesinden hazir .exe'yi indirebilirsiniz.

python -m venv .venv || goto :error
call .venv\Scripts\activate.bat
pip install -r requirements-dev.txt || goto :error
python -m pytest -q || goto :error
pyinstaller --noconfirm --onefile --name BHI-Paylasim ^
  --add-data "paylasim/static;paylasim/static" ^
  --hidden-import keyring.backends.Windows ^
  run.py || goto :error

echo.
echo Hazir: dist\BHI-Paylasim.exe
goto :eof

:error
echo.
echo HATA: Derleme basarisiz oldu.
exit /b 1
