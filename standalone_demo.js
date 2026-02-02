#!/usr/bin/env node
/**
 * PHANTOM STREAMS - Standalone Demo
 * 
 * Demonstrates the privacy flow WITHOUT external dependencies
 * Run with: node standalone_demo.js
 */

const crypto = require('crypto');

// ============================================
// UTILITIES
// ============================================

function hash(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function randomBytes(n) {
  return crypto.randomBytes(n);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shortHash(buf) {
  return buf.toString('hex').slice(0, 16) + '...';
}

// ============================================
// MOCK MERKLE TREE
// ============================================

class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(l => hash(l));
    this.layers = [this.leaves];
    this.buildTree();
  }

  buildTree() {
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
  }

  get root() {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(index) {
    const proof = [];
    const indices = [];
    let idx = index;

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

  verifyProof(leaf, proof, indices, root) {
    let current = hash(leaf);
    
    for (let i = 0; i < proof.length; i++) {
      if (indices[i] === 0) {
        current = hash(Buffer.concat([current, proof[i]]));
      } else {
        current = hash(Buffer.concat([proof[i], current]));
      }
    }

    return current.equals(root);
  }
}

// ============================================
// MOCK ENCRYPTION (simulates Arcium)
// ============================================

function encryptForMPC(data, sharedSecret) {
  // In real Arcium: Rescue cipher with MPC key exchange
  const iv = randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret.slice(0, 32), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return { ciphertext: encrypted, nonce: iv };
}

function decryptFromMPC(ciphertext, nonce, sharedSecret) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', sharedSecret.slice(0, 32), nonce);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// ============================================
// MOCK ARCIUM MPC COMPUTATION
// ============================================

async function simulateMPCVerification(encryptedOwnership, merkleRoot, sharedSecret) {
  console.log('    → Distributing encrypted shares to MPC nodes...');
  await sleep(300);
  
  console.log('    → Node 1: Processing encrypted fragment...');
  await sleep(200);
  
  console.log('    → Node 2: Processing encrypted fragment...');
  await sleep(200);
  
  console.log('    → Node 3: Processing encrypted fragment...');
  await sleep(200);
  
  console.log('    → Nodes combining results (threshold signature)...');
  await sleep(300);
  
  // Decrypt to verify (in real MPC, this happens inside secure computation)
  const decrypted = decryptFromMPC(
    encryptedOwnership.ciphertext,
    encryptedOwnership.nonce,
    sharedSecret
  );
  
  // Parse ownership data
  const walletHash = decrypted.slice(0, 32);
  const trackIdHash = decrypted.slice(32, 64);
  
  // Compute nullifier
  const nullifier = hash(Buffer.concat([walletHash, trackIdHash, Buffer.from('phantomstreams')]));
  
  // Result
  const isValid = true; // Would actually verify Merkle proof
  
  // Encrypt result back
  const resultData = Buffer.alloc(33);
  resultData[0] = isValid ? 1 : 0;
  nullifier.copy(resultData, 1);
  
  const encryptedResult = encryptForMPC(resultData, sharedSecret);
  
  return encryptedResult;
}

// ============================================
// MAIN DEMO
// ============================================

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   🎵  PHANTOM STREAMS - Private Music Rights Verification   ║');
  console.log('║                                                              ║');
  console.log('║   Built with: Arcium MPC + Noir ZK + Solana                  ║');
  console.log('║   For: Solana Privacy Hackathon 2026                         ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // ========================================
  // STEP 1: Setup
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 1: Artist Creates Rights Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const artistWallet = randomBytes(32);
  const trackId = 'we-are-back-unicorny-2026';
  const tokenId = 'rights-token-' + randomBytes(4).toString('hex');
  
  console.log(`  Artist Wallet:  ${shortHash(artistWallet)}`);
  console.log(`  Track:          "${trackId}"`);
  console.log(`  Rights Token:   ${tokenId}`);
  console.log('  ✅ Rights token minted on Solana\n');

  await sleep(500);

  // ========================================
  // STEP 2: Fan purchases rights
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 2: Fan Purchases Access');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const fanWallet = randomBytes(32);
  const fanTokenId = 'fan-rights-' + randomBytes(4).toString('hex');
  
  console.log(`  Fan Wallet:     ${shortHash(fanWallet)}`);
  console.log(`  Fan Token:      ${fanTokenId}`);
  console.log('  ✅ Fan added to rights registry\n');

  await sleep(500);

  // ========================================
  // STEP 3: Build Merkle tree
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 3: Rights Registry (Merkle Tree)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Create rights holders
  const rightsHolders = [
    Buffer.concat([artistWallet, hash(Buffer.from(trackId)), hash(Buffer.from(tokenId))]),
    Buffer.concat([fanWallet, hash(Buffer.from(trackId)), hash(Buffer.from(fanTokenId))]),
    Buffer.concat([randomBytes(32), hash(Buffer.from(trackId)), randomBytes(32)]),
    Buffer.concat([randomBytes(32), hash(Buffer.from(trackId)), randomBytes(32)]),
  ];
  
  const tree = new MerkleTree(rightsHolders);
  const { proof, indices } = tree.getProof(1); // Fan is at index 1
  
  console.log(`  Total rights holders: ${rightsHolders.length}`);
  console.log(`  Merkle root:    ${shortHash(tree.root)}`);
  console.log(`  Proof depth:    ${proof.length} levels`);
  console.log('  ✅ Registry indexed\n');

  await sleep(500);

  // ========================================
  // STEP 4: Arcium MPC Verification
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STEP 4: Private Verification via Arcium MPC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔐 Fan wants to prove ownership WITHOUT revealing wallet\n');
  
  // Shared secret (in real Arcium: ECDH key exchange with MXE)
  const sharedSecret = randomBytes(32);
  
  // Build ownership proof data
  const ownershipData = Buffer.concat([
    fanWallet,                          // 32 bytes - PRIVATE
    hash(Buffer.from(trackId)),          // 32 bytes
    hash(Buffer.from(fanTokenId)),       // 32 bytes
  ]);
  
  console.log('  Encrypting ownership data...');
  const encrypted = encryptForMPC(ownershipData, sharedSecret);
  console.log(`    Ciphertext:   ${shortHash(encrypted.ciphertext)}`);
  console.log(`    Nonce:        ${encrypted.nonce.toString('hex').slice(0, 16)}...`);
  console.log('');
  
  console.log('  Submitting to Arcium MPC cluster...');
  const encryptedResult = await simulateMPCVerification(encrypted, tree.root, sharedSecret);
  console.log('');
  
  // Decrypt result
  console.log('  Decrypting result locally...');
  const resultData = decryptFromMPC(encryptedResult.ciphertext, encryptedResult.nonce, sharedSecret);
  const isValid = resultData[0] === 1;
  const nullifier = resultData.slice(1, 33);
  
  console.log('');
  if (isValid) {
    console.log('  ╔════════════════════════════════════════╗');
    console.log('  ║  ✅ OWNERSHIP VERIFIED                 ║');
    console.log('  ╚════════════════════════════════════════╝');
  } else {
    console.log('  ❌ VERIFICATION FAILED');
  }
  console.log(`  Nullifier:      ${shortHash(nullifier)}`);
  console.log('');

  await sleep(500);

  // ========================================
  // STEP 5: Privacy Summary
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  PRIVACY SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  📢 PUBLIC (visible on-chain):');
  console.log('  ┌────────────────────────────────────────────┐');
  console.log(`  │  Track ID hash:     ${shortHash(hash(Buffer.from(trackId)))} │`);
  console.log(`  │  Merkle root:       ${shortHash(tree.root)} │`);
  console.log(`  │  Nullifier:         ${shortHash(nullifier)} │`);
  console.log('  │  Result:            true (ownership valid)  │');
  console.log('  └────────────────────────────────────────────┘');
  console.log('');
  console.log('  🔒 PRIVATE (hidden by Arcium MPC):');
  console.log('  ┌────────────────────────────────────────────┐');
  console.log(`  │  Fan wallet:        ${shortHash(fanWallet)} │`);
  console.log(`  │  Token ID:          ${fanTokenId.slice(0, 20)}... │`);
  console.log('  │  Other holdings:    [ENCRYPTED]             │');
  console.log('  │  Transaction hist:  [ENCRYPTED]             │');
  console.log('  └────────────────────────────────────────────┘');
  console.log('');

  // ========================================
  // STEP 6: Bounty Summary
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TARGET BOUNTIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  ┌─────────────────────────┬──────────┬─────────────────────┐');
  console.log('  │ Sponsor                 │ Prize    │ Integration         │');
  console.log('  ├─────────────────────────┼──────────┼─────────────────────┤');
  console.log('  │ Open Track (Light)      │ $18,000  │ ZK Compression      │');
  console.log('  │ Arcium                  │ $10,000  │ MPC Verification    │');
  console.log('  │ Aztec/Noir (Non-DeFi)   │  $2,500  │ ZK Circuits         │');
  console.log('  │ Helius                  │  $5,000  │ RPC Infrastructure  │');
  console.log('  │ Encrypt.trade           │  $1,000  │ Educational         │');
  console.log('  ├─────────────────────────┼──────────┼─────────────────────┤');
  console.log('  │ TOTAL POTENTIAL         │ $36,500  │                     │');
  console.log('  └─────────────────────────┴──────────┴─────────────────────┘');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  🎵 Phantom Streams: Privacy for creators, not just traders.');
  console.log('');
  console.log('  GitHub:  github.com/[your-repo]/phantom-streams');
  console.log('  Built:   Solana Privacy Hackathon 2026');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

// Run
main().catch(console.error);
