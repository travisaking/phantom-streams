# Phantom Streams - Solana Privacy Hackathon Sprint Context
## For Claude Code Implementation | Deadline: February 1, 2026

**Builder:** Travis A. King | TAK Ventures LLC
**Hackathon:** Solana Privacy Hack (https://solana.com/privacyhack)
**Submission Due:** February 1, 2026

---

## EXECUTIVE SUMMARY

**Phantom Streams** is a zero-knowledge protocol enabling private verification of music rights ownership on Solana. Artists prove rights, fans prove purchases, platforms verify access — all without exposing wallet addresses or holdings.

### Why This Wins

1. **Non-DeFi angle** — 90% of submissions will be confidential swaps/lending. Music rights is novel.
2. **Real problem** — $43B industry where labels use on-chain analytics to surveil independent artists
3. **Stacked bounties** — Target $26.5K across multiple tracks

### Target Bounties

| Bounty | Prize | Fit |
|--------|-------|-----|
| Open Track (Light Protocol) | $18,000 | Primary - ZK compression for rights tokens |
| Aztec/Noir - Best Non-Financial | $2,500 | **Perfect** - exactly what we're building |
| Helius | $5,000 | Use their RPCs and DAS API |
| Encrypt.trade | $1,000 | Educational content about artist privacy |

---

## SUBMISSION REQUIREMENTS

### Must Have (from hackathon page)

- [ ] All code open source (MIT license)
- [ ] Integrate with Solana + privacy-preserving tech
- [ ] Deploy to devnet or mainnet
- [ ] 3-minute demo video
- [ ] Documentation on how to run/use

### Minimum Viable Submission

For tonight's sprint, we need:

1. **Working Noir circuit** that proves ownership without revealing wallet
2. **Solana program** that verifies proofs on devnet
3. **Simple CLI or script** demonstrating the flow
4. **README** with architecture explanation
5. **3-min video** showing artist→fan→verify flow

---

## TECHNICAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      PHANTOM STREAMS                        │
│              Private Music Rights Verification              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Rights Mint   │────▶│  Merkle Tree    │────▶│   ZK Prover     │
│   (SPL Token)   │     │  (Indexed)      │     │   (Noir/Aztec)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Verifier UI   │◀────│ Solana Program  │◀────│  Proof Output   │
│   (Demo App)    │     │ (Anchor)        │     │  (Nullifier)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Data Flow

**Proof Generation (Client-Side):**
1. User selects track they want to prove ownership of
2. Client fetches Merkle proof from indexed tree
3. Noir circuit runs locally, generates ZK proof
4. Proof + public inputs sent to verifier

**Verification (On-Chain):**
1. Verifier program receives proof
2. Checks nullifier hasn't been used (prevents replay)
3. Verifies proof against current Merkle root
4. Emits verification event
5. Platform reads event, grants access

---

## NOIR CIRCUIT SPECIFICATION

### Core Circuit: Ownership Proof

```noir
// phantom_streams/circuits/ownership.nr
//
// Proves: "I own rights to track X"
// Reveals: Track ID, verification timestamp
// Hides: Wallet address, other holdings, transaction history

use dep::std;

global TREE_DEPTH: u32 = 20;

fn main(
    // Private inputs (hidden from verifier)
    wallet_address: Field,
    rights_token_id: Field,
    merkle_path: [Field; 20],
    merkle_indices: [u1; 20],
    
    // Public inputs (visible to verifier)
    merkle_root: pub Field,
    track_id: pub Field,
    nullifier_hash: pub Field,
    timestamp: pub Field
) {
    // 1. Compute leaf from private data
    let leaf = std::hash::pedersen([wallet_address, rights_token_id, track_id])[0];
    
    // 2. Verify Merkle path
    let computed_root = compute_merkle_root(leaf, merkle_path, merkle_indices);
    assert(computed_root == merkle_root);
    
    // 3. Verify nullifier (prevents double-proving with same wallet+track)
    let computed_nullifier = std::hash::pedersen([
        wallet_address, 
        track_id,
        0x7068616e746f6d // "phantom" domain separator
    ])[0];
    assert(computed_nullifier == nullifier_hash);
}

fn compute_merkle_root(
    leaf: Field,
    path: [Field; 20],
    indices: [u1; 20]
) -> Field {
    let mut current = leaf;
    for i in 0..20 {
        let path_element = path[i];
        if indices[i] == 0 {
            current = std::hash::pedersen([current, path_element])[0];
        } else {
            current = std::hash::pedersen([path_element, current])[0];
        }
    }
    current
}
```

---

## SOLANA PROGRAM (ANCHOR)

### Basic Structure

```rust
// programs/phantom_streams/src/lib.rs

use anchor_lang::prelude::*;

declare_id!("PhntmStr3amsXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod phantom_streams {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.merkle_root = [0u8; 32];
        state.verification_count = 0;
        Ok(())
    }

    pub fn update_merkle_root(
        ctx: Context<UpdateRoot>,
        new_root: [u8; 32],
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.state.authority,
            PhantomError::Unauthorized
        );
        ctx.accounts.state.merkle_root = new_root;
        emit!(MerkleRootUpdated {
            new_root,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn verify_ownership(
        ctx: Context<VerifyOwnership>,
        proof: Vec<u8>,
        track_id: [u8; 32],
        nullifier_hash: [u8; 32],
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let nullifier = &mut ctx.accounts.nullifier;
        
        // Check nullifier not used
        require!(!nullifier.is_used, PhantomError::NullifierAlreadyUsed);
        
        // TODO: Verify ZK proof using Sunspot or similar
        // For MVP, we trust the proof format
        
        // Mark nullifier used
        nullifier.is_used = true;
        nullifier.track_id = track_id;
        nullifier.timestamp = Clock::get()?.unix_timestamp;
        
        state.verification_count += 1;
        
        emit!(OwnershipVerified {
            track_id,
            nullifier_hash,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + State::SIZE)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(new_root: [u8; 32])]
pub struct UpdateRoot<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(proof: Vec<u8>, track_id: [u8; 32], nullifier_hash: [u8; 32])]
pub struct VerifyOwnership<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Nullifier::SIZE,
        seeds = [b"nullifier", nullifier_hash.as_ref()],
        bump
    )]
    pub nullifier: Account<'info, Nullifier>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct State {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub verification_count: u64,
}

impl State {
    pub const SIZE: usize = 32 + 32 + 8;
}

#[account]
pub struct Nullifier {
    pub is_used: bool,
    pub track_id: [u8; 32],
    pub timestamp: i64,
}

impl Nullifier {
    pub const SIZE: usize = 1 + 32 + 8;
}

#[event]
pub struct MerkleRootUpdated {
    pub new_root: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct OwnershipVerified {
    pub track_id: [u8; 32],
    pub nullifier_hash: [u8; 32],
    pub timestamp: i64,
}

#[error_code]
pub enum PhantomError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Nullifier already used")]
    NullifierAlreadyUsed,
    #[msg("Invalid proof")]
    InvalidProof,
}
```

---

## MVP IMPLEMENTATION PLAN

### Phase 1: Noir Circuit (2-3 hours)
1. Install Noir toolchain
2. Create basic ownership circuit
3. Test with mock data
4. Generate proof locally

### Phase 2: Solana Program (2-3 hours)
1. Scaffold Anchor project
2. Implement state management
3. Add nullifier tracking
4. Deploy to devnet

### Phase 3: Integration (1-2 hours)
1. TypeScript SDK connecting Noir → Solana
2. CLI tool for proof generation/verification
3. Test end-to-end flow

### Phase 4: Demo & Docs (1-2 hours)
1. Record 3-min video
2. Write README
3. Create architecture diagram
4. Submit to hackathon

---

## UNIQUE POSITIONING (Why We Win)

### Domain Insight (from Travis's research)
- Labels use blockchain analytics to identify successful independent artists for predatory deals
- Fans lose privacy to data aggregators selling listening behavior
- Artists want pseudonymity + verifiable credentials — ZK uniquely solves this tension
- Token-gated content needs privacy — holders shouldn't doxx their bags to access perks

### What 100 Other Submissions Will Do
- Generic "private payments"
- Confidential DeFi swaps
- Another mixer clone

### What We Do Differently
- Solve a $43B industry problem
- Music-specific with real use cases
- Connects to existing ecosystem (UNICORNY/SAING mentioned but not exposed)
- Narrative + code + educational content (not just code dump)

---

## DEMO SCRIPT (3 minutes)

**[0:00-0:30] Hook**
"Every time an independent artist checks their wallet on-chain, they're giving labels a free competitive intelligence report. Phantom Streams fixes this."

**[0:30-1:00] Problem**
"On-chain music rights are public by default. Labels track indie artist revenue. Fans get doxxed. Artists can't prove ownership without revealing their portfolio."

**[1:00-2:00] Demo**
- Show artist minting a rights token
- Show fan purchasing access
- Show fan generating ZK proof of ownership
- Show platform verifying proof (access granted, wallet hidden)

**[2:00-2:30] Technical**
"Built with Noir circuits and Solana. Uses Helius for indexing. Open infrastructure — any platform can integrate."

**[2:30-3:00] Close**
"Privacy for creators, not just traders. Phantom Streams."

---

## RESOURCES

### Hackathon Links
- Main page: https://solana.com/privacyhack
- Submissions: https://solanafoundation.typeform.com/privacyhack
- Discord: [Solana developers Discord]
- Workshops: Noir on Solana (Jan 13), Light Protocol (Jan 14)

### Technical Docs
- Noir: https://noir-lang.org
- Anchor: https://www.anchor-lang.com
- Sunspot (ZK verifier on Solana): search for latest docs
- Light Protocol: https://lightprotocol.com
- Helius: https://helius.dev

### Travis's Related Work
- UNICORNY: Music tokenization protocol
- SAING: Decentralized streaming platform
- ScamFi: Wallet forensics tool
- PES: Promotional Effort Score system

---

## COMMANDS TO GET STARTED

```bash
# Install Noir
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup

# Create Noir project
nargo new phantom_streams_circuits
cd phantom_streams_circuits

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Create Anchor project
anchor init phantom_streams_program
cd phantom_streams_program

# Install dependencies
yarn add @coral-xyz/anchor @solana/web3.js
```

---

## WHAT TO BUILD TONIGHT

### Minimum for submission:
1. `circuits/ownership.nr` - Working Noir circuit
2. `programs/phantom_streams/` - Anchor program on devnet
3. `scripts/demo.ts` - Script showing full flow
4. `README.md` - Architecture + how to run
5. `demo.mp4` - 3-minute video

### Nice to have (if time):
- Simple React UI for demo
- Helius integration for indexing
- Educational content for Encrypt.trade bounty

Let's ship this.
