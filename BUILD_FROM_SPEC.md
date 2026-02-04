# Phantom Streams / Rainbow Veil - Build From Spec

> How to recreate this application from specification
> Created: February 2, 2026 | TAK Ventures LLC

## Overview

This document captures how to rebuild the Phantom Streams privacy protocol from scratch. The application was built using Claude Code with the TAC (Travis Agent Commands) methodology.

## Estimated Build Time

| Component | Time Estimate | Complexity |
|-----------|---------------|------------|
| Anchor Program | 2-4 hours | Medium |
| Test Suite | 1-2 hours | Low |
| Demo Scripts | 30 min | Low |
| Documentation | 1 hour | Low |
| **Total** | **4-8 hours** | |

*Estimates based on experienced Solana developer with Claude Code assistance.*

## Core Specification

### Program ID
```
2dtcKpRkN7UHADJoWeheHt3kN9T7JQntsGnCRDK9pi6X
```

### Account Structures

**ProtocolState** (PDA seed: "state")
```rust
pub struct ProtocolState {
    pub authority: Pubkey,        // Can update merkle root
    pub merkle_root: [u8; 32],    // Current rights registry root
    pub verification_count: u64,  // Total verifications
    pub bump: u8,
}
```

**NullifierAccount** (PDA seed: ["nullifier", nullifier_hash])
```rust
pub struct NullifierAccount {
    pub is_used: bool,
    pub track_id: [u8; 32],
    pub used_at: i64,
    pub bump: u8,
}
```

### Instructions

| Instruction | Purpose | Access |
|-------------|---------|--------|
| `initialize()` | Create protocol state | Anyone (once) |
| `update_merkle_root(new_root)` | Update rights registry | Authority only |
| `verify_ownership(proof, track_id, nullifier, root)` | Verify ownership | Anyone |
| `check_nullifier(nullifier_hash)` | Check if used | View function |

### Events

```rust
MerkleRootUpdated { old_root, new_root, timestamp }
OwnershipVerified { track_id, nullifier_hash, verification_id, timestamp }
```

### Error Codes

```rust
6000 - Unauthorized
6001 - NullifierAlreadyUsed
6002 - InvalidMerkleRoot
6003 - InvalidProof
6004 - Overflow
```

## Recreation Steps

### 1. Initialize Anchor Project

```bash
anchor init phantom-streams
cd phantom-streams
```

### 2. Create Program (programs/phantom-streams/src/lib.rs)

Key requirements:
- State PDA with authority, merkle root, verification count
- Nullifier PDAs to prevent replay attacks
- Authority constraint on merkle root updates
- Events for verification tracking

### 3. Build IDL

```bash
anchor build
# IDL generated at target/idl/phantom_streams.json
```

### 4. Create Test Suite (tests/phantom-streams.ts)

Requirements:
- Load IDL directly (not workspace) for compatibility
- Use provider wallet (not new keypair) to avoid airdrop issues
- Test cases:
  - Protocol initialization
  - Merkle root update (authorized)
  - Unauthorized update rejection
  - Ownership verification
  - Nullifier replay prevention
  - Privacy validation (no wallet addresses stored)

### 5. Windows Test Runner (run-tests.ps1)

Key fixes required:
- Set `$env:HOME = $env:USERPROFILE`
- Use `127.0.0.1` not `0.0.0.0`
- Kill existing validators before starting new one
- Set `ANCHOR_PROVIDER_URL` explicitly

### 6. Package Versions

```json
{
  "@coral-xyz/anchor": "^0.32.0",
  "@solana/web3.js": "^1.87.0"
}
```

Must match Anchor CLI version (0.32.x).

## Validation Commands

```powershell
# Run full test suite
.\run-tests.ps1

# Expected output: 6 passing tests
# - Protocol Initialization
# - Merkle Root Management
# - Unauthorized Update Rejection
# - Ownership Verification
# - Replay Attack Prevention
# - Privacy Guarantees
```

## Key Technical Decisions

### Why Not Use `anchor.workspace`?

The `anchor.workspace.phantomStreams` pattern fails with Anchor 0.30+ because:
1. IDL format changed (discriminators as arrays, types separate from accounts)
2. Workspace loader expects metadata.address field
3. Direct IDL loading with `new Program(idl, provider)` works reliably

### Why Provider Wallet Instead of Generated Keypair?

- Local validator doesn't always respond to airdrop requests immediately
- Provider wallet is pre-funded by validator
- Avoids flaky tests due to airdrop timing issues

### Why 127.0.0.1 Instead of 0.0.0.0?

Windows doesn't bind to 0.0.0.0 the same way as Linux. Explicit 127.0.0.1 works on all platforms.

## Files Created in This Sprint

| File | Purpose |
|------|---------|
| `tests/phantom-streams.ts` | Full Anchor test suite |
| `run-tests.ps1` | Windows test runner (PowerShell) |
| `run-tests.bat` | Windows test runner (CMD) |
| `unicorny_real_demo.js` | Demo with Travis's real wallets |
| `BUILD_FROM_SPEC.md` | This document |

## Related Specs

- [CONTEXT.md](./CONTEXT.md) - Project context and hackathon details
- [BOUNTY_ANALYSIS.md](./BOUNTY_ANALYSIS.md) - Bounty targeting strategy
- [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md) - Hackathon submission requirements

## Contact

Travis A. King
TAK Ventures LLC
GitHub: @travisaking
