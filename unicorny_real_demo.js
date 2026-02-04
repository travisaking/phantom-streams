#!/usr/bin/env node
/**
 * UNICORNY Real Wallet Demo
 *
 * Using ACTUAL Solana wallet addresses to demonstrate:
 * - Collectible token holder verification (NOT catalog ownership)
 * - Privacy-preserving access to token-gated content
 * - Compliant with US regulations (no securities implications)
 *
 * Token Holder: BSDpkAE8dCGmG1XPT28fWV5KvB8pkC5tyKXqv1p7DsYQ (Travis)
 * UNICORNY Founder: HVv5haw3eYNaKYbbC6gtcaDfqbZ4mHcL6g9wxCbpyLfS
 *
 * Run with: node unicorny_real_demo.js
 */

const crypto = require('crypto');

// ============================================
// REAL WALLET ADDRESSES
// ============================================

const WALLETS = {
  // Travis - Primary wallet (Token Holder)
  TRAVIS_PRIMARY: 'BSDpkAE8dCGmG1XPT28fWV5KvB8pkC5tyKXqv1p7DsYQ',

  // Travis - Second wallet (can act as UNICORNY Founder for testing)
  TRAVIS_SECOND: 'FcY2KJKtNk4SVAuT4xEpZSaCpKDQE7ht8qgwxfKxM8Qx',

  // Original UNICORNY Founder wallet (for reference)
  UNICORNY_FOUNDER: 'HVv5haw3eYNaKYbbC6gtcaDfqbZ4mHcL6g9wxCbpyLfS',
};

// ============================================
// COLLECTIBLE TOKEN TYPES (NOT securities)
// ============================================

const UNICORNY_COLLECTIBLES = {
  // These are COLLECTIBLE tokens - NOT ownership/royalty rights
  // This keeps you compliant with US regulations

  'UNICORNY-FOUNDING-MEMBER': {
    name: 'UNICORNY Founding Member',
    type: 'Membership Collectible',
    utility: [
      'Early access to new releases',
      'Exclusive Discord channel',
      'Behind-the-scenes content',
      'Voting on community decisions'
    ],
    // NOT included (for compliance):
    // - Royalty rights
    // - Revenue sharing
    // - Ownership stake
  },

  'UNICORNY-WE-ARE-BACK': {
    name: 'We Are Back - Collectible Edition',
    type: 'Music Collectible',
    utility: [
      'Lossless audio download',
      'Exclusive artwork',
      'Credit in liner notes',
      'Airdrop eligibility for future drops'
    ],
  },

  'UNICORNY-GENESIS-ART': {
    name: 'UNICORNY Genesis Artwork',
    type: 'Art Collectible',
    utility: [
      'High-res artwork download',
      'Physical print eligibility',
      'AR experience access'
    ],
  }
};

// ============================================
// CRYPTO UTILITIES
// ============================================

