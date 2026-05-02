@echo off
REM ============================================================================
REM APPWRITE DATABASE SETUP - Windows Setup Helper
REM ============================================================================
REM This script guides you through setting up Appwrite for the Device Charging
REM Management System on Windows.
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║         APPWRITE DATABASE SETUP - Device Charging Management System        ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

REM Check if Git Bash or WSL is available
where bash >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: bash is not available on your system.
    echo.
    echo This setup script requires bash. Please install one of:
    echo.
    echo 1. Git Bash - https://git-scm.com/download/win
    echo 2. Windows Subsystem for Linux (WSL) - https://learn.microsoft.com/windows/wsl
    echo 3. MSYS2 - https://www.msys2.org/
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo 📋 Setting up environment file...
    if exist ".env.local.example" (
        copy ".env.local.example" ".env.local" >nul
        echo ✅ Created .env.local from template
    ) else (
        echo ❌ ERROR: .env.local.example not found
        exit /b 1
    )
) else (
    echo ✅ .env.local already exists
)

echo.
echo 📝 CONFIGURATION REQUIRED
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo Please edit .env.local with your Appwrite credentials:
echo.
echo 1. Open .env.local in your text editor
echo 2. Fill in:
echo    - VITE_APPWRITE_ENDPOINT (e.g., https://cloud.appwrite.io)
echo    - VITE_APPWRITE_PROJECT_ID (from Appwrite Console)
echo    - APPWRITE_API_KEY (from Appwrite Console Settings ^> API Keys)
echo.
echo 3. Save the file
echo.

REM Open .env.local in default editor
echo Opening .env.local for editing...
start notepad .env.local

REM Wait for user to complete editing
echo.
echo ⏳ Waiting for you to configure .env.local...
echo Press any key when you have completed editing and saved the file...
pause >nul

echo.
echo 🚀 Running database setup...
echo.

REM Run the bash script
bash ./bash.sh

if %errorlevel% equ 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════════════════╗
    echo ║                   ✅ SETUP COMPLETED SUCCESSFULLY                          ║
    echo ╚════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo 📚 Next steps:
    echo.
    echo 1. Install dependencies:
    echo    npm install
    echo.
    echo 2. Start development server:
    echo    npm run dev
    echo.
    echo 3. Open your browser to http://localhost:5173
    echo.
    echo 📖 For more information, see APPWRITE_SETUP.md
    echo.
    pause
) else (
    echo.
    echo ❌ Setup failed. Please check the error messages above.
    echo.
    pause
    exit /b 1
)

endlocal
