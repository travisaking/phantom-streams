# Local Validation Checklist (Windows)

> What you CAN and CANNOT test locally on Windows

---

## ✅ Can Test Locally on Windows

### 1. Anchor Program Tests
```powershell
cd C:\Users\TAK\Downloads\phantom_streams_sprint
.\run-tests.ps1

# Expected: 6/6 tests passing
# ✅ Protocol Initialization
# ✅ Merkle Root Management
# ✅ Unauthorized Update Rejection
# ✅ Ownership Verification
# ✅ Replay Attack Prevention
# ✅ Privacy Guarantees
```

### 2. Node.js Demo Scripts
```powershell
# Generic demo
node standalone_demo.js

# UNICORNY demo with fake wallets
node unicorny_demo.js

# UNICORNY demo with YOUR real wallets
node unicorny_real_demo.js
```

### 3. TypeScript/JavaScript Code
```powershell
# Compile TypeScript
npx tsc --noEmit

# Run any .ts files
npx ts-node scripts/whatever.ts
```

### 4. Git Operations
```powershell
git status
git add .
git commit -m "message"
git push
```

### 5. NPM/Package Management
```powershell
npm install
npm run build
npm test
```

---

## ⚠️ Requires WSL (Risky - May Crash)

### Noir Circuit Compilation
```bash
# In WSL Ubuntu (NOT PowerShell)
cd /mnt/c/Users/TAK/Downloads/phantom_streams_sprint/circuits
~/.nargo/bin/nargo check
~/.nargo/bin/nargo compile
~/.nargo/bin/nargo test
```

**Warning:** Running `apt-get` or heavy WSL operations crashed your laptop 3 times. Avoid.

---

## ❌ Cannot Test Locally - Use Codespaces

### Real ZK Proof Generation
```bash
# Requires barretenberg (no Windows support)
bb prove -b target/phantom_streams.json -w witness.gz -o proof
```

**Why:** Barretenberg only has Linux/Mac binaries

### Full End-to-End with Real Proofs
```bash
# Generate proof + submit to Solana + verify
npm run prove-and-verify
```

**Why:** Needs both bb (Linux) and Solana running

---

## Validation Workflow

### Daily Development (Local)

```
1. Write code
2. Run: .\run-tests.ps1 → 6/6 passing
3. Run: node unicorny_real_demo.js → Visual check
4. Commit and push
```

### Weekly Integration (Codespaces)

```
1. Open GitHub Codespaces
2. Run: nargo compile → Circuit compiles
3. Run: bb prove → Real proof generated
4. Run: anchor test → Full integration
5. Merge to main
```

### Pre-Release (Codespaces + Devnet)

```
1. Open Codespaces
2. Run full test suite
3. Deploy to devnet
4. Test with real wallets on devnet
5. Create GitHub release tag
```

---

## Quick Validation Commands

### "Does everything still work?"
```powershell
# Run from phantom_streams_sprint directory
.\run-tests.ps1
```
Expected: `ALL TESTS PASSED` with 6/6

### "Can I see the demo?"
```powershell
node unicorny_real_demo.js
```
Expected: Full output showing privacy flow

### "Is my code valid TypeScript?"
```powershell
npx tsc --noEmit
```
Expected: No errors

### "Did I break any dependencies?"
```powershell
npm install
```
Expected: No errors

---

## What Each Test Validates

| Test | What It Proves |
|------|----------------|
| `run-tests.ps1` | Solana program logic is correct |
| `node demo.js` | Privacy flow concept works |
| `nargo check` | ZK circuit is valid Noir |
| `nargo test` | ZK circuit logic is correct |
| `bb prove` | Real proofs can be generated |
| `anchor test` (Codespaces) | Full integration works |

---

## Troubleshooting

### "run-tests.ps1 hangs"
```powershell
# Kill any stuck validators
taskkill /f /im solana-test-validator.exe
# Try again
.\run-tests.ps1
```

### "Port already in use"
```powershell
# Check what's using 8899
netstat -ano | findstr 8899
# Kill the process
taskkill /f /pid <PID>
```

### "WSL crashed my computer"
```
DON'T run apt-get through Claude Code.
Open a separate Ubuntu terminal if you need WSL.
Or just use GitHub Codespaces for Linux stuff.
```

---

## Summary

| Task | Where to Do It |
|------|----------------|
| Write code | Windows (VS Code) |
| Test Anchor program | Windows (`run-tests.ps1`) |
| Run demos | Windows (`node demo.js`) |
| Compile Noir | Codespaces |
| Generate real proofs | Codespaces |
| Deploy to devnet | Codespaces or GitHub Actions |
| Production deployment | Dedicated cloud infrastructure |