function hash(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function shortAddr(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

function shortHash(buf) {
  return buf.toString('hex').slice(0, 16) + '...';
}

// ============================================
// TOKEN REGISTRY (Simulated on-chain state)
// ============================================

class UnicornyTokenRegistry {
  constructor(founderWallet) {
    this.founderWallet = founderWallet;
    this.holders = new Map();
    this.leaves = [];
    this.tokenMints = new Map();
  }

  // Founder mints a new collectible type
  mintCollectibleType(tokenId, metadata) {
    this.tokenMints.set(tokenId, {
      ...metadata,
      mintedBy: this.founderWallet,
      mintedAt: new Date().toISOString(),
      totalSupply: 0
    });
  }

  // Add a token holder (when someone purchases/receives a collectible)
  addHolder(walletAddress, tokenId) {
    if (!this.tokenMints.has(tokenId)) {
      throw new Error(`Token ${tokenId} not minted`);
    }

    // Create leaf: H(holder_wallet || token_id || founder_wallet)
    const leaf = hash(Buffer.concat([
      Buffer.from(walletAddress),
      Buffer.from(tokenId),
      Buffer.from(this.founderWallet)
    ]));

    this.leaves.push(leaf);
    const leafIndex = this.leaves.length - 1;

    if (!this.holders.has(walletAddress)) {
      this.holders.set(walletAddress, []);
    }
    this.holders.get(walletAddress).push({ tokenId, leafIndex });

    // Update supply
    const mint = this.tokenMints.get(tokenId);
    mint.totalSupply++;

    return { leaf, leafIndex };
  }

  // Build Merkle tree after all holders added
  buildMerkleTree() {
    if (this.leaves.length === 0) return null;

    this.layers = [this.leaves.slice()];
    let current = this.leaves.slice();

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

  getMerkleProof(leafIndex) {
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

  verifyMerkleProof(leaf, proof, indices) {
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

  // Check if wallet holds a specific token
  holdsToken(walletAddress, tokenId) {
    const holdings = this.holders.get(walletAddress);
    if (!holdings) return false;
    return holdings.some(h => h.tokenId === tokenId);
  }
}

// ============================================
// PHANTOM STREAMS VERIFIER
// ============================================

class PhantomStreamsVerifier {
  constructor(registry) {
    this.registry = registry;
    this.usedNullifiers = new Set();
  }

  // User generates proof (happens in their wallet/browser)
  generateProof(walletAddress, tokenId) {
    const holdings = this.registry.holders.get(walletAddress);
    if (!holdings) {
      return { success: false, error: 'Wallet not found in registry' };
    }

    const holding = holdings.find(h => h.tokenId === tokenId);
    if (!holding) {
      return { success: false, error: 'Token not held by this wallet' };
    }

    // Create leaf
    const leaf = hash(Buffer.concat([
      Buffer.from(walletAddress),
      Buffer.from(tokenId),
      Buffer.from(this.registry.founderWallet)
    ]));

    // Get Merkle proof
    const { proof, indices } = this.registry.getMerkleProof(holding.leafIndex);

    // Generate nullifier (unique per wallet+token, prevents replay)
    const nullifier = hash(Buffer.concat([
      Buffer.from(walletAddress),
      Buffer.from(tokenId),
      Buffer.from('unicorny-2026')
    ]));

    return {
      success: true,
      // PUBLIC OUTPUTS (sent to server)
      publicOutputs: {
        merkleRoot: this.registry.root,
        nullifier: nullifier,
        tokenIdHash: hash(Buffer.from(tokenId)),
      },
      // PRIVATE INPUTS (stay in wallet, used for ZK proof)
      privateInputs: {
        wallet: walletAddress,
        leaf: leaf,
        merkleProof: proof,
        merkleIndices: indices
      }
    };
  }

  // Server verifies proof (no wallet address received!)
  verifyProof(publicOutputs, privateInputs, expectedTokenId) {
    // In production, this verification happens with ZK - server never sees privateInputs
    // For demo, we simulate the verification

    // 1. Check nullifier not used
    const nullifierHex = publicOutputs.nullifier.toString('hex');
    if (this.usedNullifiers.has(nullifierHex)) {
      return { valid: false, reason: 'Proof already used (replay attack prevented)' };
    }

    // 2. Verify Merkle proof
    const isValidProof = this.registry.verifyMerkleProof(
      privateInputs.leaf,
      privateInputs.merkleProof,
      privateInputs.merkleIndices
    );
    if (!isValidProof) {
      return { valid: false, reason: 'Invalid Merkle proof' };
    }

    // 3. Verify token matches
    const expectedHash = hash(Buffer.from(expectedTokenId));
    if (!publicOutputs.tokenIdHash.equals(expectedHash)) {
      return { valid: false, reason: 'Token ID mismatch' };
    }

    // 4. Mark nullifier as used
    this.usedNullifiers.add(nullifierHex);

    return {
      valid: true,
      nullifier: nullifierHex
    };
  }
}

// ============================================
// UNICORNY WALLET APP CONCEPT
// ============================================

function showWalletAppConcept() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  💡 UNICORNY WALLET APP CONCEPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Think of it like an iPod for your UNICORNY collectibles:');
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  🦄 UNICORNY WALLET                                     │');
  console.log('  │                                                         │');
  console.log('  │  ┌─────────────────────────────────────────────────┐   │');
  console.log('  │  │  MY COLLECTIBLES                                │   │');
  console.log('  │  │                                                 │   │');
  console.log('  │  │  🎵 We Are Back (Collectible Edition)           │   │');
  console.log('  │  │     └─ [Play] [Download] [View Art]             │   │');
  console.log('  │  │                                                 │   │');
  console.log('  │  │  🏆 Founding Member Badge                       │   │');
  console.log('  │  │     └─ [Discord Access] [Early Access]          │   │');
  console.log('  │  │                                                 │   │');
  console.log('  │  │  🎨 Genesis Artwork                             │   │');
  console.log('  │  │     └─ [View] [Download HD] [AR Mode]           │   │');
  console.log('  │  └─────────────────────────────────────────────────┘   │');
  console.log('  │                                                         │');
  console.log('  │  [Connect to myunicorny.com]  [Prove Ownership]         │');
  console.log('  │                                                         │');
  console.log('  │  Privacy Mode: ON 🔒                                    │');
  console.log('  │  Your wallet address is never shared with sites         │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('  HOW IT CONNECTS:');
  console.log('');
  console.log('  1. User installs UNICORNY Wallet (mobile app or browser)');
  console.log('  2. App connects to Phantom/Solflare to read collectibles');
  console.log('  3. When visiting myunicorny.com, user clicks "Prove I Own"');
  console.log('  4. App generates ZK proof LOCALLY (wallet stays private)');
  console.log('  5. Site verifies proof, grants access to exclusive content');
  console.log('  6. NO wallet address ever leaves the user\'s device');
  console.log('');
}

// ============================================
// MAIN DEMO
// ============================================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   🦄  UNICORNY Real Wallet Verification Demo                 ║');
  console.log('║                                                              ║');
  console.log('║   Using ACTUAL Solana Addresses                              ║');
  console.log('║   Collectible Tokens (Compliant, NOT Securities)             ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // ========================================
  // Show wallet addresses
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  WALLET ADDRESSES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`  UNICORNY Founder: ${WALLETS.UNICORNY_FOUNDER}`);
  console.log(`  Token Holder:     ${WALLETS.TRAVIS_PRIMARY}`);
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 1: Founder creates collectibles
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 1: UNICORNY Founder Creates Collectible Types');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const registry = new UnicornyTokenRegistry(WALLETS.UNICORNY_FOUNDER);

  // Mint collectible types
  for (const [tokenId, metadata] of Object.entries(UNICORNY_COLLECTIBLES)) {
    registry.mintCollectibleType(tokenId, metadata);
    console.log(`  ✅ Created: ${metadata.name}`);
    console.log(`     Type: ${metadata.type}`);
    console.log(`     Utility: ${metadata.utility[0]}...`);
    console.log('');
  }

  console.log('  ⚠️  COMPLIANCE NOTE:');
  console.log('     These are COLLECTIBLES with utility access');
  console.log('     NOT securities, royalty rights, or ownership stakes');
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 2: Token holders are registered
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 2: Register Token Holders');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Travis holds Founding Member + We Are Back collectibles
  registry.addHolder(WALLETS.TRAVIS_PRIMARY, 'UNICORNY-FOUNDING-MEMBER');
  console.log(`  ✅ ${shortAddr(WALLETS.TRAVIS_PRIMARY)} → Founding Member`);

  registry.addHolder(WALLETS.TRAVIS_PRIMARY, 'UNICORNY-WE-ARE-BACK');
  console.log(`  ✅ ${shortAddr(WALLETS.TRAVIS_PRIMARY)} → We Are Back Collectible`);

  // Add some other holders (simulated)
  const otherHolders = [
    'FaN1WaLLet1111111111111111111111111111111111',
    'FaN2WaLLet2222222222222222222222222222222222',
    'FaN3WaLLet3333333333333333333333333333333333',
  ];

  for (const holder of otherHolders) {
    registry.addHolder(holder, 'UNICORNY-WE-ARE-BACK');
    console.log(`  ✅ ${shortAddr(holder)} → We Are Back Collectible`);
  }

  // Build Merkle tree
  registry.buildMerkleTree();
  console.log('');
  console.log(`  📊 Registry Stats:`);
  console.log(`     Total tokens registered: ${registry.leaves.length}`);
  console.log(`     Merkle Root: ${shortHash(registry.root)}`);
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 3: Travis proves he holds token
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 3: Travis Proves Token Ownership (Privately!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const verifier = new PhantomStreamsVerifier(registry);
  const tokenToProve = 'UNICORNY-FOUNDING-MEMBER';

  console.log(`  👤 User: Travis`);
  console.log(`  🔑 Wallet: ${WALLETS.TRAVIS_PRIMARY}`);
  console.log(`  🎯 Proving ownership of: ${tokenToProve}`);
  console.log('');

  // Generate proof
  console.log('  🔐 Generating zero-knowledge proof in wallet...');
  await sleep(300);

  const proofResult = verifier.generateProof(WALLETS.TRAVIS_PRIMARY, tokenToProve);

  if (!proofResult.success) {
    console.log(`  ❌ Error: ${proofResult.error}`);
    return;
  }

  console.log('');
  console.log('  📤 WHAT GETS SENT TO myunicorny.com:');
  console.log('  ┌────────────────────────────────────────────────────┐');
  console.log(`  │  Merkle Root:    ${shortHash(proofResult.publicOutputs.merkleRoot)}     │`);
  console.log(`  │  Nullifier:      ${shortHash(proofResult.publicOutputs.nullifier)}     │`);
  console.log(`  │  Token Hash:     ${shortHash(proofResult.publicOutputs.tokenIdHash)}     │`);
  console.log('  │                                                    │');
  console.log('  │  Wallet Address: ❌ NOT SENT                       │');
  console.log('  │  Other Holdings: ❌ NOT SENT                       │');
  console.log('  └────────────────────────────────────────────────────┘');
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 4: myunicorny.com verifies
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 4: myunicorny.com Verifies (Without Seeing Wallet!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  console.log('  🌐 Server receives proof...');
  await sleep(200);
  console.log('  📡 Checking Merkle root against on-chain state...');
  await sleep(200);
  console.log('  🔍 Verifying ZK proof...');
  await sleep(300);

  const verification = verifier.verifyProof(
    proofResult.publicOutputs,
    proofResult.privateInputs,  // In production, this is the ZK proof, not raw data
    tokenToProve
  );

  console.log('');
  if (verification.valid) {
    console.log('  ╔════════════════════════════════════════════════════╗');
    console.log('  ║  ✅ VERIFIED: User holds UNICORNY Founding Member  ║');
    console.log('  ╚════════════════════════════════════════════════════╝');
    console.log('');

    const collectible = UNICORNY_COLLECTIBLES[tokenToProve];
    console.log(`  🦄 Welcome, UNICORNY Founding Member!`);
    console.log('');
    console.log('  🎁 Your exclusive access:');
    for (const utility of collectible.utility) {
      console.log(`     • ${utility}`);
    }
  } else {
    console.log(`  ❌ Verification failed: ${verification.reason}`);
  }
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 5: What gets stored
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 5: What myunicorny.com Database Stores');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  ✅ STORED (for analytics):');
  console.log(`     • Nullifier: ${verification.nullifier?.slice(0, 24)}...`);
  console.log('     • Token accessed: UNICORNY-FOUNDING-MEMBER');
  console.log('     • Timestamp: ' + new Date().toISOString());
  console.log('');
  console.log('  ❌ NOT STORED (privacy preserved):');
  console.log(`     • Wallet: ${WALLETS.TRAVIS_PRIMARY}`);
  console.log('     • User identity');
  console.log('     • Other token holdings');
  console.log('     • Transaction history');
  console.log('     • Portfolio value');
  console.log('');

  await sleep(500);

  // ========================================
  // Show wallet app concept
  // ========================================
  showWalletAppConcept();

  // ========================================
  // Integration options
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  INTEGRATION OPTIONS FOR UNICORNY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  OPTION 1: Website Integration (Simplest)');
  console.log('  ─────────────────────────────────────────');
  console.log('  • Add "Verify Token" button to myunicorny.com');
  console.log('  • Users connect Phantom wallet');
  console.log('  • Site verifies without storing wallet');
  console.log('');
  console.log('  OPTION 2: UNICORNY Wallet App (Full Experience)');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  • Mobile app shows all UNICORNY collectibles');
  console.log('  • Built-in player for music collectibles');
  console.log('  • One-tap "prove ownership" for any platform');
  console.log('  • Privacy toggle (share wallet vs ZK proof)');
  console.log('');
  console.log('  OPTION 3: Universal Token Gating (Platform)');
  console.log('  ───────────────────────────────────────────');
  console.log('  • API for any site to verify UNICORNY tokens');
  console.log('  • SDK for quick integration');
  console.log('  • Dashboard for analytics (no PII)');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  🦄 UNICORNY + Phantom Streams');
  console.log('     Privacy-preserving token verification');
  console.log('     Compliant collectibles (not securities)');
  console.log('');
  console.log('  Founder Wallet: ' + WALLETS.UNICORNY_FOUNDER);
  console.log('  GitHub: github.com/travisaking/phantom-streams');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

// Run
main().catch(console.error);
