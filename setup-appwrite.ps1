# ============================================================================
# APPWRITE DATABASE SETUP - Windows PowerShell Setup Helper
# ============================================================================
# This script guides you through setting up Appwrite for the Device Charging
# Management System using PowerShell.
#
# Usage: .\setup-appwrite.ps1
# ============================================================================

param(
    [switch]$SkipEdit = $false
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Title" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

function Write-Step {
    param([string]$Message)
    Write-Host "📝 $Message" -ForegroundColor Cyan
}

# Main script
Write-Header "APPWRITE DATABASE SETUP - Device Charging Management"

# Check if bash is available
$bashPath = Get-Command bash -ErrorAction SilentlyContinue
if (-not $bashPath) {
    Write-Error-Custom "bash is not available on your system"
    Write-Host ""
    Write-Host "Please install one of the following:"
    Write-Host ""
    Write-Host "1. Git Bash"
    Write-Host "   Download: https://git-scm.com/download/win"
    Write-Host "   After installation, restart PowerShell and run this script again"
    Write-Host ""
    Write-Host "2. Windows Subsystem for Linux (WSL)"
    Write-Host "   Guide: https://learn.microsoft.com/windows/wsl"
    Write-Host ""
    Write-Host "3. MSYS2"
    Write-Host "   Download: https://www.msys2.org/"
    Write-Host ""
    exit 1
}

Write-Success "bash is available"
Write-Host ""

# Check and create .env.local
Write-Step "Checking environment file..."

if (Test-Path ".env.local") {
    Write-Success ".env.local already exists"
} else {
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Success "Created .env.local from template"
    } else {
        Write-Error-Custom ".env.local.example not found"
        exit 1
    }
}

Write-Host ""
Write-Host "📋 CONFIGURATION REQUIRED" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Please configure .env.local with your Appwrite credentials:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. VITE_APPWRITE_ENDPOINT" -ForegroundColor Yellow
Write-Host "   Example: https://cloud.appwrite.io"
Write-Host ""
Write-Host "2. VITE_APPWRITE_PROJECT_ID" -ForegroundColor Yellow
Write-Host "   Get from: Appwrite Console > Settings > Project ID"
Write-Host ""
Write-Host "3. APPWRITE_API_KEY" -ForegroundColor Yellow
Write-Host "   Get from: Appwrite Console > Settings > API Keys"
Write-Host "   Required scopes:"
Write-Host "   - databases.read, databases.write"
Write-Host "   - collections.read, collections.write"
Write-Host "   - attributes.read, attributes.write"
Write-Host "   - documents.read, documents.write"
Write-Host ""

if (-not $SkipEdit) {
    Write-Host "Opening .env.local in notepad for editing..." -ForegroundColor Cyan
    Start-Process notepad.exe ".env.local"
    
    Write-Host ""
    Write-Host "⏳ Waiting for you to finish editing..." -ForegroundColor Yellow
    Write-Host "Press any key when you have completed and saved .env.local"
    [void][System.Console]::ReadKey($true)
}

Write-Host ""
Write-Step "Running Appwrite database setup..."
Write-Host ""

# Run the bash script
try {
    bash ./bash.sh
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Header "SETUP COMPLETED SUCCESSFULLY"
        
        Write-Host "📚 Next steps:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Install dependencies:" -ForegroundColor Yellow
        Write-Host "   npm install" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Start development server:" -ForegroundColor Yellow
        Write-Host "   npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Open your browser:" -ForegroundColor Yellow
        Write-Host "   http://localhost:5173" -ForegroundColor White
        Write-Host ""
        Write-Host "📖 For more information, see APPWRITE_SETUP.md" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Error-Custom "Setup failed with exit code $exitCode"
        Write-Host ""
        Write-Host "Please check the error messages above and ensure:" -ForegroundColor Yellow
        Write-Host "- .env.local has correct credentials"
        Write-Host "- Internet connection is working"
        Write-Host "- Appwrite is accessible"
        Write-Host ""
        exit 1
    }
}
catch {
    Write-Error-Custom "An error occurred: $_"
    exit 1
}
