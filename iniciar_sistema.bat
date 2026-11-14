@echo off
title GEOIGNIS COCHABAMBA - Lanzador del Sistema
color 0A
cls

echo ======================================================================
echo          GEOIGNIS COCHABAMBA - NASA Space Apps 2026 / GAMC
echo    Sistema de Armonizacion Satelital y Alerta Temprana de Incendios
echo ======================================================================
echo.
echo [*] Directorio base: %~dp0
echo [*] Verificando dependencias del sistema...
echo.

:: 1. Verificar Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Instala Python 3.10+ y vuelve a ejecutar este script.
    pause
    exit /b 1
)

:: 2. Verificar Node.js
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js / NPM no esta instalado o no se encuentra en el PATH.
    echo Instala Node.js 18+ y vuelve a ejecutar este script.
    pause
    exit /b 1
)

echo [OK] Python y Node.js detectados correctamente.
echo.

:: 3. Lanzar Backend FastAPI (Puerto 8000)
echo [*] Iniciando Backend FastAPI (http://localhost:8000)...
start "GEOIGNIS - Backend API (Puerto 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn backend:app --host 127.0.0.1 --port 8000 --reload"

:: 4. Lanzar Frontend React + Vite (Puerto 5173)
echo [*] Iniciando Frontend React (http://localhost:5173)...
start "GEOIGNIS - Frontend Web (Puerto 5173)" cmd /k "cd /d %~dp0frontend\Hackathon2026 && npm run dev"

echo.
echo [*] Esperando que los servicios inicien (4 segundos)...
timeout /t 4 /nobreak >nul

:: 5. Abrir navegador en http://localhost:5173
echo [*] Abriendo la aplicacion en el navegador...
start http://localhost:5173

echo.
echo ======================================================================
echo [EXITO] Sistema GEOIGNIS Cochabamba en ejecucion.
echo.
echo  - Frontend Visor Web: http://localhost:5173
echo  - Backend FastAPI:     http://localhost:8000
echo  - Documentacion API:   http://localhost:8000/docs
echo.
echo Para detener el sistema, simplemente cierra las dos ventanas de terminal
echo creadas para el Backend y el Frontend.
echo ======================================================================
echo.
pause
