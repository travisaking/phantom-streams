# Production ZK Specification

> Rainbow Veil / Phantom Streams - Real Zero-Knowledge Implementation
> UNICORNY Labs | TAK Ventures LLC

## Overview

This document specifies the path from mocked ZK proofs to production-grade zero-knowledge verification on Solana.

---

## Current State (MVP)

```typescript
// Current implementation (mocked)
const proofData = Buffer.from("PROOF:" + randomBytes(64));
```

**What works:**
- ✅ Noir circuit compiles and tests pass
- ✅ Solana program handles state, nullifiers, authorization
- ✅ 6/6 Anchor tests passing
- ✅ Demo scripts with real wallet addresses

**What's mocked:**
- ⚠️ Proof generation (random bytes instead of real ZK)
- ⚠️ Proof verification (accepts any data)

---

## Production Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser/App)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. User clicks "Prove Ownership"                                  │
│      └─> compute-inputs.ts                                          │
│          ├─ Fetch wallet's token holdings                           │
│          ├─ Build Merkle tree from registry                         │
│          ├─ Compute Merkle path for user's leaf                     │
│          └─ Compute nullifier hash                                  │
│                                                                     │
│   2. Generate ZK Proof                                              │
│      └─> Noir WASM (in-browser) OR backend API                      │
│          ├─ Load compiled circuit (phantom_streams.json)            │
│          ├─ Create witness from inputs                              │
│          └─> Barretenberg WASM proves circuit                       │
│                                                                     │
│   3. Submit to Solana                                               │
│      └─> Transaction with proof + public inputs                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SOLANA PROGRAM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   verify_ownership instruction:                                     │
│   1. Deserialize proof bytes                                        │
│   2. Extract public inputs (merkle_root, track_id, nullifier)       │
│   3. Verify proof using on-chain verifier                           │
│   4. Check nullifier not already used                               │
│   5. Record nullifier, emit event                                   │
│                                                                     │
│   Verifier Options:                                                 │
│   ├─ Option A: Sunspot (Noir verifier for Solana)                   │
│   ├─ Option B: Groth16 verifier (requires circuit conversion)       │
│   └─ Option C: Arcium MPC (distributed verification)                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Compute Consistent Inputs

**File:** `scripts/compute-inputs.ts`

The Noir circuit requires mathematically consistent inputs:
- `merkle_root` must equal `compute_merkle_root(leaf, path, indices)`
- `nullifier_hash` must equal `H(wallet || track || domain_separator)`

```typescript
import { pedersen_hash } from '@noir-lang/noir_js';

interface ProofInputs {
  // Private (hidden from verifier)
  wallet_address: bigint;
  rights_token_id: bigint;
  merkle_path: bigint[];
  merkle_indices: number[];

  // Public (visible to verifier)
  merkle_root: bigint;
  track_id: bigint;
  nullifier_hash: bigint;
}

function computeLeaf(wallet: bigint, tokenId: bigint, track: bigint): bigint {
  return pedersen_hash([wallet, tokenId, track]);
}

function computeMerkleRoot(leaf: bigint, path: bigint[], indices: number[]): bigint {
  let current = leaf;
  for (let i = 0; i < path.length; i++) {
    if (indices[i] === 0) {
      current = pedersen_hash([current, path[i]]);
    } else {
      current = pedersen_hash([path[i], current]);
    }
  }
  return current;
}

function computeNullifier(wallet: bigint, track: bigint): bigint {
  const DOMAIN_SEPARATOR = 0x7068616e746f6d737472656d73n; // "phantomstreams"
  return pedersen_hash([wallet, track, DOMAIN_SEPARATOR]);
}
```

### Step 2: Generate Real Proof

**File:** `scripts/generate-proof.ts`

```typescript
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from '../circuits/target/phantom_streams.json';

async function generateProof(inputs: ProofInputs): Promise<{
  proof: Uint8Array;
  publicInputs: string[];
}> {
  // Initialize backend
  const backend = new BarretenbergBackend(circuit);
  const noir = new Noir(circuit, backend);

  // Format inputs for Noir
  const noirInputs = {
    wallet_address: inputs.wallet_address.toString(),
    rights_token_id: inputs.rights_token_id.toString(),
    merkle_path: inputs.merkle_path.map(x => x.toString()),
    merkle_indices: inputs.merkle_indices,
    merkle_root: inputs.merkle_root.toString(),
    track_id: inputs.track_id.toString(),
    nullifier_hash: inputs.nullifier_hash.toString(),
  };

  // Generate proof
  const { proof, publicInputs } = await noir.generateProof(noirInputs);

  return { proof, publicInputs };
}
```

### Step 3: On-Chain Verification

**Option A: Sunspot (Recommended)**

Sunspot is a Noir verifier for Solana developed by Reilabs.

