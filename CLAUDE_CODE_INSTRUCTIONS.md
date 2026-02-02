# Claude Code Sprint Instructions

## MISSION

Build a minimum viable submission for Solana Privacy Hackathon by February 1, 2026.
**NOW WITH ARCIUM MPC INTEGRATION**

**Project:** Phantom Streams - Private Music Rights Verification
**Goal:** Working demo with Arcium MPC + Noir ZK dual privacy stack
**Target Bounties:** Open Track ($18K) + Arcium ($10K) + Noir ($2.5K) + Helius ($5K) = $35.5K+

---

## PRIORITY ORDER (UPDATED)

### 1. ARCIUM MPC (3 hours) ⭐ PRIMARY

Location: `encrypted-ixs/src/lib.rs` + `programs/phantom-streams-arcium/src/lib.rs`

**Tasks:**
1. Install Arcium: `curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash`
2. Verify: `arcium --version`
3. Build encrypted instructions: `arcium build`
4. Fix any Arcis/Rust errors
5. Deploy MXE to devnet: `arcium init-mxe --cluster devnet`

**Success criteria:** Encrypted instructions compile, MXE initialized on devnet

### 2. NOIR CIRCUIT (1.5 hours)

Location: `circuits/src/main.nr`

**Tasks:**
1. Install Noir: `noirup -v 1.0.0-beta.13`
2. Run: `cd circuits && nargo check`
3. Fix any compilation errors
4. Run tests: `nargo test`
5. Compile: `nargo compile`

**Success criteria:** Circuit compiles and tests pass

### 3. SOLANA PROGRAMS (1.5 hours)

Location: `programs/phantom-streams-arcium/src/lib.rs`

**Tasks:**
1. Build: `anchor build`
2. Fix Rust errors (may need arcium-anchor crate)
3. Test locally: `anchor test`
4. Deploy to devnet

**Success criteria:** Programs deploy to devnet

### 4. CLIENT SDK (1 hour)

Location: `client/src/index.ts`

**Tasks:**
1. Install deps: `cd client && npm install`
2. Update program IDs to match deployed
3. Run demo: `npx ts-node src/index.ts`

**Success criteria:** Demo shows full Arcium + ZK flow

### 5. DOCUMENTATION & VIDEO (1 hour)

**Tasks:**
1. Update README with deployed program IDs
2. Record 3-min video showing:
   - Problem: Labels surveilling artists
   - Solution: Arcium MPC + Noir ZK
   - Demo: Encrypted verification flow
3. Submit to hackathon

---

## KEY FILES TO MODIFY

```
circuits/src/main.nr     <- ZK circuit (may need Noir version adjustments)
programs/.../lib.rs      <- Solana program (check Anchor version)
scripts/demo.ts          <- Demo script (update program ID after deploy)
README.md                <- Add deployed program ID
```

---

## COMMON ISSUES AND FIXES

### Noir Issues
- **"unknown function"**: Check Noir version, API changed between versions
- **Pedersen hash**: Use `std::hash::pedersen_hash` not `std::hash::pedersen`
- **Array types**: Noir is strict about array sizes

### Anchor Issues
- **Version mismatch**: Ensure Anchor CLI matches Cargo.toml version
- **Program ID**: After first `anchor build`, update declare_id! with generated key
- **Rent**: Account space calculations must be exact

### Integration Issues
- **Program ID**: Must match deployed program exactly
- **Devnet SOL**: Airdrop may fail, use https://faucet.solana.com

---

## SUBMISSION CHECKLIST

Before submitting to hackathon:

- [ ] Noir circuit compiles (`nargo compile`)
- [ ] Noir tests pass (`nargo test`)
- [ ] Anchor program builds (`anchor build`)
- [ ] Program deployed to devnet
- [ ] Demo script runs successfully
- [ ] README has correct program ID
- [ ] 3-minute video recorded
- [ ] Code pushed to public GitHub repo
- [ ] Submitted via https://solanafoundation.typeform.com/privacyhack

---

## SUBMISSION FORM CONTENT

**Project Name:** Phantom Streams

**Tagline:** Private music rights verification on Solana

**Description:**
Phantom Streams enables artists and fans to prove music rights ownership without revealing wallet addresses or holdings. Using Noir ZK circuits and Solana programs, we bring privacy to the $43B music industry where labels currently use on-chain analytics to surveil independent artists.

**Bounties:**
- Open Track (Light Protocol)
- Aztec/Noir - Best Non-Financial Use Case
- Helius
- Encrypt.trade

**Tech Stack:**
- Noir (ZK circuits)
- Anchor (Solana program)
- TypeScript (SDK/demo)
- Helius (RPC)

**GitHub:** [your repo URL]

**Demo Video:** [your video URL]

---

## TIME BUDGET

| Task | Time | Status |
|------|------|--------|
| Noir circuit | 2h | ⬜ |
| Anchor program | 2h | ⬜ |
| Integration | 1h | ⬜ |
| Docs | 30m | ⬜ |
| Video | 30m | ⬜ |
| Submit | 15m | ⬜ |
| **TOTAL** | **~6.5h** | |

---

## EMERGENCY FALLBACK

If Noir circuit doesn't work in time:

1. Submit with mock proof verification (current demo.ts approach)
2. Document "Noir integration planned" in README
3. Focus on:
   - Clean Solana program
   - Good documentation
   - Compelling video narrative

The **narrative** and **problem framing** matter more than perfect ZK integration for judges.

---

## GO BUILD 🚀

Start with: `cd circuits && nargo check`
