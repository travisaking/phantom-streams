# Production Infrastructure Guide

> Rainbow Veil / Phantom Streams - Honest Production Deployment
> **First Product in UNICORNY Labs Ecosystem**
> TAK Ventures LLC

---

## Philosophy: What Actually Works

**The honest truth about "decentralized infrastructure":**
- Most top Solana projects (Jupiter, Magic Eden, Backpack) use Vercel/AWS
- 45% of Solana validator stake runs on AWS/Hetzner
- "Decentralized cloud" (Akash, Flux) exists but isn't widely adopted yet
- Akash is actually moving TO Solana - not used BY Solana projects

**Our approach:** Use what works, avoid Big 3 where possible, be honest about trade-offs.

---

## What Top Solana Projects Actually Use

| Project | Frontend | Backend | RPC |
|---------|----------|---------|-----|
| Jupiter | Vercel | AWS | Helius |
| Magic Eden | Cloudflare | AWS | Triton |
| Backpack | Vercel | - | Helius |
| Marinade | Vercel | AWS | Helius |
| Tensor | Cloudflare | AWS | Helius |

**Source:** Production apps, not marketing materials.

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

### UNICORNY's 4 Pillars (From Tokenomics Spreadsheets)

| Pillar | Purpose | Products | Market Size |
|--------|---------|----------|-------------|
| **ENERGY** | Fuel for transactions | Token utility, uploads, mints | $5B |
| **CAPITAL** | Investment & funding | Royalties, advances, fan investment | $15B |
| **INTELLIGENCE** | Data & analytics | Radar, Rainbow Veil, AI insights | $3B |
| **LABOR** | Payments to contributors | Producer/engineer compensation | $8B |

### Revenue Projections (All 3 Products)

| Year | Rainbow Veil | UNICORNY Radar | Herd Protection | Total |
|------|--------------|----------------|-----------------|-------|
| 1 | $50K | $100K | $25K | $175K |
| 2 | $500K | $1M | $250K | $1.75M |
| 3 | $5M | $10M | $2.5M | $17.5M |
| 4 | $25M | $50M | $12.5M | $87.5M |
| 5 | $100M | $200M | $50M | $350M |

---

## Recommended Production Stack

### Option A: Pragmatic (RECOMMENDED)

What we actually recommend for a production app that needs to work:

```
┌────────────────────────────────────────────────────────────┐
│  PRAGMATIC STACK (What Actually Works)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend:     Cloudflare Pages            FREE           │
│               (Global CDN, fast, not AWS)                 │
│                                                            │
│  Backend API:  Railway                     $20/month      │
│               (Easy deployment, good DX)                  │
│                                                            │
│  ZK Prover:    Hetzner Dedicated           $50/month      │
│               (Bare metal, not Big 3, EU)                 │
│               AX42 - AMD Ryzen, 64GB RAM                  │
│                                                            │
│  RPC:          Helius                      $49/month      │
│               (Solana-native, Mert's company)             │
│               + Triton backup              $29/month      │
│                                                            │
│  Storage:      Arweave                     $5 one-time    │
│               (Permanent, for proof artifacts)            │
│                                                            │
│  Database:     Railway Postgres            $10/month      │
│               OR PlanetScale              $29/month       │
│                                                            │
│  ──────────────────────────────────────────────────────── │
│  TOTAL:                                    ~$160/month    │
│                                                            │
│  ✅ Reliable, proven infrastructure                       │
│  ✅ Avoids Big 3 (AWS/GCP/Azure) where possible          │
│  ✅ Good developer experience                             │
│  ✅ Reasonable cost                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Why These Choices?

| Component | Choice | Why Not AWS? | Why Not "Decentralized"? |
|-----------|--------|--------------|--------------------------|
| Frontend | Cloudflare | Not AWS, faster | Fleek has less adoption |
| Backend | Railway | Simpler than ECS | Akash harder to debug |
| Compute | Hetzner | 50% cheaper, EU | Akash not proven for ZK |
| RPC | Helius | Solana-native | N/A - Helius is the answer |
| Storage | Arweave | N/A | Arweave IS decentralized ✅ |
| Database | Railway PG | Simpler than RDS | Ceramic less mature |

### Option B: Decentralized (Aspirational)

If you want to go full decentralized (understanding the trade-offs):

```
┌────────────────────────────────────────────────────────────┐
│  DECENTRALIZED STACK (Aspirational)                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend:     4EVERLAND or Spheron        FREE-$20       │
│               (IPFS-based)                                │
│                                                            │
│  Backend:      Akash Network               ~$50/month     │
│               (Decentralized compute)                     │
│                                                            │
│  ZK Prover:    Akash Network               ~$70/month     │
│               (16GB+ instance)                            │
│                                                            │
│  RPC:          Helius + self-hosted        $49 + $50      │
│               (Run your own RPC on Akash)                 │
│                                                            │
│  Storage:      Arweave                     $5 one-time    │
│                                                            │
│  Database:     WeaveDB or Ceramic          FREE-$20       │
│                                                            │
│  ──────────────────────────────────────────────────────── │
│  TOTAL:                                    ~$220/month    │
│                                                            │
│  ✅ Truly decentralized                                   │
│  ✅ Censorship-resistant                                  │
│  ⚠️  Harder to debug                                      │
│  ⚠️  Less reliable (newer infrastructure)                 │
│  ⚠️  Fewer developers know how to use it                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Option C: Centralized (Last Resort)