```rust
// programs/phantom-streams/src/lib.rs
use sunspot::verify_proof;

pub fn verify_ownership(
    ctx: Context<VerifyOwnership>,
    proof: Vec<u8>,
    public_inputs: Vec<[u8; 32]>,
) -> Result<()> {
    // Load verification key (generated from circuit)
    let vk = include_bytes!("../verification_key.bin");

    // Verify the ZK proof
    require!(
        verify_proof(vk, &proof, &public_inputs)?,
        ErrorCode::InvalidProof
    );

    // Extract public inputs
    let merkle_root = public_inputs[0];
    let track_id = public_inputs[1];
    let nullifier_hash = public_inputs[2];

    // Check merkle root matches current state
    require!(
        ctx.accounts.state.merkle_root == merkle_root,
        ErrorCode::InvalidMerkleRoot
    );

    // Check nullifier not used
    require!(
        !ctx.accounts.nullifier.is_used,
        ErrorCode::NullifierAlreadyUsed
    );

    // Record verification
    ctx.accounts.nullifier.is_used = true;
    ctx.accounts.nullifier.track_id = track_id;
    ctx.accounts.state.verification_count += 1;

    emit!(OwnershipVerified {
        track_id,
        nullifier_hash,
        verification_id: ctx.accounts.state.verification_count,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

**Option B: Groth16 Verifier**

If Sunspot isn't available, convert the circuit to Groth16:

```bash
# Convert ACIR to Groth16
bb write_vk -b circuits/target/phantom_streams.json
bb contract -k vk -o verifier.sol

# Then use solana-groth16-verifier crate
```

---

## Proof Size & Gas Estimates

| Component | Size | Solana CU |
|-----------|------|-----------|
| Proof (Barretenberg) | ~2KB | - |
| Public inputs (3) | 96 bytes | - |
| Verification | - | ~200K CU |
| State update | - | ~5K CU |
| **Total transaction** | ~2.5KB | ~205K CU |

Solana limit: 1.4M CU per transaction → ✅ Fits easily

---

## Client SDK

**File:** `client/src/prover.ts`

```typescript
export class RainbowVeilProver {
  private noir: Noir;
  private backend: BarretenbergBackend;

  constructor(circuit: CompiledCircuit) {
    this.backend = new BarretenbergBackend(circuit);
    this.noir = new Noir(circuit, this.backend);
  }

  async proveOwnership(params: {
    walletAddress: PublicKey;
    tokenMint: PublicKey;
    trackId: string;
    registry: MerkleTree;
  }): Promise<OwnershipProof> {
    // 1. Find user's leaf in registry
    const leaf = registry.findLeaf(walletAddress, tokenMint);
    if (!leaf) throw new Error("Token not found in registry");

    // 2. Get Merkle proof
    const { path, indices } = registry.getProof(leaf.index);

    // 3. Compute inputs
    const inputs = this.computeInputs({
      wallet: walletAddress,
      tokenId: tokenMint,
      trackId,
      path,
      indices,
      root: registry.root,
    });

    // 4. Generate proof
    const { proof, publicInputs } = await this.noir.generateProof(inputs);

    return {
      proof: Buffer.from(proof),
      merkleRoot: publicInputs[0],
      trackId: publicInputs[1],
      nullifierHash: publicInputs[2],
    };
  }
}
```

---

## Testing Real Proofs

### Local Test (GitHub Codespaces)

```bash
# In Codespaces environment
cd circuits

# Generate witness and prove
nargo execute witness
bb prove -b target/phantom_streams.json -w target/witness.gz -o proof

# Verify locally
bb verify -k vk -p proof
```

### Integration Test

```typescript
describe("Real ZK Proofs", () => {
  it("generates and verifies real ownership proof", async () => {
    const prover = new RainbowVeilProver(circuit);

    // Generate real proof
    const proof = await prover.proveOwnership({
      walletAddress: TRAVIS_PRIMARY,
      tokenMint: UNICORNY_TOKEN,
      trackId: "FOUNDING-MEMBER",
      registry: testRegistry,
    });

    // Submit to Solana
    const tx = await program.methods
      .verifyOwnership(
        proof.proof,
        proof.merkleRoot,
        proof.trackId,
        proof.nullifierHash
      )
      .accounts({...})
      .rpc();

    // Verify on-chain state updated
    const state = await program.account.protocolState.fetch(statePda);
    expect(state.verificationCount.toNumber()).to.equal(1);
  });
});
```

---

## Hardware Requirements

### Development (Codespaces)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 8GB | 16GB |
| CPU | 2 cores | 4 cores |
| Storage | 10GB | 20GB |
| Time to setup | ~10 min | ~5 min |

**GitHub Codespaces:** 4-core, 16GB RAM (free tier) ✅

### Production (Backend API)

| Resource | Minimum | Notes |
|----------|---------|-------|
| RAM | 4GB | For Barretenberg prover |
| CPU | 2 cores | Proof gen ~2-5 seconds |
| Storage | 5GB | Circuit + dependencies |

**Estimated cost:** ~$20/month on Railway/Render

---

## Security Considerations

1. **Private inputs never leave client** - Wallet address, token ID stay local
2. **Nullifier prevents replay** - Each proof can only be used once
3. **Merkle root pinned on-chain** - Can't forge proofs for non-existent tokens
4. **Domain separator** - Prevents cross-protocol nullifier reuse

---

## Migration Path

### Phase 1: Current MVP (Now)
- Mocked proofs ✅
- Full protocol logic ✅
- Tests passing ✅

### Phase 2: Real Client Proofs (Week 2)
- Add `@noir-lang/noir_js` to client
- Implement `compute-inputs.ts`
- Implement `generate-proof.ts`
- Test in Codespaces

### Phase 3: Real On-Chain Verification (Week 3)
- Integrate Sunspot verifier
- Generate verification key from circuit
- Update Anchor program
- End-to-end test

### Phase 4: Production (Week 4)
- Deploy to devnet with real verification
- Performance optimization
- Security audit considerations
- Mainnet deployment

---

## References

- [Noir Documentation](https://noir-lang.org/docs)
- [Barretenberg Backend](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg)
- [Sunspot (Noir on Solana)](https://github.com/reilabs/sunspot)
- [Solana ZK Compression](https://www.zkcompression.com/)
