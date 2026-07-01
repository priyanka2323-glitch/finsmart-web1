@echo off
echo Cleaning up old dependencies...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo.
echo Installing updated dependencies...
echo This may take 2-3 minutes...
echo.

npm install

echo.
echo Done! Now run: npm run dev
pause
