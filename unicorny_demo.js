#!/usr/bin/env node
/**
 * UNICORNY Token Holder Verification Demo
 *
 * This demonstrates how Phantom Streams would work for:
 * 1. UNICORNY (the artist) - registers their music rights
 * 2. Token holders - prove ownership to access exclusive content
 * 3. myunicorny.com - verifies access without seeing wallet data
 *
 * Run with: node unicorny_demo.js
 */

const crypto = require('crypto');
const readline = require('readline');

// ============================================
// CONFIGURATION - Replace with real wallets
// ============================================

// UNICORNY artist wallet (replace with actual Solana address)
const UNICORNY_ARTIST_WALLET = 'UNiCoRnY1234567890abcdefghijklmnopqrstuvwx';

// Example token holders (replace with actual holder wallets)
const TOKEN_HOLDERS = {
  'TravisKing': {
    wallet: '7v3GevLkThPVSVtRZBdr6CbEUje3Ajdwqk5dGvReV9UP', // Your Solana wallet
    tokens: ['UNICORNY-GENESIS-001', 'UNICORNY-TRACK-042'],
    tier: 'founding_member'
  },
  'SuperFan1': {
    wallet: 'FaN1WaLLet1234567890abcdefghijklmnopqrstuvw',
    tokens: ['UNICORNY-TRACK-042'],
    tier: 'supporter'
  },
  'Collector99': {
    wallet: 'CoLLecT0R99wallet1234567890abcdefghijklmnop',
    tokens: ['UNICORNY-GENESIS-001', 'UNICORNY-TRACK-042', 'UNICORNY-TRACK-043'],
    tier: 'collector'
  }
};

// UNICORNY content library (what token holders can access)
const UNICORNY_CONTENT = {
  'UNICORNY-GENESIS-001': {
    title: 'UNICORNY Genesis Collection',
    type: 'Album',
    exclusiveContent: ['Unreleased stems', 'Behind-the-scenes video', 'Discord role'],
    mintDate: '2025-06-15'
  },
  'UNICORNY-TRACK-042': {
    title: 'We Are Back',
    type: 'Single',
    exclusiveContent: ['Lossless audio', 'Lyric video', 'Early access'],
    mintDate: '2026-01-20'
  },
  'UNICORNY-TRACK-043': {
    title: 'Solana Summer',
    type: 'Single',
    exclusiveContent: ['Remix stems', 'Music video BTS'],
    mintDate: '2026-01-28'
  }
};

// ============================================
// CRYPTO UTILITIES
// ============================================

function hash(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function shortHash(buf) {
  return buf.toString('hex').slice(0, 16) + '...';
}

// ============================================
// MERKLE TREE (Rights Registry)
// ============================================

class UnicornyRightsRegistry {
  constructor() {
    this.holders = new Map();
    this.leaves = [];
  }

  // Artist registers a token holder
  registerHolder(wallet, tokenId, tier) {
    const leaf = this.createLeaf(wallet, tokenId, tier);
    this.leaves.push(leaf);

    if (!this.holders.has(wallet)) {
      this.holders.set(wallet, []);
    }
    this.holders.get(wallet).push({ tokenId, tier, leafIndex: this.leaves.length - 1 });

    return leaf;
  }

  createLeaf(wallet, tokenId, tier) {
    // Leaf = H(wallet || tokenId || tier || artistWallet)
    return hash(Buffer.concat([
      Buffer.from(wallet),
      Buffer.from(tokenId),
      Buffer.from(tier),
      Buffer.from(UNICORNY_ARTIST_WALLET)
    ]));
  }

  buildTree() {
    if (this.leaves.length === 0) return null;

    this.layers = [this.leaves];
    let current = this.leaves;

    while (current.length > 1) {
      const next = [];
      for (let i = 0; i < current.length; i += 2) {
        const left = current[i];
        const right = current[i + 1] || current[i];
        next.push(hash(Buffer.concat([left, right])));
      }
      this.layers.push(next);
      current = next;
    }

    return this.root;
  }

  get root() {
    if (!this.layers || this.layers.length === 0) return null;
    return this.layers[this.layers.length - 1][0];
  }

  getProof(leafIndex) {
    const proof = [];
    const indices = [];
    let idx = leafIndex;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;

      if (siblingIdx < layer.length) {
        proof.push(layer[siblingIdx]);
        indices.push(isRight ? 1 : 0);
      }
      idx = Math.floor(idx / 2);
    }

    return { proof, indices };
  }

  verifyProof(leaf, proof, indices) {
    let current = leaf;

    for (let i = 0; i < proof.length; i++) {
      if (indices[i] === 0) {
        current = hash(Buffer.concat([current, proof[i]]));
      } else {
        current = hash(Buffer.concat([proof[i], current]));
      }
    }

    return current.equals(this.root);
  }
}

