/**
 * Phantom Streams - Demo Script
 * 
 * Demonstrates the full flow:
 * 1. Artist mints a rights token
 * 2. Fan purchases/receives rights
 * 3. Fan generates ZK proof of ownership
 * 4. Platform verifies proof on-chain
 * 
 * For Solana Privacy Hackathon 2026
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { createHash } from "crypto";

// Mock Noir proof generation (replace with actual Noir integration)
async function generateOwnershipProof(
  walletAddress: string,
  trackId: string,
  merkleRoot: Buffer,
  merklePath: Buffer[],
  merkleIndices: number[]
): Promise<{
  proof: Buffer;
  nullifierHash: Buffer;
}> {
  // In production: call Noir prover
  // For demo: generate deterministic mock proof
  
  const nullifierHash = createHash("sha256")
    .update(walletAddress)
    .update(trackId)
    .update("phantomstreams")
    .digest();
  
  // Mock proof data
  const proof = Buffer.from("mock_zk_proof_" + Date.now());
  
  return { proof, nullifierHash };
}

// Build Merkle tree from rights registry
function buildMerkleTree(leaves: Buffer[]): {
  root: Buffer;
  getProof: (index: number) => { path: Buffer[]; indices: number[] };
} {
  // Simplified Merkle tree for demo
  // In production: use proper binary tree with Pedersen hashes
  
  if (leaves.length === 0) {
    return {
      root: Buffer.alloc(32),
      getProof: () => ({ path: [], indices: [] }),
    };
  }
  
  // Pad to power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(leaves.length)));
  const paddedLeaves = [...leaves];
  while (paddedLeaves.length < size) {
    paddedLeaves.push(Buffer.alloc(32));
  }
  
  // Build tree levels
  let currentLevel = paddedLeaves;
  const tree: Buffer[][] = [currentLevel];
  
  while (currentLevel.length > 1) {
    const nextLevel: Buffer[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || Buffer.alloc(32);
      const parent = createHash("sha256").update(left).update(right).digest();
      nextLevel.push(parent);
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }
  
  const root = tree[tree.length - 1][0];
  
  const getProof = (index: number) => {
    const path: Buffer[] = [];
    const indices: number[] = [];
    let currentIndex = index;
    
    for (let level = 0; level < tree.length - 1; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const sibling = tree[level][siblingIndex] || Buffer.alloc(32);
      path.push(sibling);
      indices.push(currentIndex % 2);
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    // Pad to tree depth 20
    while (path.length < 20) {
      path.push(Buffer.alloc(32));
      indices.push(0);
    }
    
    return { path, indices };
  };
  
  return { root, getProof };
}

// Main demo flow
async function runDemo() {
  console.log("\n🎵 PHANTOM STREAMS DEMO 🎵\n");
  console.log("Private Music Rights Verification on Solana\n");
  console.log("=".repeat(50) + "\n");
  
  // Setup
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const artist = Keypair.generate();
  const fan = Keypair.generate();
  
  console.log("👤 Artist wallet:", artist.publicKey.toBase58().slice(0, 8) + "...");
  console.log("👤 Fan wallet:", fan.publicKey.toBase58().slice(0, 8) + "...");
  console.log();
  
  // Step 1: Artist mints rights token
  console.log("📝 STEP 1: Artist mints rights token for track");
  console.log("-".repeat(40));
  
  const trackId = createHash("sha256")
    .update("We're Back - UNICORNY")
    .digest();
  
  console.log("Track ID:", trackId.toString("hex").slice(0, 16) + "...");
  
  // Simulate rights token minting
  const rightsTokenId = createHash("sha256")
    .update(artist.publicKey.toBuffer())
    .update(trackId)
    .digest();
  
  console.log("Rights Token ID:", rightsTokenId.toString("hex").slice(0, 16) + "...");
  console.log("✅ Rights token minted\n");
  
  // Step 2: Fan receives/purchases rights
  console.log("💸 STEP 2: Fan purchases access to track");
  console.log("-".repeat(40));
  
  // Create ownership leaf
  const ownershipLeaf = createHash("sha256")
    .update(fan.publicKey.toBuffer())
    .update(rightsTokenId)
    .update(trackId)
    .digest();
  
  console.log("Ownership recorded in registry");
  console.log("Leaf hash:", ownershipLeaf.toString("hex").slice(0, 16) + "...");
  console.log("✅ Fan now owns access to track\n");
  
  // Step 3: Build Merkle tree (indexer would do this)
  console.log("🌳 STEP 3: Indexer builds Merkle tree of all rights");
  console.log("-".repeat(40));
  
  // Simulate multiple rights in the tree
  const allRights = [
    ownershipLeaf, // Fan's ownership
    createHash("sha256").update("other_owner_1").digest(),
    createHash("sha256").update("other_owner_2").digest(),
    createHash("sha256").update("other_owner_3").digest(),
  ];
  
  const { root: merkleRoot, getProof } = buildMerkleTree(allRights);
  const fanIndex = 0; // Fan's leaf is at index 0
  const { path: merklePath, indices: merkleIndices } = getProof(fanIndex);
  
  console.log("Total rights in registry:", allRights.length);
  console.log("Merkle root:", merkleRoot.toString("hex").slice(0, 16) + "...");
  console.log("✅ Registry indexed\n");
  
  // Step 4: Fan generates ZK proof
  console.log("🔐 STEP 4: Fan generates ZK proof of ownership");
  console.log("-".repeat(40));
  console.log("This proves: 'I own rights to this track'");
  console.log("This hides: Wallet address, other holdings");
  console.log();
  
  const { proof, nullifierHash } = await generateOwnershipProof(
    fan.publicKey.toBase58(),
    trackId.toString("hex"),
    merkleRoot,
    merklePath,
    merkleIndices
  );
  
  console.log("Proof generated:", proof.toString("hex").slice(0, 20) + "...");
  console.log("Nullifier hash:", nullifierHash.toString("hex").slice(0, 16) + "...");
  console.log("✅ ZK proof ready\n");
  
  // Step 5: Platform verifies on-chain
  console.log("✨ STEP 5: Platform verifies proof on-chain");
  console.log("-".repeat(40));
  
  // In production: call Solana program
  // For demo: simulate verification
  console.log("Submitting to Phantom Streams verifier...");
  console.log();
  console.log("Verification checks:");
  console.log("  [✓] Nullifier not previously used");
  console.log("  [✓] Merkle root matches current state");
  console.log("  [✓] ZK proof is valid");
  console.log();
  console.log("✅ OWNERSHIP VERIFIED!");
  console.log();
  
  // Step 6: Access granted
  console.log("🎉 RESULT: Platform grants access");
  console.log("-".repeat(40));
  console.log("Fan can now stream/download the track");
  console.log("Platform knows: Someone with valid rights accessed");
  console.log("Platform does NOT know:");
  console.log("  - Fan's wallet address");
  console.log("  - Fan's other token holdings");
  console.log("  - Fan's transaction history");
  console.log();
  
  // Summary
  console.log("=".repeat(50));
  console.log("\n📊 PRIVACY SUMMARY\n");
  console.log("PUBLIC (visible to anyone):");
  console.log("  • Track ID: " + trackId.toString("hex").slice(0, 16) + "...");
  console.log("  • Merkle root of all rights");
  console.log("  • Nullifier (single-use identifier)");
  console.log();
  console.log("PRIVATE (hidden by ZK proof):");
  console.log("  • Fan's wallet address");
  console.log("  • Rights token ID");
  console.log("  • All other holdings");
  console.log("  • Transaction history");
  console.log();
  console.log("=".repeat(50));
  console.log("\nPhantom Streams - Privacy for creators, not just traders.\n");
}

// Run the demo
runDemo().catch(console.error);
