# Production Infrastructure Guide

> Rainbow Veil / Phantom Streams - Real Production Deployment
> **NOT GitHub Actions** - This is dedicated cloud infrastructure

---

## CI/CD vs Production

| Aspect | CI/CD (GitHub Actions) | Production |
|--------|------------------------|------------|
| **Purpose** | Test code on PRs | Serve real users |
| **Scale** | 1 request at a time | 1000s concurrent |
| **Uptime** | Minutes per run | 99.9% SLA |
| **Cost** | Free tier | $200-2000/month |
| **Data** | Ephemeral | Persistent |

---

## Production Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRODUCTION STACK                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐        │
│  │   CloudFlare │      │   Vercel/    │      │    AWS       │        │
│  │   (CDN/WAF)  │─────▶│   Netlify    │      │   Lambda     │        │
│  │              │      │   Frontend   │      │   (Edge)     │        │
│  └──────────────┘      └──────────────┘      └──────────────┘        │
│          │                    │                     │                 │
│          │                    │                     │                 │
│          └────────────────────┼─────────────────────┘                 │
│                               │                                       │
│                               ▼                                       │
│                    ┌──────────────────┐                               │
│                    │   API Gateway    │                               │
│                    │   (Kong/AWS)     │                               │
│                    └────────┬─────────┘                               │
│                             │                                         │
│          ┌──────────────────┼──────────────────┐                     │
│          │                  │                  │                     │
│          ▼                  ▼                  ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  ZK Prover   │  │   Backend    │  │   Indexer    │               │
│  │  Service     │  │   API        │  │   Service    │               │
│  │  (16GB RAM)  │  │   (Node.js)  │  │   (Events)   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│          │                  │                  │                     │
│          └──────────────────┼──────────────────┘                     │
│                             │                                         │
│          ┌──────────────────┼──────────────────┐                     │
│          │                  │                  │                     │
│          ▼                  ▼                  ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  PostgreSQL  │  │    Redis     │  │   Solana     │               │
│  │  (RDS)       │  │   (Cache)    │  │   RPC        │               │
│  │  Merkle data │  │   Sessions   │  │   Helius     │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Service Breakdown

### 1. ZK Prover Service

**Purpose:** Generate zero-knowledge proofs

**Requirements:**
- 16GB+ RAM (Barretenberg is memory-intensive)
- 4+ CPU cores
- SSD storage

**Cloud Options:**
| Provider | Instance | Cost/month |
|----------|----------|------------|
| AWS | m5.xlarge | ~$140 |
| GCP | n2-standard-4 | ~$120 |
| Railway | Pro plan | ~$50 |
| Render | Standard+ | ~$85 |

**Implementation:**
```typescript
// prover-service/src/index.ts
import express from 'express';
import { RainbowVeilProver } from './prover';

const app = express();
const prover = new RainbowVeilProver();

app.post('/prove', async (req, res) => {
  const { walletHash, tokenId, trackId, merkleProof } = req.body;

  const proof = await prover.generateProof({
    walletHash,
    tokenId,
    trackId,
    merkleProof
  });

  res.json({ proof: proof.toString('hex') });
});

app.listen(3001);
```

### 2. Backend API

**Purpose:** Handle user requests, coordinate services

**Requirements:**
- 2GB RAM
- 2 CPU cores
- Stateless (scales horizontally)

**Responsibilities:**
- User authentication
- Request validation
- Coordinate with prover service
- Submit transactions to Solana
- Query Solana state

### 3. Indexer Service

**Purpose:** Listen to Solana events, update database

**Requirements:**
- 1GB RAM
- Persistent connection to RPC

**Listens for:**
- `OwnershipVerified` events
- `MerkleRootUpdated` events
- Nullifier state changes

### 4. Database (PostgreSQL)

**Tables:**
```sql
-- Merkle tree for token ownership registry
CREATE TABLE merkle_leaves (
  id SERIAL PRIMARY KEY,
  wallet_hash BYTEA NOT NULL,  -- H(wallet_address)
  token_id BYTEA NOT NULL,
  track_id BYTEA NOT NULL,
  leaf_hash BYTEA NOT NULL,
  index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nullifier tracking (mirrors on-chain)
CREATE TABLE nullifiers (
  hash BYTEA PRIMARY KEY,
  track_id BYTEA NOT NULL,
  used_at TIMESTAMP NOT NULL,
  tx_signature TEXT
);

-- Analytics (privacy-preserving)
CREATE TABLE verifications (
  id SERIAL PRIMARY KEY,
  track_id BYTEA NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  -- NO wallet address stored
);
```

