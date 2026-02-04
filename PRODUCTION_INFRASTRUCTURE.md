# Production Infrastructure Guide

> Rainbow Veil / Phantom Streams - Decentralized Production Deployment
> **First Product in UNICORNY Labs Ecosystem**
> TAK Ventures LLC

---

## Philosophy: Decentralization First

**Why we DON'T recommend AWS/GCP/Azure as primary:**
- Single points of failure (us-east-1 outages affect everyone)
- Against the ethos of Web3/Solana
- Centralized control over your infrastructure
- Privacy concerns with Big Tech
- Higher costs for equivalent compute

**Solana's dirty secret:** ~45% of validator stake runs on AWS/Hetzner. This is a known centralization risk. We should do better.

---

## Market Opportunity: UNICORNY Ecosystem

### The Music Industry Problem

```
┌─────────────────────────────────────────────────────────────────────┐
│              GLOBAL MUSIC INDUSTRY: $100B+ ANNUALLY                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   WHERE THE MONEY GOES:                                             │
│   ┌─────────────────────────────────────────────┐                  │
│   │ Labels & Publishers         │ 43% │ $43B   │                  │
│   │ Streaming Platforms         │ 25% │ $25B   │                  │
│   │ Distributors & Middlemen    │ 12% │ $12B   │                  │
│   │ Radio & Sync               │  8% │  $8B   │                  │
│   │ ─────────────────────────────────────────── │                  │
│   │ ARTISTS                    │ 12% │ $12B   │ ← The problem     │
│   └─────────────────────────────────────────────┘                  │
│                                                                     │
│   Artists create 100% of the value, capture 12%.                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### UNICORNY's 4 Pillars

| Pillar | Purpose | Products | Market Size |
|--------|---------|----------|-------------|
| **ENERGY** | Fuel for transactions | Token utility, uploads, mints | $5B (platform fees) |
| **CAPITAL** | Investment & funding | Royalties, advances, fan investment | $15B (music financing) |
| **INTELLIGENCE** | Data & analytics | Radar, Rainbow Veil, AI insights | $3B (music data) |
| **LABOR** | Payments to contributors | Producer/engineer compensation | $8B (session work) |

### UNICORNY Labs Products

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UNICORNY LABS PRODUCT SUITE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   🌈 RAINBOW VEIL (This Project) - LAUNCHING FIRST                 │
│   ├── Privacy-preserving ownership verification                    │
│   ├── ZK proofs for token gating                                   │
│   ├── Pillar: Intelligence                                         │
│   └── Revenue: $0.01-0.05 per verification                         │
│                                                                     │
│   🔮 UNICORNY RADAR (solana-exploding-v2)                          │
│   ├── Cross-platform mention tracking                              │
│   ├── PES (Promotional Effort Score)                               │
│   ├── Pillar: Intelligence                                         │
│   └── Revenue: $15-50/month subscription                           │
│                                                                     │
│   🛡️ HERD PROTECTION (scamfi-protocol)                             │
│   ├── Transfer hooks for bad actor detection                       │
│   ├── Automated seizure & redistribution                           │
│   ├── Pillar: Security (cross-pillar)                              │
│   └── Revenue: 0.1% of protected token volume                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Total Addressable Market (TAM) Analysis

### Market Sizing

```
GLOBAL MUSIC INDUSTRY
├── Total Market: $100B
│
├── TAM (Total Addressable Market)
│   └── All music transactions that could use blockchain: $50B
│       ├── Streaming royalties: $20B
│       ├── Sync licensing: $5B
│       ├── Live/merch: $15B
│       └── Fan engagement: $10B
│
├── SAM (Serviceable Addressable Market)
│   └── Independent artists + privacy-conscious users: $15B
│       ├── Indie artist share: $8B (60% of artists, 15% of revenue)
│       ├── Web3 music market: $2B (growing 40% YoY)
│       └── Token-gated content: $5B (emerging)
│
└── SOM (Serviceable Obtainable Market) - 5 Year Target
    └── Realistic capture with 4 pillars: $500M-2B
        ├── Protocol fees (0.5-1%): $50-200M
        ├── Subscriptions (Radar): $30-100M
        ├── Verification fees (Veil): $10-50M
        └── Protection fees (Herd): $20-80M
