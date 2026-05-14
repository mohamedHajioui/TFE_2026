@echo off

REM Vérification des privilèges administrateur
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Ce script necessite des privileges administrateur.
    echo Relancement avec elevation...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ===========================================
echo Arret de PostgreSQL...
echo ===========================================

REM Nom du service
set SERVICE_NAME=postgresql-x64-18

REM Arrête le service
net stop %SERVICE_NAME%

if %errorlevel%==0 (
    echo PostgreSQL arrete avec succes !
) else (
    echo Erreur : impossible d'arreter PostgreSQL.
    echo Verifie le nom du service dans le script.
)

echo ===========================================
pause
