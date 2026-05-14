@echo off
echo ========================================
echo  Hotel Diamante - Backend Setup
echo ========================================
cd /d "%~dp0"
echo Instalando dependencias...
npm install
echo.
echo Iniciando servidor en http://localhost:3000
npm start
pause
