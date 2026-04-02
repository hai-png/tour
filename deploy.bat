@echo off
REM =============================================================================
REM HAI PNG Virtual Tour - Windows Deployment Script
REM =============================================================================
REM Usage: deploy.bat [environment]
REM Environments: staging, production
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=hai-tour
set BUILD_DIR=dist
set VERSION=%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set VERSION=%VERSION: =0%

REM Colors (Windows 10+)
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
  set "COLOR_BLUE=%%b[34m"
  set "COLOR_GREEN=%%b[32m"
  set "COLOR_YELLOW=%%b[33m"
  set "COLOR_RED=%%b[31m"
  set "COLOR_RESET=%%b[0m"
)

REM Functions
:log_info
echo %COLOR_BLUE%[INFO]%COLOR_RESET% %~1
goto :eof

:log_success
echo %COLOR_GREEN%[SUCCESS]%COLOR_RESET% %~1
goto :eof

:log_warning
echo %COLOR_YELLOW%[WARNING]%COLOR_RESET% %~1
goto :eof

:log_error
echo %COLOR_RED%[ERROR]%COLOR_RESET% %~1
goto :eof

REM Check if running from correct directory
if not exist "index.html" (
    call :log_error "Please run this script from the project root directory"
    exit /b 1
)

if not exist "manifest.json" (
    call :log_error "manifest.json not found"
    exit /b 1
)

REM Parse arguments
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=staging

if "%ENVIRONMENT%"=="staging" goto env_valid
if "%ENVIRONMENT%"=="production" goto env_valid
call :log_error "Invalid environment. Use 'staging' or 'production'"
echo Usage: deploy.bat [staging^|production]
exit /b 1

:env_valid
call :log_info Starting deployment to %ENVIRONMENT% environment...
call :log_info Version: %VERSION%

REM Step 1: Clean build directory
call :log_info Cleaning build directory...
if exist %BUILD_DIR% rmdir /s /q %BUILD_DIR%
mkdir %BUILD_DIR%

REM Step 2: Copy project files
call :log_info Copying project files...
xcopy /E /I /Y index.html %BUILD_DIR%\
xcopy /E /I /Y manifest.json %BUILD_DIR%\
xcopy /E /I /Y sw.js %BUILD_DIR%\
xcopy /E /I /Y offline.html %BUILD_DIR%\
xcopy /E /I /Y css\ %BUILD_DIR%\css\
xcopy /E /I /Y js\ %BUILD_DIR%\js\
xcopy /E /I /Y media\ %BUILD_DIR%\media\
xcopy /E /I /Y floor-plan\ %BUILD_DIR%\floor-plan\
xcopy /E /I /Y gallery\ %BUILD_DIR%\gallery\

REM Step 3: Copy deployment configs
call :log_info Copying deployment configurations...
if exist .htaccess xcopy /Y .htaccess %BUILD_DIR%\
if exist nginx.conf xcopy /Y nginx.conf %BUILD_DIR%\

REM Step 4: Validate files
call :log_info Validating deployment files...

set REQUIRED_FILES=index.html manifest.json sw.js offline.html css\styles.css js\main.js

for %%f in (%REQUIRED_FILES%) do (
    if not exist "%BUILD_DIR%\%%f" (
        call :log_error "Missing required file: %%f"
        exit /b 1
    )
)

REM Step 5: Update service worker version (simple replacement)
call :log_info Updating service worker version...
powershell -Command "(Get-Content %BUILD_DIR%\sw.js) -replace 'const CACHE_VERSION = ''v[0-9]*''', 'const CACHE_VERSION = ''%VERSION%''' | Set-Content %BUILD_DIR%\sw.js"

REM Step 6: Create deployment manifest
call :log_info Creating deployment manifest...
(
    echo {
    echo   "version": "%VERSION%",
    echo   "environment": "%ENVIRONMENT%",
    echo   "deployedAt": "%date% %time%",
    echo   "buildDir": "%BUILD_DIR%"
    echo }
) > %BUILD_DIR%\deployment.json

REM Step 7: Deployment summary
echo.
call :log_success Deployment preparation complete!
echo.
echo =============================================================================
echo Deployment Summary
echo =============================================================================
echo Environment:     %ENVIRONMENT%
echo Version:         %VERSION%
echo Build Directory: %BUILD_DIR%\
for /f %%i in ('dir /b /s %BUILD_DIR% ^| find /c /v ""') do echo Total Files:     %%i
echo.

if "%ENVIRONMENT%"=="production" (
    echo Next Steps:
    echo   1. Upload %BUILD_DIR%\ contents to your production server
    echo   2. Ensure .htaccess or nginx.conf is properly configured
    echo   3. Clear CDN cache if applicable
    echo   4. Test the deployment thoroughly
    echo.
) else (
    echo Next Steps:
    echo   1. Upload %BUILD_DIR%\ contents to your staging server
    echo   2. Test the deployment
    echo   3. Run 'deploy.bat production' when ready
    echo.
)

REM Step 8: Optional - Create ZIP package
if "%ENVIRONMENT%"=="production" (
    set PACKAGE_NAME=%PROJECT_NAME%-%VERSION%.zip
    call :log_info Creating production package: %PACKAGE_NAME%
    
    powershell -Command "Compress-Archive -Path '%BUILD_DIR%\*' -DestinationPath '%PACKAGE_NAME%' -Force"
    
    if exist %PACKAGE_NAME% (
        call :log_success Package created: %PACKAGE_NAME%
    )
)

call :log_success Deployment script finished!
endlocal
