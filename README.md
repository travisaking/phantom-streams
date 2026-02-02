# Phantom Streams 🎵🔐

**Private Music Rights Verification on Solana**

Built with **Arcium MPC** + **Noir ZK** for [Solana Privacy Hack 2026](https://solana.com/privacyhack)

[![Demo Video](https://img.shields.io/badge/Demo-Video-red?style=for-the-badge&logo=youtube)](YOUR_VIDEO_URL_HERE)
[![GitHub](https://img.shields.io/badge/GitHub-travisaking%2Fphantom--streams-blue?style=for-the-badge&logo=github)](https://github.com/travisaking/phantom-streams)

---

## 🚀 Quick Demo (No Setup Required)

```bash
# Clone and run the demo in 30 seconds
git clone https://github.com/travisaking/phantom-streams.git
cd phantom-streams
node standalone_demo.js
```

This demonstrates the full privacy flow without any dependencies.

---

## 🎹 Run Locally - All Available Demos

**No dependencies required!** Just clone the repo and run:

```bash
# 1. Generic Privacy Demo - Shows the full ZK verification flow
node standalone_demo.js

# 2. UNICORNY Token Holder Demo - Simulated collectible token verification
node unicorny_demo.js

# 3. UNICORNY Real Wallet Demo - Uses actual Solana wallet addresses
node unicorny_real_demo.js
```

### What Each Demo Shows:

| Demo | Purpose | Best For |
|------|---------|----------|
| `standalone_demo.js` | Full privacy flow with generic music rights | Understanding the core protocol |
| `unicorny_demo.js` | UNICORNY collectible token verification | Showing fan/artist relationship |
| `unicorny_real_demo.js` | Real wallet addresses (Travis + UNICORNY Founder) | Live hackathon demo |

### Sample Output (unicorny_real_demo.js):

```
🦄 UNICORNY Token Holder Verification
     Real Wallet Demo with Phantom Streams

👤 Token Holder: BSDpkAE8dCGm...7DsYQ (Travis)
🎨 Artist Wallet: HVv5haw3eYNa...yLfS (UNICORNY Founder)

✅ ZK Proof Generated: Token ownership verified privately
✅ Nullifier Created: Prevents replay attacks
✅ On-chain Verification: Platform confirms access rights

Result: Fan can prove they hold UNICORNY collectible tokens
        WITHOUT revealing their wallet address or other holdings
```

### Full Build (Optional - For Developers)

If you want to build the Solana program:

```bash
# Install dependencies (see INSTALL.md for full setup)
anchor build              # Builds phantom_streams.so (230KB)
anchor test               # Runs test suite
anchor deploy             # Deploy to devnet
```

---

## Bounties Targeted

| Sponsor | Prize | Integration |
|---------|-------|-------------|
| **Open Track** (Light Protocol) | $18,000 | ZK Compression |
| **Arcium** | $10,000 | MPC for encrypted verification |
| **Aztec/Noir** (Non-Financial) | $2,500 | ZK circuits |
| **Helius** | $5,000 | RPC infrastructure |
| **Encrypt.trade** | $1,000 | Educational content |

**Total Potential: $36,500**

---

## The Problem

On-chain music rights are **public by default**. This creates serious problems:

- **Labels surveil independent artists** — Using blockchain analytics to identify successful indies for predatory deals
- **Fans lose privacy** — Data aggregators sell listening behavior to labels and advertisers
- **Artists can't prove ownership privately** — Verifying rights reveals entire portfolio and wallet history

## The Solution

**Phantom Streams** is a zero-knowledge protocol enabling private verification of music rights ownership.

- ✅ **Artists** can prove they own rights without revealing wallet balance
- ✅ **Fans** can prove they purchased access without exposing their identity
- ✅ **Platforms** can verify access eligibility without seeing user data

## How It Works

### Dual Privacy Stack

**Option A: Arcium MPC (Multi-Party Computation)**
- Encrypted computation across distributed nodes
- Perfect for real-time verification with shared state
- Nodes never see actual data - only encrypted shares

**Option B: Noir ZK (Zero-Knowledge Proofs)**  
- Client-side proof generation
- On-chain verification via Sunspot
- Best for static ownership proofs

```
┌─────────────────────────────────────────────────────────────┐
│                      PHANTOM STREAMS                        │
│              Private Music Rights Verification              │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Rights Mint    │
                    │  (SPL Token)    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│      ARCIUM MPC         │   │       NOIR ZK           │
│  (Encrypted Compute)    │   │   (Proof Generation)    │
├─────────────────────────┤   ├─────────────────────────┤
│ • Shared encrypted state│   │ • Client-side proofs    │
│ • Real-time processing  │   │ • On-chain verification │
│ • Voting & aggregation  │   │ • Merkle inclusion      │
└───────────┬─────────────┘   └───────────┬─────────────┘
            │                             │
            └──────────────┬──────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    Solana Program       │
              │    (Anchor + Helius)    │
              └─────────────────────────┘
```

### Flow

1. **Artist mints rights token** — Creates on-chain representation of music rights
2. **Fan purchases access** — Receives rights token, added to registry Merkle tree
3. **Fan generates ZK proof** — Noir circuit proves ownership without revealing wallet
4. **Platform verifies on-chain** — Solana program checks proof, records nullifier
5. **Access granted** — Fan streams/downloads, platform only knows "valid rights holder"

### What's Public vs Private

| PUBLIC | PRIVATE |
|--------|---------|
| Track ID | Fan's wallet address |
| Merkle root | Rights token ID |
| Nullifier hash | Other holdings |
| Verification timestamp | Transaction history |

## Technical Stack

- **Arcium**: MPC (Multi-Party Computation) for encrypted state
- **Noir**: ZK circuit language by Aztec
- **Sunspot**: Noir verifier for Solana
- **Anchor**: Solana program framework
- **Light Protocol**: ZK Compression
- **Helius**: RPC and indexing infrastructure

## Project Structure

```
phantom_streams/
├── encrypted-ixs/           # Arcium MPC instructions
│   └── src/
│       └── lib.rs           # Encrypted verification logic
├── circuits/                # Noir ZK circuits
│   ├── Nargo.toml
│   └── src/
│       └── main.nr          # Ownership proof circuit
├── programs/
│   ├── phantom-streams/     # Basic Anchor program
│   │   └── src/lib.rs
│   └── phantom-streams-arcium/  # Arcium-integrated program
│       └── src/lib.rs
├── client/
│   └── src/
│       └── index.ts         # TypeScript SDK
├── Arcium.toml              # Arcium configuration
├── Anchor.toml              # Anchor configuration
└── README.md
```

## Quick Start

### Prerequisites

- [Arcium CLI](https://docs.arcium.com/developers/installation)
- [Noir](https://noir-lang.org/docs/getting_started/installation)
- [Anchor](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) 18+

### Install Arcium

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
arcium --version
```

### Build Arcium MPC Instructions

```bash
arcium build
```

### Build Noir Circuits

```bash
cd circuits
nargo check
nargo compile
nargo test
```

### Build Solana Program

```bash
anchor build
anchor test
```

### Deploy to Devnet

```bash
# Initialize Arcium MXE
arcium init-mxe --cluster devnet

# Deploy programs
anchor deploy --provider.cluster devnet
```

### Run Demo

```bash
cd client
npm install
npx ts-node src/index.ts
```

## Bounties Targeted

| Bounty | Prize | Our Angle |
|--------|-------|-----------|
| **Open Track** (Light Protocol) | $18,000 | Primary submission |
| **Aztec/Noir** - Best Non-Financial | $2,500 | Music rights = non-DeFi |
| **Helius** | $5,000 | Uses Helius RPCs |
| **Encrypt.trade** | $1,000 | Educational content |

## Why Music Rights?

90% of hackathon submissions will be:
- Confidential swaps
- Private lending
- Another mixer

**We're solving a real problem in a $43B industry.**

Labels use on-chain analytics as a weapon. Phantom Streams gives creators their privacy back.

## Arcium MPC Features

### Encrypted Instructions

| Instruction | Purpose |
|------------|---------|
| `verify_ownership` | Prove rights ownership without revealing wallet |
| `init_vote_tally` | Initialize encrypted vote counts |
| `cast_royalty_vote` | Cast vote with encrypted choice |
| `reveal_vote_result` | Decrypt and reveal winning option |
| `verify_payment_threshold` | Prove payment meets minimum |

### Why Arcium?

- **No single point of failure** — Data split across MPC nodes
- **Shared encrypted state** — Multiple parties can update without seeing values
- **Real-time processing** — Faster than ZK proof generation
- **Composable** — Works alongside Noir ZK proofs

## Future Extensions

- **Streaming royalties** — Real-time encrypted payment splits
- **Superfan verification** — Prove you own 10+ tracks privately  
- **Cross-platform identity** — Portable verification across services
- **AI integration** — Private recommendation systems

## Team

**Travis A. King**
- CEO, TAK Ventures LLC
- Building [UNICORNY](https://unicorny.xyz) music tokenization
- Host, The Community Builder Show

## Built With

This project integrates multiple privacy technologies from the Solana ecosystem:

| Technology | Provider | Purpose |
|------------|----------|---------|
| **MPC Framework** | [Arcium](https://arcium.com) | Multi-party computation for encrypted verification |
| **ZK Circuits** | [Noir](https://noir-lang.org) by Aztec | Zero-knowledge proof language |
| **On-chain Verifier** | [Sunspot](https://github.com/reilabs/sunspot) | Noir verification on Solana |
| **ZK Compression** | [Light Protocol](https://lightprotocol.com) | Scalable privacy infrastructure |
| **RPC Infrastructure** | [Helius](https://helius.dev) | High-performance Solana RPC |
| **Program Framework** | [Anchor](https://anchor-lang.com) | Solana smart contract development |

## License

MIT

---

**Privacy for creators, not just traders.** 🎵🔐