```

### Revenue Projections by Product

| Year | Rainbow Veil | UNICORNY Radar | Herd Protection | Total |
|------|--------------|----------------|-----------------|-------|
| 1 | $50K | $100K | $25K | $175K |
| 2 | $500K | $1M | $250K | $1.75M |
| 3 | $5M | $10M | $2.5M | $17.5M |
| 4 | $25M | $50M | $12.5M | $87.5M |
| 5 | $100M | $200M | $50M | $350M |

**Assumptions:**
- 40% YoY growth in Web3 music
- 10% market share of Solana music ecosystem by Year 5
- Token utility increases demand across all products

### Rainbow Veil Specific Economics

```
RAINBOW VEIL UNIT ECONOMICS

Per Verification:
├── Revenue: $0.01-0.05 (paid in UNICORNY token)
├── Compute cost: $0.002 (ZK proof generation)
├── RPC cost: $0.0001 (Solana transaction)
└── Gross margin: 80-95%

At Scale (1M verifications/month):
├── Revenue: $10K-50K/month
├── Costs: $2K-5K/month
├── Gross profit: $8K-45K/month
└── Annual: $100K-540K

At Full Adoption (100M verifications/month):
├── Revenue: $1M-5M/month
├── Costs: $100K-200K/month
├── Gross profit: $900K-4.8M/month
└── Annual: $10M-58M
```

---

## Decentralized Production Architecture (PRIMARY RECOMMENDATION)

```
┌─────────────────────────────────────────────────────────────────────┐
│           DECENTRALIZED INFRASTRUCTURE (RECOMMENDED)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FRONTEND (Censorship-Resistant)                                   │
│  ┌──────────────┐      ┌──────────────┐                           │
│  │    Fleek     │  OR  │   Arweave    │                           │
│  │  (IPFS CDN)  │      │  (Permanent) │                           │
│  └──────────────┘      └──────────────┘                           │
│          │                    │                                    │
│          └────────────────────┘                                    │
│                    │                                               │
│                    ▼                                               │
│  COMPUTE (Decentralized)                                          │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐    │
│  │    Akash     │      │    Flux      │      │   Spheron    │    │
│  │   Network    │  OR  │   Network    │  OR  │   Network    │    │
│  │ (Pay in AKT) │      │ (Pay in FLUX)│      │ (Compute)    │    │
│  └──────────────┘      └──────────────┘      └──────────────┘    │
│          │                    │                     │             │
│          └────────────────────┼─────────────────────┘             │
│                               │                                   │
│                               ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SERVICE LAYER                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │ ZK Prover│  │ Backend  │  │ Indexer  │  │ API      │   │ │
│  │  │ Service  │  │ API      │  │ Service  │  │ Gateway  │   │ │
│  │  │ (16GB)   │  │ (2GB)    │  │ (1GB)    │  │          │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│          ┌────────────────────┼────────────────────┐             │
│          │                    │                    │             │
│          ▼                    ▼                    ▼             │
│  STORAGE (Decentralized)                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   Arweave    │      │   Ceramic    │      │   WeaveDB    │   │
│  │  (Permanent  │      │  (Mutable    │      │  (Queryable  │   │
│  │   Storage)   │      │   Data)      │      │   on Arweave)│   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│                               │                                   │
│                               ▼                                   │
│  BLOCKCHAIN (Solana)                                             │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  RPC Providers (Multiple for Redundancy)                     ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    ││
│  │  │  Helius  │  │ GenesysGo│  │  Triton  │  │Self-hosted│    ││
│  │  │ (Primary)│  │ (Backup) │  │ (Backup) │  │ (Backup)  │    ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Decentralized Provider Comparison

### Compute (ZK Prover)

| Provider | Type | 4CPU/16GB Cost | Decentralized? |
|----------|------|----------------|----------------|
| **Akash Network** | Decentralized marketplace | ~$50/month | ✅ Yes |
| **Flux** | Decentralized cloud | ~$60/month | ✅ Yes |
| **Spheron** | Decentralized compute | ~$55/month | ✅ Yes |
| AWS EC2 | Centralized | ~$140/month | ❌ No |
| GCP | Centralized | ~$120/month | ❌ No |

**Winner: Akash Network** - 60% cheaper, truly decentralized, pay in crypto

### Frontend Hosting

| Provider | Type | Cost | Decentralized? |
|----------|------|------|----------------|
| **Fleek** | IPFS + CDN | Free-$20/month | ✅ Yes |
| **Arweave** | Permanent storage | ~$5 one-time | ✅ Yes |
| **4EVERLAND** | IPFS hosting | Free tier | ✅ Yes |
| Vercel | Centralized | Free-$20/month | ❌ No |
| Netlify | Centralized | Free-$19/month | ❌ No |

**Winner: Fleek** - IPFS-based, global CDN, easy deployment

### Database

