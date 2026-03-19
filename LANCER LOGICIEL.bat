@echo off
echo Fermeture des anciennes instances...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo Lancement de DRS Detailing Software...
echo.
cd /d "F:\Entreprises\DRS\detailing software"
start cmd /k "npm run dev"
timeout /t 8
start http://localhost:3000
exit
