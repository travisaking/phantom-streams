@echo off
REM Phantom Streams - Full Test Runner
REM Run this from Command Prompt in the phantom_streams_sprint directory

echo.
echo ============================================
echo   PHANTOM STREAMS - TEST RUNNER
echo ============================================
echo.

REM Check for solana in PATH
where solana >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Solana not in PATH, using default location...
    set PATH=%PATH%;%USERPROFILE%\.local\share\solana\install\active_release\bin
)

echo [INFO] Starting local validator...
echo        Open a NEW terminal and run: solana-test-validator
echo        Then press any key to continue...
pause >nul

echo.
echo [INFO] Running Anchor tests...
echo.

REM Set wallet path
set ANCHOR_WALLET=%USERPROFILE%\.config\solana\id.json

REM Run anchor test
%USERPROFILE%\.cargo\bin\anchor.exe test --skip-local-validator

echo.
echo ============================================
echo   TESTS COMPLETE
echo ============================================
echo.
pause