| Provider | Type | Cost | Decentralized? |
|----------|------|------|----------------|
| **Ceramic Network** | Decentralized data | Free (self-host) | ✅ Yes |
| **WeaveDB** | Arweave-based DB | ~$10/month | ✅ Yes |
| **Tableland** | SQL on-chain | Gas costs | ✅ Yes |
| PostgreSQL on Akash | Self-hosted | ~$20/month | ✅ Yes |
| AWS RDS | Centralized | ~$30/month | ❌ No |

**Winner: Ceramic + WeaveDB** - Decentralized, queryable, permanent

### Storage

| Provider | Type | Cost | Decentralized? |
|----------|------|------|----------------|
| **Arweave** | Permanent | ~$5/GB one-time | ✅ Yes |
| **Filecoin/IPFS** | Distributed | ~$0.01/GB/month | ✅ Yes |
| **Storj** | Distributed | $4/TB/month | ✅ Yes |
| AWS S3 | Centralized | $23/TB/month | ❌ No |

**Winner: Arweave** - Pay once, store forever, perfect for proofs

---

## Recommended Stack (Decentralized)

### Option A: Full Decentralization (RECOMMENDED)

```
┌────────────────────────────────────────────────────────────┐
│  FULLY DECENTRALIZED STACK                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend:    Fleek (IPFS)                    FREE        │
│  Compute:     Akash Network (4CPU/16GB)       $50/month   │
│  Database:    Ceramic Network                 FREE        │
│  Storage:     Arweave (proofs)                $5 one-time │
│  RPC:         Helius + GenesysGo backup       $49/month   │
│  ──────────────────────────────────────────────────────── │
│  TOTAL:                                       ~$99/month  │
│                                                            │
│  ✅ No single point of failure                            │
│  ✅ Censorship-resistant                                  │
│  ✅ 30% cheaper than centralized                          │
│  ✅ Aligned with Web3 ethos                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Option B: Hybrid (Decentralized Compute, Some Centralized)

```
┌────────────────────────────────────────────────────────────┐
│  HYBRID STACK (Pragmatic)                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend:    Vercel (easy CI/CD)             FREE        │
│  Compute:     Akash Network                   $50/month   │
│  Database:    Railway Postgres                $10/month   │
│  Storage:     Arweave                         $5 one-time │
│  RPC:         Helius                          $49/month   │
│  ──────────────────────────────────────────────────────── │
│  TOTAL:                                       ~$109/month │
│                                                            │
│  ✅ Decentralized compute (most critical)                 │
│  ✅ Easy development workflow                             │
│  ⚠️  Some centralized dependencies                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Option C: Centralized (NOT RECOMMENDED - Only if Necessary)

```
┌────────────────────────────────────────────────────────────┐
│  CENTRALIZED STACK (Last Resort)                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend:    Vercel                          FREE        │
│  Compute:     AWS EC2 m5.xlarge               $140/month  │
│  Database:    AWS RDS PostgreSQL              $30/month   │
│  Storage:     AWS S3                          $5/month    │
│  RPC:         Helius                          $49/month   │
│  ──────────────────────────────────────────────────────── │
│  TOTAL:                                       ~$224/month │
│                                                            │
│  ❌ Single point of failure (AWS us-east-1)               │
│  ❌ Against Web3 ethos                                    │
│  ❌ 2x more expensive                                     │
│  ❌ Privacy concerns                                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Akash Network Deployment

### deploy.yaml (Akash SDL)

```yaml
---
version: "2.0"

services:
  rainbow-veil-prover:
    image: unicornylabs/rainbow-veil-prover:latest
    expose:
      - port: 3001
        as: 80
        to:
          - global: true
    env:
      - SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=xxx
      - NODE_ENV=production
    resources:
      cpu:
        units: 4
      memory:
        size: 16Gi
      storage:
        size: 20Gi

  rainbow-veil-api:
    image: unicornylabs/rainbow-veil-api:latest
    expose:
      - port: 3000
        as: 443
        to:
          - global: true
    env:
      - DATABASE_URL=xxx
      - PROVER_URL=http://rainbow-veil-prover
    resources:
      cpu:
        units: 2
      memory:
        size: 4Gi
      storage:
        size: 10Gi

profiles:
  compute:
    rainbow-veil-prover:
      resources:
        cpu:
          units: 4
        memory:
          size: 16Gi
        storage:
          size: 20Gi
    rainbow-veil-api:
      resources:
        cpu:
          units: 2
        memory:
          size: 4Gi
        storage:
          size: 10Gi

  placement:
    akash:
      attributes:
        host: akash
      signedBy:
        anyOf:
          - akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63
      pricing:
        rainbow-veil-prover:
          denom: uakt
          amount: 5000  # ~$50/month
        rainbow-veil-api:
          denom: uakt
          amount: 2000  # ~$20/month