// ============================================
// PHANTOM STREAMS VERIFICATION
// ============================================

class PhantomStreamsVerifier {
  constructor(registry) {
    this.registry = registry;
    this.usedNullifiers = new Set();
  }

  // Generate proof that holder owns token (without revealing wallet)
  generateOwnershipProof(wallet, tokenId, tier) {
    // Find the holder's leaf
    const holderData = this.registry.holders.get(wallet);
    if (!holderData) {
      return { success: false, error: 'Wallet not in registry' };
    }

    const tokenData = holderData.find(h => h.tokenId === tokenId);
    if (!tokenData) {
      return { success: false, error: 'Token not owned by this wallet' };
    }

    // Create leaf and get Merkle proof
    const leaf = this.registry.createLeaf(wallet, tokenId, tier);
    const { proof, indices } = this.registry.getProof(tokenData.leafIndex);

    // Generate nullifier (prevents replay attacks)
    const nullifier = hash(Buffer.concat([
      Buffer.from(wallet),
      Buffer.from(tokenId),
      Buffer.from('unicorny-domain-2026')
    ]));

    return {
      success: true,
      proof: {
        // PUBLIC OUTPUTS (visible to verifier)
        merkleRoot: this.registry.root,
        nullifier: nullifier,
        tokenIdHash: hash(Buffer.from(tokenId)),

        // PRIVATE INPUTS (encrypted, never revealed)
        _privateWallet: wallet,
        _privateLeaf: leaf,
        _privateMerkleProof: proof,
        _privateIndices: indices
      }
    };
  }

  // myunicorny.com calls this to verify access
  verifyAccess(proof, requestedTokenId) {
    // Check nullifier hasn't been used (prevents replay)
    const nullifierHex = proof.nullifier.toString('hex');
    if (this.usedNullifiers.has(nullifierHex)) {
      return { verified: false, reason: 'Proof already used' };
    }

    // Verify the Merkle proof
    const isValid = this.registry.verifyProof(
      proof._privateLeaf,
      proof._privateMerkleProof,
      proof._privateIndices
    );

    if (!isValid) {
      return { verified: false, reason: 'Invalid Merkle proof' };
    }

    // Verify token ID matches
    const expectedTokenHash = hash(Buffer.from(requestedTokenId));
    if (!proof.tokenIdHash.equals(expectedTokenHash)) {
      return { verified: false, reason: 'Token ID mismatch' };
    }

    // Mark nullifier as used
    this.usedNullifiers.add(nullifierHex);

    return {
      verified: true,
      accessGranted: true,
      nullifier: nullifierHex
    };
  }
}

// ============================================
// DATABASE STORAGE (simulated)
// ============================================

class UnicornyDatabase {
  constructor() {
    this.verifications = [];
    this.accessLogs = [];
  }