If you absolutely need AWS (enterprise requirements, existing contracts):

```
┌────────────────────────────────────────────────────────────┐
│  CENTRALIZED STACK (AWS - Last Resort)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend:     Vercel                      FREE-$20       │
│  Backend:      AWS ECS Fargate             $40/month      │
│  ZK Prover:    AWS EC2 m5.xlarge           $140/month     │
│  RPC:          Helius                      $49/month      │
│  Storage:      AWS S3 + Arweave            $10/month      │
│  Database:     AWS RDS PostgreSQL          $30/month      │
│  ──────────────────────────────────────────────────────── │
│  TOTAL:                                    ~$290/month    │
│                                                            │
│  ❌ Single point of failure (us-east-1)                   │
│  ❌ Against Web3 ethos                                    │
│  ❌ Most expensive option                                 │
│  ❌ Vendor lock-in                                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Service Details

### Helius (RPC) - The Standard

[Helius](https://www.helius.dev) is the go-to for Solana:
- Founded by Mert, deeply integrated with Solana ecosystem
- Powers Backpack, Tensor, and many top apps
- Enhanced APIs (NFT, DAS, webhooks)
- ~140ms latency, MEV protection

| Plan | Cost | Requests |
|------|------|----------|
| Free | $0 | 100K/month |
| Developer | $49/month | 2M/month |
| Business | $199/month | 10M/month |
| Enterprise | Custom | Unlimited |

### Hetzner (Compute) - The Quiet MVP

Why many Solana validators use Hetzner:
- 50-70% cheaper than AWS
- German company (GDPR compliant)
- Bare metal = better for ZK proofs
- Not Big 3 = diversification

| Server | Specs | Cost |
|--------|-------|------|
| AX42 | Ryzen 7, 64GB RAM, 1TB NVMe | €49/month |
| AX52 | Ryzen 9, 128GB RAM, 2TB NVMe | €89/month |
| AX102 | EPYC, 256GB RAM, 2x2TB NVMe | €179/month |

### Cloudflare Pages (Frontend)

Why Cloudflare over Vercel:
- Not AWS (Vercel uses AWS under the hood)
- Faster global CDN
- Free tier is generous
- Better security (WAF included)

### Arweave (Storage) - Actually Decentralized

One thing the industry got right:
- Pay once, store forever
- ~$5/GB (one-time)
- Perfect for ZK proof artifacts, NFT metadata
- Used by Metaplex, Shadow Drive

---

## Scaling Strategy

### Phase 1: MVP (0-1K users)
```
Cloudflare Pages      FREE
Railway API           $20/month
Railway Postgres      $10/month
Helius Free           FREE
Arweave              $5 one-time
─────────────────────────────────
Total:               $30/month
```

### Phase 2: Growth (1K-10K users)
```
Cloudflare Pages      FREE
Railway API (scaled)  $50/month
Hetzner AX42         €49/month
Railway Postgres      $29/month
Helius Developer     $49/month
─────────────────────────────────
Total:               ~$180/month
```

### Phase 3: Scale (10K-100K users)
```
Cloudflare Pro        $20/month
Multiple Railway      $150/month
Hetzner AX102        €179/month
PlanetScale          $79/month
Helius Business      $199/month
Triton backup        $99/month
─────────────────────────────────
Total:               ~$750/month
```

### Phase 4: Mass Adoption (100K+ users)
```
Cloudflare Enterprise Custom
Kubernetes cluster   $2000/month
Multiple Hetzner     $500/month
PlanetScale scale    $500/month
Helius Enterprise    Custom
Multiple RPC backup  $500/month
─────────────────────────────────
Total:               ~$4000+/month
```

---

## Security

### Secrets Management
```
✅ DO: Railway encrypted env vars
✅ DO: Doppler (secrets management)
✅ DO: 1Password for teams
❌ DON'T: .env files in repo
❌ DON'T: Hardcoded keys
```

### Wallet Security
```
Deployer:    Multi-sig (Squads Protocol)
Fee Payer:   Hot wallet, daily limits, auto-refill
Treasury:    Cold storage, 3-of-5 multi-sig
Upgrade:     Multi-sig with 24h timelock
```

### RPC Redundancy
```
Primary:     Helius (99.9% uptime)
Secondary:   Triton (auto-failover)
Tertiary:    QuickNode (backup)
Monitor:     Custom health checks every 30s
```

---

## 5-Year Infrastructure Scaling

| Year | Users | Verifications/mo | Infra Cost | Revenue | Margin |
|------|-------|------------------|------------|---------|--------|
| 1 | 1K | 10K | $360/yr | $24K/yr | 98% |
| 2 | 10K | 100K | $2.2K/yr | $240K/yr | 99% |
| 3 | 100K | 1M | $9K/yr | $2.4M/yr | 99.6% |
| 4 | 500K | 5M | $30K/yr | $12M/yr | 99.8% |
| 5 | 1M+ | 10M+ | $50K/yr | $24M+/yr | 99.8% |

---

## The Honest Trade-off Matrix

| Priority | Centralized | Pragmatic | Decentralized |
|----------|-------------|-----------|---------------|
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **DX** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Decentralization** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Censorship Resistance** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Web3 Ethos** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Our recommendation:** Start with **Pragmatic** stack. Move components to decentralized as those options mature.

---

## Quick Start

```bash
# 1. Deploy frontend to Cloudflare Pages
npx wrangler pages deploy ./dist

# 2. Deploy API to Railway
railway up

# 3. Set up Helius
# Get API key from https://helius.dev

# 4. Deploy to Hetzner (for ZK prover)
ssh root@your-hetzner-server
docker-compose up -d

# 5. Store proofs on Arweave
npx arweave deploy proof.json
```

---

## Conclusion

**Rainbow Veil is the first product in the UNICORNY ecosystem.**

We're being honest about infrastructure:
- Use what works (Cloudflare, Hetzner, Helius)
- Avoid Big 3 where practical (no AWS/GCP/Azure)
- Use actually decentralized options where mature (Arweave)
- Plan to migrate as decentralized infra matures

The goal is a working product that serves users, not ideological purity that breaks in production.

---

## Sources

- [Helius - Solana's Leading RPC](https://www.helius.dev)
- [Hetzner Dedicated Servers](https://www.hetzner.com/dedicated-rootserver)
- [Cloudflare Pages](https://pages.cloudflare.com)
- [Railway](https://railway.app)
- [Arweave](https://arweave.org)
- [Solana Ecosystem Report H1 2025](https://www.helius.dev/blog/solana-ecosystem-report-h1-2025)
