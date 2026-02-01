@echo off

REM Vérification des privilèges administrateur
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Ce script necessite des privileges administrateur pour demarrer PostgreSQL.
    echo Relancement avec elevation...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ===========================================
echo Configuration de PostgreSQL pour TFE_2026
echo ===========================================

REM --- Nom de la base ---
set DB_NAME=tfe_2026
set DB_USER=postgres
set DB_PASSWORD=1234

echo.
echo Verification que PostgreSQL est demarre...

REM --- Vérifie si le service PostgreSQL existe et le démarre ---
set "PG_BIN="
set "PG_VERSION="

sc query postgresql-x64-18 >nul 2>&1
if %errorlevel% == 0 (
    echo Service PostgreSQL-18 trouve
    set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
    set "PG_VERSION=18"
    net start postgresql-x64-18 2>nul
    goto :setup_db
)

sc query postgresql-x64-17 >nul 2>&1
if %errorlevel% == 0 (
    echo Service PostgreSQL-17 trouve
    set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
    set "PG_VERSION=17"
    net start postgresql-x64-17 2>nul
    goto :setup_db
)

sc query postgresql-x64-16 >nul 2>&1
if %errorlevel% == 0 (
    echo Service PostgreSQL-16 trouve
    set "PG_BIN=C:\Program Files\PostgreSQL\16\bin"
    set "PG_VERSION=16"
    net start postgresql-x64-16 2>nul
    goto :setup_db
)

sc query postgresql-x64-15 >nul 2>&1
if %errorlevel% == 0 (
    echo Service PostgreSQL-15 trouve
    set "PG_BIN=C:\Program Files\PostgreSQL\15\bin"
    set "PG_VERSION=15"
    net start postgresql-x64-15 2>nul
    goto :setup_db
)

echo Service PostgreSQL non trouve!
echo Verifiez que PostgreSQL est installe.
pause
exit /b 1

:setup_db
echo.
echo Attente que PostgreSQL soit pret...
timeout /t 3 /nobreak >nul

echo.
echo 🗄️  Creation de la base de donnees %DB_NAME%...

REM --- Définir le mot de passe pour éviter les prompts ---
set PGPASSWORD=%DB_PASSWORD%

REM --- Vérifie si la base existe déjà ---
"%PG_BIN%\psql.exe" -U %DB_USER% -lqt | findstr /i %DB_NAME% >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️  La base %DB_NAME% existe deja
    echo Voulez-vous la supprimer et la recreer? (O/N)
    set /p RECREATE=
    if /i "%RECREATE%"=="O" (
        echo Suppression de la base %DB_NAME%...
        "%PG_BIN%\dropdb.exe" -U %DB_USER% %DB_NAME%
        echo Creation de la nouvelle base %DB_NAME%...
        "%PG_BIN%\createdb.exe" -U %DB_USER% %DB_NAME%
    ) else (
        echo Conservation de la base existante
    )
) else (
    echo Creation de la base %DB_NAME%...
    "%PG_BIN%\createdb.exe" -U %DB_USER% %DB_NAME%
)

REM --- Configure la timezone ---
echo.
echo 🌍 Configuration de la timezone...
"%PG_BIN%\psql.exe" -U %DB_USER% -d %DB_NAME% -c "SET timezone = 'Europe/Brussels';"

echo.
echo ===========================================
echo ✅ PostgreSQL est pret pour le projet %DB_NAME%
echo.
echo 📋 Informations de connexion:
echo    Host: localhost
echo    Port: 5432
echo    Database: %DB_NAME%
echo    Username: %DB_USER%
echo    Password: %DB_PASSWORD%
echo ===========================================
echo.
pause