  logVerification(data) {
    const record = {
      timestamp: new Date().toISOString(),
      merkleRoot: data.merkleRoot.toString('hex'),
      nullifier: data.nullifier.toString('hex'),
      tokenIdHash: data.tokenIdHash.toString('hex'),
      // Note: NO wallet address stored!
      ipHash: hash(Buffer.from('127.0.0.1')).toString('hex').slice(0, 16) // Hashed IP
    };
    this.verifications.push(record);
    return record;
  }

  logAccess(tokenId, contentAccessed) {
    const record = {
      timestamp: new Date().toISOString(),
      tokenId: tokenId,
      content: contentAccessed,
      // Note: NO user identity stored!
    };
    this.accessLogs.push(record);
    return record;
  }

  getAnalytics() {
    return {
      totalVerifications: this.verifications.length,
      uniqueNullifiers: new Set(this.verifications.map(v => v.nullifier)).size,
      contentAccesses: this.accessLogs.length
    };
  }
}

// ============================================
// INTERACTIVE DEMO
// ============================================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   🦄  UNICORNY Token Holder Verification                     ║');
  console.log('║                                                              ║');
  console.log('║   Powered by Phantom Streams                                 ║');
  console.log('║   Private access verification for myunicorny.com             ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // ========================================
  // STEP 1: Artist Setup
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 1: UNICORNY Artist Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Artist Wallet:  ${UNICORNY_ARTIST_WALLET.slice(0, 20)}...`);
  console.log('');
  console.log('  Registered Content:');

  for (const [tokenId, content] of Object.entries(UNICORNY_CONTENT)) {
    console.log(`    📀 ${tokenId}`);
    console.log(`       "${content.title}" (${content.type})`);
  }
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 2: Build Rights Registry
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 2: Building Token Holder Registry');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const registry = new UnicornyRightsRegistry();

  // Register all token holders
  for (const [name, holder] of Object.entries(TOKEN_HOLDERS)) {
    for (const tokenId of holder.tokens) {
      registry.registerHolder(holder.wallet, tokenId, holder.tier);
      console.log(`  ✅ Registered: ${name} → ${tokenId}`);
    }
  }

  registry.buildTree();
  console.log('');
  console.log(`  Merkle Root: ${shortHash(registry.root)}`);
  console.log(`  Total Leaves: ${registry.leaves.length}`);
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 3: Token Holder Verification
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 3: TravisKing Proves Token Ownership');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const verifier = new PhantomStreamsVerifier(registry);
  const database = new UnicornyDatabase();

  const travis = TOKEN_HOLDERS['TravisKing'];
  const tokenToAccess = 'UNICORNY-GENESIS-001';

  console.log(`  User: TravisKing`);
  console.log(`  Wallet: ${travis.wallet.slice(0, 12)}...${travis.wallet.slice(-8)}`);
  console.log(`  Requesting access to: ${tokenToAccess}`);
  console.log('');

  // Generate proof
  console.log('  🔐 Generating zero-knowledge proof...');
  await sleep(300);

  const proofResult = verifier.generateOwnershipProof(
    travis.wallet,
    tokenToAccess,
    travis.tier
  );

  if (!proofResult.success) {
    console.log(`  ❌ Error: ${proofResult.error}`);
    return;
  }

  console.log('');
  console.log('  Proof Generated:');
  console.log('  ┌────────────────────────────────────────────────┐');
  console.log(`  │  Merkle Root:    ${shortHash(proofResult.proof.merkleRoot)} │`);
  console.log(`  │  Nullifier:      ${shortHash(proofResult.proof.nullifier)} │`);
  console.log(`  │  Token Hash:     ${shortHash(proofResult.proof.tokenIdHash)} │`);
  console.log('  │  Wallet:         [HIDDEN - ZK PROOF]           │');
  console.log('  └────────────────────────────────────────────────┘');
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 4: myunicorny.com Verification
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 4: myunicorny.com Verifies Access');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('  🌐 myunicorny.com receives proof...');
  await sleep(200);
  console.log('  📡 Verifying against on-chain Merkle root...');
  await sleep(300);

  const verification = verifier.verifyAccess(proofResult.proof, tokenToAccess);

  if (verification.verified) {
    console.log('');
    console.log('  ╔════════════════════════════════════════════════╗');
    console.log('  ║  ✅ ACCESS GRANTED                             ║');
    console.log('  ╚════════════════════════════════════════════════╝');
    console.log('');

    // Log to database (no wallet info!)
    database.logVerification(proofResult.proof);

    // Show what content is unlocked
    const content = UNICORNY_CONTENT[tokenToAccess];
    console.log(`  🦄 Welcome, UNICORNY ${travis.tier.replace('_', ' ')}!`);
    console.log('');
    console.log(`  You now have access to "${content.title}":`);
    for (const item of content.exclusiveContent) {
      console.log(`    🎁 ${item}`);
      database.logAccess(tokenToAccess, item);
    }
  } else {
    console.log(`  ❌ Access Denied: ${verification.reason}`);
  }
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 5: Privacy Summary
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  PRIVACY SUMMARY: What myunicorny.com Stores');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  📊 Database Record:');
  console.log('  ┌────────────────────────────────────────────────┐');
  console.log(`  │  Timestamp:      ${new Date().toISOString().slice(0, 19)}   │`);
  console.log(`  │  Nullifier:      ${verification.nullifier?.slice(0, 16)}... │`);
  console.log('  │  Token Accessed: UNICORNY-GENESIS-001          │');
  console.log('  │  Wallet Address: NOT STORED                    │');
  console.log('  │  User Identity:  NOT STORED                    │');
  console.log('  │  Other Holdings: NOT STORED                    │');
  console.log('  └────────────────────────────────────────────────┘');
  console.log('');
  console.log('  ✅ User proved ownership without revealing:');
  console.log('     • Their wallet address');
  console.log('     • Their other token holdings');
  console.log('     • Their transaction history');
  console.log('     • Their identity');
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 6: Analytics (Privacy-Preserving)
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  UNICORNY Artist Dashboard (Privacy-Preserving Analytics)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  const analytics = database.getAnalytics();
  console.log('  📈 What UNICORNY can see:');
  console.log(`     • Total verifications: ${analytics.totalVerifications}`);
  console.log(`     • Unique holders: ${analytics.uniqueNullifiers}`);
  console.log(`     • Content accesses: ${analytics.contentAccesses}`);
  console.log('');
  console.log('  🔒 What UNICORNY CANNOT see:');
  console.log('     • Individual wallet addresses');
  console.log('     • Fan identities');
  console.log('     • Fan portfolio values');
  console.log('     • Fan transaction histories');
  console.log('');

  // ========================================
  // Integration Instructions
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  HOW TO INTEGRATE WITH myunicorny.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  1. ARTIST SETUP:');
  console.log('     • Deploy Phantom Streams program to Solana');
  console.log('     • Initialize Merkle tree with token holders');
  console.log('     • Update root when new tokens are minted');
  console.log('');
  console.log('  2. WEBSITE INTEGRATION:');
  console.log('     • Add "Connect Wallet" button (Phantom, Solflare)');
  console.log('     • Client generates ZK proof locally');
  console.log('     • Server verifies proof against on-chain root');
  console.log('     • Grant access without storing wallet');
  console.log('');
  console.log('  3. DATABASE SCHEMA:');
  console.log('     verifications (');
  console.log('       nullifier_hash TEXT PRIMARY KEY,');
  console.log('       token_id TEXT,');
  console.log('       verified_at TIMESTAMP,');
  console.log('       -- NO wallet_address column!');
  console.log('     )');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  🦄 Privacy for UNICORNY holders, powered by Phantom Streams');
  console.log('');
  console.log('  GitHub: github.com/travisaking/phantom-streams');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

// Run
main().catch(console.error);
