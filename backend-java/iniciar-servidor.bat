@echo off
echo ╔══════════════════════════════════════════════╗
echo ║  Hotel Diamante - Iniciando Backend Java     ║
echo ╚══════════════════════════════════════════════╝
echo.

REM Verificar que Java está instalado
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Java no encontrado. Instale JDK 17 desde https://adoptium.net
    pause
    exit /b 1
)

echo ✅ Java detectado.
echo 📦 Compilando y descargando dependencias (primera vez tarda ~1 min)...
echo.

cd /d "%~dp0"
call mvnw.cmd clean compile exec:java -q
if errorlevel 1 (
    echo.
    echo ❌ Error al iniciar. Revise la consola.
    pause
)
