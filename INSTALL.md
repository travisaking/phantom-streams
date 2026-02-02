# Phantom Streams - Installation Guide

## Windows Setup - VERIFIED WORKING (February 2026)

This guide gets you from zero to a working build of Phantom Streams.

**Tested Configuration:**
- Rust 1.93.0 (stable)
- Solana CLI 1.18.26
- Anchor CLI 0.32.1
- Build output: `target/deploy/phantom_streams.so` (230KB)

---

## Prerequisites

| Tool | Status | Check Command |
|------|--------|---------------|
| Node.js 18+ | Required | `node --version` |
| Rust | Required | `rustc --version` |
| Solana CLI | Required | `solana --version` |
| Anchor CLI | Required | `anchor --version` |
| Noir (nargo) | Optional* | `nargo --version` |
| Arcium CLI | Optional* | `arcium --version` |

*Optional for demo - required for full ZK/MPC features

---

## Step 1: Install Rust

Open PowerShell as Administrator:

```powershell
# Download and run rustup installer
Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe -y

# Restart PowerShell, then verify
rustc --version
cargo --version
```

Or download manually: https://rustup.rs

---

## Step 2: Install Solana CLI

```powershell
# Install Solana CLI for Windows
# Option A: Using the installer
Invoke-WebRequest -Uri https://release.solana.com/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe -OutFile solana-install.exe
.\solana-install.exe v1.18.4

# Add to PATH (may need to restart terminal)
$env:PATH += ";$HOME\.local\share\solana\install\active_release\bin"

# Verify
solana --version

# Configure for devnet
solana config set --url devnet

# Create a keypair (for testing)
solana-keygen new --no-bip39-passphrase
```

---

## Step 3: Install Anchor

```powershell
# Install Anchor CLI via cargo
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Verify
anchor --version
```

---

## Step 4: Install Node Dependencies

```powershell
cd C:\Users\TAK\Downloads\phantom_streams_sprint

# Install project dependencies
npm install

# Verify TypeScript works
npx ts-node --version
```

---

## Step 5: Build the Project

```powershell
# Build Anchor programs
anchor build

# Run tests
anchor test --skip-local-validator

# Or run with local validator
anchor test
```

---

## Step 6: Install Noir (Optional)

Noir is for ZK proof generation. The standalone demo works without it.

```powershell
# Install noirup
Invoke-WebRequest -Uri https://raw.githubusercontent.com/noir-lang/noirup/main/install.ps1 -OutFile noirup-install.ps1
.\noirup-install.ps1

# Install specific version
noirup -v 1.0.0-beta.13

# Verify
nargo --version

# Build circuits
cd circuits
nargo check
nargo compile
nargo test
```

---

## Step 7: Install Arcium (Optional)

Arcium provides MPC functionality. The standalone demo simulates this.

```powershell
# Install Arcium CLI
# Note: Windows support may require WSL
# Check latest instructions at: https://docs.arcium.com/developers/installation

# For WSL:
wsl -d Ubuntu -e bash -c "curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash"
```

---

## Quick Verification

After installation, run these commands:

```powershell
# Check everything is installed
rustc --version      # Should show 1.75+
solana --version     # Should show 1.18+
anchor --version     # Should show 0.29+
node --version       # Should show 18+

# Run standalone demo (no dependencies needed)
node standalone_demo.js

# Build Anchor programs
anchor build

# Run full demo
npm run demo
```

---

## Troubleshooting

### "anchor: command not found"
```powershell
# Add cargo bin to PATH
$env:PATH += ";$HOME\.cargo\bin"
# Or add to your PowerShell profile permanently
```

### "solana: command not found"
```powershell
# Add Solana to PATH
$env:PATH += ";$HOME\.local\share\solana\install\active_release\bin"
```

### Build fails with linker errors
```powershell
# Install Visual Studio Build Tools
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Select "Desktop development with C++"
```

### Anchor build fails
```powershell
# Make sure you're in the project root
cd C:\Users\TAK\Downloads\phantom_streams_sprint

# Clean and rebuild
anchor clean
anchor build
```

---

## Running Locally

### Option 1: Standalone Demo (No Dependencies)
```powershell
node standalone_demo.js
```

### Option 2: Full Anchor Build
```powershell
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Deploy and test
anchor deploy
npm run demo
```

### Option 3: Devnet Deployment
```powershell
# Ensure you have devnet SOL
solana airdrop 2

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

## Project Structure After Build

```
phantom_streams/
├── target/
│   ├── deploy/
│   │   ├── phantom_streams.so       # Compiled program
│   │   └── phantom_streams-keypair.json
│   └── idl/
│       └── phantom_streams.json     # Program IDL
├── circuits/
│   └── target/
│       └── phantom_streams.json     # Compiled circuit
└── node_modules/
```

---

## Next Steps

1. Run `node standalone_demo.js` to verify the demo works
2. Run `anchor build` to compile Solana programs
3. Run `anchor test` to verify everything works
4. Deploy to devnet: `anchor deploy --provider.cluster devnet`
5. Record your demo video!
