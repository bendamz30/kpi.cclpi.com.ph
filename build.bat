@echo off
REM Sales Dashboard Frontend Build Script (Windows)
REM This script handles the build process for the Next.js frontend

echo =========================================
echo Sales Dashboard Frontend Build
echo =========================================

REM Check if .env.production file exists
if not exist .env.production (
    echo Warning: .env.production file not found!
    echo Using default environment variables...
)

REM Install dependencies
echo Installing npm dependencies...
call npm ci --production=false

REM Run build
echo Building Next.js application...
call npm run build

if %errorlevel% equ 0 (
    echo.
    echo =========================================
    echo Build completed successfully!
    echo =========================================
    echo.
    echo To start the production server, run:
    echo   npm start
    echo.
) else (
    echo.
    echo =========================================
    echo Build failed!
    echo =========================================
    exit /b 1
)

pause

