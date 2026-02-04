# Phantom Streams - Full Test Runner (FIXED v4)
# Fixes: HOME, PATH, 0.0.0.0 issue, and cleans up validators

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHANTOM STREAMS - TEST RUNNER" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing validators first (prevents stalling)
$existingValidators = Get-Process -Name "solana-test-validator" -ErrorAction SilentlyContinue
if ($existingValidators) {
    Write-Host "[INFO] Killing existing validator processes..." -ForegroundColor Yellow
    $existingValidators | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "[OK] Old validators stopped" -ForegroundColor Green
}

# Set HOME for cargo/rust tools (Windows uses USERPROFILE)
$env:HOME = $env:USERPROFILE
Write-Host "[OK] Set HOME = $env:HOME" -ForegroundColor Green

# Skip platform-tools install
$env:SKIP_PLATFORM_TOOLS_INSTALL = "1"

# FIX: Force Anchor to use 127.0.0.1 instead of 0.0.0.0
$env:ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899"
Write-Host "[OK] Set ANCHOR_PROVIDER_URL = http://127.0.0.1:8899" -ForegroundColor Green

# Add Solana to PATH
$SOLANA_BIN = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
$env:PATH = "$SOLANA_BIN;$env:PATH"

# Add Cargo bin to PATH
$CARGO_BIN = "$env:USERPROFILE\.cargo\bin"
$env:PATH = "$CARGO_BIN;$env:PATH"

# Set ANCHOR_WALLET
$env:ANCHOR_WALLET = "$env:USERPROFILE\.config\solana\id.json"
Write-Host "[OK] Environment configured" -ForegroundColor Green

# Start validator
Write-Host ""
Write-Host "[INFO] Starting local validator..." -ForegroundColor Yellow
$validatorProcess = Start-Process -FilePath "$SOLANA_BIN\solana-test-validator.exe" -PassThru -WindowStyle Minimized
Write-Host "       Validator PID: $($validatorProcess.Id)" -ForegroundColor Gray
Write-Host "       Waiting 15 seconds for validator to fully start..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Verify validator is responding
Write-Host "[INFO] Checking validator..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8899/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Validator is healthy" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Validator health check failed, continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Running Anchor tests..." -ForegroundColor Cyan
Write-Host ""

# Run anchor test with explicit provider URL
& "$CARGO_BIN\anchor.exe" test --skip-build --skip-local-validator --provider.cluster "http://127.0.0.1:8899"

$exitCode = $LASTEXITCODE

# Clean up - stop validator
Write-Host ""
Write-Host "[INFO] Stopping validator..." -ForegroundColor Yellow
Stop-Process -Id $validatorProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Validator stopped" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "  TESTS FAILED (exit code: $exitCode)" -ForegroundColor Red
}
Write-Host "============================================" -ForegroundColor Cyan