deployment:
  rainbow-veil-prover:
    akash:
      profile: rainbow-veil-prover
      count: 1
  rainbow-veil-api:
    akash:
      profile: rainbow-veil-api
      count: 1
```

### Deployment Commands

```bash
# Install Akash CLI
curl -sSfL https://raw.githubusercontent.com/akash-network/node/master/install.sh | sh

# Fund wallet with AKT
akash tx bank send <faucet> <your-wallet> 10000000uakt

# Deploy
akash tx deployment create deploy.yaml --from <wallet> --node https://rpc.akash.network:443

# Get lease
akash query market lease list --owner <your-wallet>

# Access logs
akash provider lease-logs --from <wallet> --provider <provider-address>
```

---

## Multi-Product Infrastructure (All 4 Pillars)

### Full UNICORNY Ecosystem Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│              UNICORNY LABS FULL ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INTELLIGENCE PILLAR                                               │
│  ├── 🌈 Rainbow Veil (Privacy Verification)                        │
│  │   ├── Akash: ZK Prover (16GB)              $50/month            │
│  │   └── Akash: API (4GB)                     $20/month            │
│  │                                                                  │
│  └── 🔮 UNICORNY Radar (Analytics)                                 │
│      ├── Akash: Scraper Cluster (8GB x 3)     $45/month            │
│      └── Akash: API (4GB)                     $20/month            │
│                                                                     │
│  SECURITY PILLAR                                                   │
│  └── 🛡️ Herd Protection (Transfer Hooks)                          │
│      ├── Akash: Risk API (4GB)                $20/month            │
│      └── Indexer (2GB)                        $10/month            │
│                                                                     │
│  SHARED INFRASTRUCTURE                                             │
│  ├── Ceramic Network (Decentralized DB)       FREE                 │
│  ├── Arweave (Permanent Storage)              $50 one-time         │
│  ├── Helius RPC (Primary)                     $199/month           │
│  ├── GenesysGo RPC (Backup)                   $49/month            │
│  └── Fleek (Frontend CDN)                     $20/month            │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────│
│  TOTAL MONTHLY (All Products):                ~$433/month          │
│  At Scale (10x):                              ~$2,000/month        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5-Year Infrastructure Scaling

| Year | Users | Verifications/mo | Infra Cost | Revenue | Profit |
|------|-------|------------------|------------|---------|--------|
| 1 | 1K | 10K | $500/mo | $2K/mo | $1.5K/mo |
| 2 | 10K | 100K | $1.5K/mo | $20K/mo | $18.5K/mo |
| 3 | 100K | 1M | $5K/mo | $200K/mo | $195K/mo |
| 4 | 500K | 5M | $15K/mo | $1M/mo | $985K/mo |
| 5 | 1M+ | 10M+ | $30K/mo | $2M+/mo | $1.97M+/mo |

**Key insight:** Decentralized infrastructure scales linearly while maintaining 95%+ gross margins.

---

## Security (Decentralized Context)

### Secrets Management
```
❌ DON'T: AWS Secrets Manager (centralized)
✅ DO: Akash encrypted env vars + multi-sig wallets
✅ DO: Lit Protocol for decentralized access control
```

### Multi-Sig Wallets
```
Deployment authority: 3-of-5 multi-sig (Squads Protocol)
Fee payer: Hot wallet with daily limits
Treasury: 5-of-7 multi-sig with timelock
```

### RPC Redundancy
```
Primary:   Helius (99.9% uptime)
Secondary: GenesysGo (auto-failover)
Tertiary:  Self-hosted on Akash (backup)
```

---

## Conclusion: Why Decentralized

| Aspect | Centralized (AWS) | Decentralized (Akash) |
|--------|-------------------|----------------------|
| Cost | $224/month | $99/month |
| Uptime risk | us-east-1 outages | Distributed globally |
| Censorship | Can be shut down | Censorship-resistant |
| Privacy | AWS sees all data | No central observer |
| Ethos | Against Web3 values | Aligned with mission |
| Scaling | Expensive | Linear cost |

**Rainbow Veil is the first product in the UNICORNY ecosystem. Building on decentralized infrastructure from day one sets the standard for all future products.**

---

## Next Steps

1. **Week 1:** Deploy Rainbow Veil on Akash (testnet)
2. **Week 2:** Add Ceramic for user data
3. **Week 3:** Frontend on Fleek/IPFS
4. **Week 4:** Full integration test
5. **Month 2:** Mainnet launch with all products
