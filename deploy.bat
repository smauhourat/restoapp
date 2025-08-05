@echo off
:: setlocal enabledelayedexpansion

:: Configura las rutas de origen y destino
set "origen=E:\Personales\Mati\restoapp"
set "destino=E:\Personales\Mati\deployment\v0.1.0"

:: Verifica que el directorio origen existe
if not exist "%origen%" (
    echo Error: El directorio origen no existe.
    pause
    exit /b 1
)

:: Crea el directorio destino si no existe
if not exist "%destino%" (
    mkdir "%destino%"
)

:: Copia todos los archivos y subdirectorios manteniendo la estructura
echo Copiando Client
xcopy "%origen%\build\*" "%destino%\" /E /H /C /I /Y /Q

echo Copiando Server

:: Crea el directorio destino si no existe
if not exist "%destino%\server" (
    mkdir "%destino%\server"
)

:: robocopy "%origen%\src\server" "%destino%\server\" /E /ZB /R:3 /W:5 /TEE /XD "%origen%\src\server\node_modules"
robocopy "%origen%\src\server" "%destino%\server" /E /XD "%origen%\src\server\node_modules"
:: xcopy "%origen%\src\server\*" "%destino%\server\" /E /H /C /I /Y /Q /EXCLUDE:E:\Personales\Mati\restoapp\src\server\node_modules\*.*


echo Copia completada.
pause