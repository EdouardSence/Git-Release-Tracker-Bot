@echo off
echo Configuration du Bot Discord Git Release Tracker
echo.

REM Vérifier si le fichier .env existe
if not exist .env (
    echo Création du fichier .env...
    copy .env.example .env
    echo.
    echo IMPORTANT: Veuillez éditer le fichier .env avec vos informations :
    echo - DISCORD_TOKEN : Token de votre bot Discord
    echo - TARGET_USER_ID : Votre ID utilisateur Discord
    echo.
    echo Une fois configuré, relancez ce script.
    pause
    exit /b 1
)

echo Vérification de la connectivité Tor...
node diagnose-tor.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Problème détecté avec Tor. Le bot fonctionnera partiellement.
    echo Torzu ne sera pas accessible sans connexion Tor.
    echo.
    pause
)

echo.
echo Démarrage du bot...
npm start
