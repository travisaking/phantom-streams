# Phantom Streams - Windows Installation Script
# Run as Administrator: powershell -ExecutionPolicy Bypass -File scripts\install-windows.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Phantom Streams - Windows Installer  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for admin rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator. Some installs may fail." -ForegroundColor Yellow
}

# Function to check if command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to refresh PATH
function Refresh-Path {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

Write-Host "Checking existing installations..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Node.js - Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Rust
if (Test-Command "rustc") {
    $rustVersion = rustc --version
    Write-Host "[OK] Rust $rustVersion" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Rust - Installing..." -ForegroundColor Yellow

    # Download rustup
    $rustupUrl = "https://win.rustup.rs/x86_64"
    $rustupExe = "$env:TEMP\rustup-init.exe"

    Write-Host "Downloading Rust installer..."
    Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupExe

    Write-Host "Running Rust installer (this may take a few minutes)..."
    Start-Process -FilePath $rustupExe -ArgumentList "-y" -Wait -NoNewWindow

    # Add to PATH for this session
    $env:PATH += ";$env:USERPROFILE\.cargo\bin"
    Refresh-Path

    if (Test-Command "rustc") {
        Write-Host "[OK] Rust installed successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Rust installation failed. Please restart PowerShell and try again." -ForegroundColor Red
    }
}

# Check Solana
if (Test-Command "solana") {
    $solanaVersion = solana --version
    Write-Host "[OK] Solana $solanaVersion" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Solana CLI - Installing..." -ForegroundColor Yellow

    # Install via cargo (more reliable on Windows)
    Write-Host "Installing Solana CLI via cargo (this may take several minutes)..."
    cargo install solana-cli --locked

    Refresh-Path

    if (Test-Command "solana") {
        Write-Host "[OK] Solana installed successfully" -ForegroundColor Green

        # Configure for devnet
        solana config set --url devnet

        # Generate keypair if none exists
        $keypairPath = "$env:USERPROFILE\.config\solana\id.json"
        if (-not (Test-Path $keypairPath)) {
            Write-Host "Generating Solana keypair..."
            solana-keygen new --no-bip39-passphrase --outfile $keypairPath
        }
    } else {
        Write-Host "[ERROR] Solana installation failed" -ForegroundColor Red
    }
}

# Check Anchor
if (Test-Command "anchor") {
    $anchorVersion = anchor --version
    Write-Host "[OK] Anchor $anchorVersion" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Anchor CLI - Installing..." -ForegroundColor Yellow

    Write-Host "Installing Anchor via cargo (this may take several minutes)..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

    Refresh-Path

    # Install latest anchor version
    if (Test-Command "avm") {
        avm install latest
        avm use latest
    }

    if (Test-Command "anchor") {
        Write-Host "[OK] Anchor installed successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Anchor installation failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing Project Dependencies      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory and navigate to project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

Write-Host "Installing npm dependencies..."
npm install

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Project                     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try building
if (Test-Command "anchor") {
    Write-Host "Building Anchor programs..."
    anchor build

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Anchor build successful" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Anchor build had issues - check output above" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart PowerShell to refresh PATH"
Write-Host "  2. Run: node standalone_demo.js"
Write-Host "  3. Run: anchor build"
Write-Host "  4. Run: anchor test"
Write-Host ""
Write-Host "For Noir ZK circuits, install separately:"
Write-Host "  noirup -v 1.0.0-beta.13"
Write-Host ""