### 5. Solana RPC

**Options:**
| Provider | Free Tier | Paid |
|----------|-----------|------|
| Helius | 100K/month | $49/month |
| QuickNode | 10M/month | $49/month |
| Triton | 50K/month | Custom |
| Self-hosted | N/A | ~$200/month |

---

## Deployment Options

### Option A: Managed Services (Recommended for MVP)

```
Frontend: Vercel (free)
API: Railway ($20/month)
Prover: Railway Pro ($50/month)
Database: Railway Postgres ($10/month)
RPC: Helius ($49/month)
─────────────────────────────
Total: ~$130/month
```

### Option B: AWS Full Stack

```
Frontend: CloudFront + S3 ($5/month)
API: ECS Fargate ($40/month)
Prover: EC2 m5.xlarge ($140/month)
Database: RDS PostgreSQL ($30/month)
Redis: ElastiCache ($15/month)
RPC: Helius ($49/month)
─────────────────────────────
Total: ~$280/month
```

### Option C: Hybrid (Production Scale)

```
Frontend: Vercel Pro ($20/month)
API: AWS Lambda + API Gateway ($50/month)
Prover: Dedicated EC2 ($140/month)
Database: RDS Multi-AZ ($60/month)
Redis: ElastiCache ($30/month)
RPC: Helius Growth ($199/month)
Monitoring: DataDog ($50/month)
─────────────────────────────
Total: ~$550/month
```

---

## Security Requirements

### Secrets Management
```
❌ DON'T: Store in GitHub, .env files in repo
✅ DO: AWS Secrets Manager, HashiCorp Vault
```

### Network Security
```
- VPC isolation for database
- Private subnets for prover service
- WAF on API endpoints
- Rate limiting (100 req/min per IP)
```

### Solana Wallet Security
```
- Deployer key: Cold storage, multi-sig
- Fee payer: Hot wallet with limited SOL
- Upgrade authority: Multi-sig or burned
```

---

## Monitoring & Alerts

### Metrics to Track
```
- Proof generation time (target: <5s)
- API response time (target: <200ms)
- Transaction success rate (target: >99%)
- Memory usage on prover (alert: >80%)
- RPC error rate (alert: >1%)
```

### Tools
```
- DataDog / New Relic / Grafana
- PagerDuty for alerts
- Sentry for error tracking
```

---

## Scaling Strategy

### Phase 1: MVP (0-100 users)
- Single prover instance
- Shared database
- Free RPC tier

### Phase 2: Growth (100-10K users)
- 2-3 prover instances with load balancer
- Read replicas for database
- Paid RPC tier

### Phase 3: Scale (10K+ users)
- Prover cluster with auto-scaling
- Database sharding by track_id
- Multiple RPC providers for redundancy
- CDN caching for static proofs

---

## Local Development vs Production

| Aspect | Local (Windows) | Codespaces | Production |
|--------|-----------------|------------|------------|
| Anchor tests | ✅ run-tests.ps1 | ✅ anchor test | N/A |
| Node demos | ✅ node demo.js | ✅ node demo.js | N/A |
| Noir compile | ⚠️ WSL only | ✅ nargo compile | ✅ CI/CD |
| Real proofs | ❌ No bb | ✅ bb prove | ✅ Always |
| Solana deploy | ❌ Local only | ✅ devnet | ✅ mainnet |

---

## Next Steps

1. **MVP**: Use Railway for quick deployment
2. **Scale**: Migrate to AWS/GCP as usage grows
3. **Enterprise**: Consider dedicated infrastructure

---

## Cost Calculator

```
Estimated monthly costs at different scales:

100 users, 1K proofs/month:    ~$130/month
1K users, 10K proofs/month:    ~$280/month
10K users, 100K proofs/month:  ~$800/month
100K users, 1M proofs/month:   ~$3,000/month
```

These are estimates. Actual costs depend on usage patterns, geographic distribution, and optimization efforts.
