@echo off
chcp 65001 > nul
echo Installation des dépendances...
call npm install

echo.
echo Démarrage du serveur en mode développement...
echo.
echo L'application sera accessible sur :
echo - http://localhost:3000
echo - http://127.0.0.1:3000
echo.
echo Pour arrêter le serveur, appuyez sur Ctrl+C
echo.

call npm run dev
pause 