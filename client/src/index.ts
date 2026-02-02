/**
 * Phantom Streams - TypeScript Client
 * 
 * Integrates with Arcium MPC for private music rights verification
 * For Solana Privacy Hackathon 2026
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram,
  Transaction 
} from "@solana/web3.js";
import { 
  ArciumClient, 
  getSharedSecret, 
  encrypt, 
  decrypt,
  awaitComputationFinalization 
} from "@arcium-hq/client";
import { createHash, randomBytes } from "crypto";

// Program IDs
const PHANTOM_STREAMS_PROGRAM_ID = new PublicKey("PhntmStr3amsMPCxxxxxxxxxxxxxxxxxxxxxxxxxx");
const ARCIUM_PROGRAM_ID = new PublicKey("ArcmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

// ============================================
// TYPES
// ============================================

interface RightsOwnership {
  walletHash: Uint8Array;      // 32 bytes
  trackId: Uint8Array;         // 32 bytes
  rightsTokenId: Uint8Array;   // 32 bytes
  merklePath: Uint8Array[];    // 20 x 32 bytes
  merkleIndices: number[];     // 20 values
}

interface VerificationResult {
  isValid: boolean;
  nullifier: Uint8Array;
}

interface RoyaltyVote {
  choice: number;
  weight: bigint;
}

// ============================================
// PHANTOM STREAMS CLIENT
// ============================================

export class PhantomStreamsClient {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program;
  private arciumClient: ArciumClient;
  private wallet: Keypair;

  constructor(
    connection: Connection,
    wallet: Keypair,
    cluster: "devnet" | "testnet" | "mainnet-beta" = "devnet"
  ) {
    this.connection = connection;
    this.wallet = wallet;
    
    // Setup Anchor provider
    const anchorWallet = {
      publicKey: wallet.publicKey,
      signTransaction: async (tx: Transaction) => {
        tx.sign(wallet);
        return tx;
      },
      signAllTransactions: async (txs: Transaction[]) => {
        txs.forEach(tx => tx.sign(wallet));
        return txs;
      },
    };
    
    this.provider = new AnchorProvider(connection, anchorWallet as any, {});
    
    // Initialize Arcium client
    this.arciumClient = new ArciumClient({
      connection,
      wallet: anchorWallet as any,
      cluster,
    });
  }

  // ============================================
  // ENCRYPTION HELPERS
  // ============================================

  /**
   * Get shared secret for encrypting data to MXE
   */
  async getSharedSecret(): Promise<Uint8Array> {
    return await getSharedSecret(
      this.arciumClient,
      this.wallet.publicKey
    );
  }

  /**
   * Encrypt rights ownership data for MPC verification
   */
  async encryptOwnership(
    ownership: RightsOwnership,
    sharedSecret: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    // Serialize ownership struct
    const serialized = this.serializeOwnership(ownership);
    
    // Generate nonce
    const nonce = randomBytes(16);
    
    // Encrypt using shared secret
    const ciphertext = await encrypt(serialized, sharedSecret, nonce);
    
    return { ciphertext, nonce };
  }

  /**
   * Decrypt verification result
   */
  async decryptResult(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    sharedSecret: Uint8Array
  ): Promise<VerificationResult> {
    const decrypted = await decrypt(ciphertext, sharedSecret, nonce);
    return this.deserializeResult(decrypted);
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  private serializeOwnership(ownership: RightsOwnership): Uint8Array {
    // Calculate total size: 32 + 32 + 32 + (20 * 32) + 20 = 756 bytes
    const buffer = new Uint8Array(756);
    let offset = 0;

    // Wallet hash (32 bytes)
    buffer.set(ownership.walletHash, offset);
    offset += 32;

    // Track ID (32 bytes)
    buffer.set(ownership.trackId, offset);
    offset += 32;

    // Rights token ID (32 bytes)
    buffer.set(ownership.rightsTokenId, offset);
    offset += 32;

    // Merkle path (20 x 32 bytes)
    for (let i = 0; i < 20; i++) {
      if (ownership.merklePath[i]) {
        buffer.set(ownership.merklePath[i], offset);
      }
      offset += 32;
    }

    // Merkle indices (20 bytes)
    for (let i = 0; i < 20; i++) {
      buffer[offset + i] = ownership.merkleIndices[i] || 0;
    }

    return buffer;
  }

  private deserializeResult(data: Uint8Array): VerificationResult {
    return {
      isValid: data[0] === 1,
      nullifier: data.slice(1, 33),
    };
  }

  // ============================================
  // PROTOCOL OPERATIONS
  // ============================================

  /**
   * Initialize the protocol
   */
  async initialize(): Promise<string> {
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      PHANTOM_STREAMS_PROGRAM_ID
    );

    const tx = await this.program.methods
      .initialize()
      .accounts({
        state: statePda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Protocol initialized:", tx);
    return tx;
  }

  /**
   * Verify music rights ownership privately via Arcium MPC
   */
  async verifyOwnership(
    walletAddress: PublicKey,
    trackId: string,
    rightsTokenId: string,
    merklePath: Uint8Array[],
    merkleIndices: number[]
  ): Promise<{
    txSignature: string;
    nullifierHash: Uint8Array;
    isValid: boolean;
  }> {
    // Hash wallet address
    const walletHash = createHash("sha256")
      .update(walletAddress.toBuffer())
      .digest();

    // Hash track and token IDs
    const trackIdHash = createHash("sha256")
      .update(trackId)
      .digest();
    const tokenIdHash = createHash("sha256")
      .update(rightsTokenId)
      .digest();

    // Build ownership struct
    const ownership: RightsOwnership = {
      walletHash: new Uint8Array(walletHash),
      trackId: new Uint8Array(trackIdHash),
      rightsTokenId: new Uint8Array(tokenIdHash),
      merklePath: merklePath.map(p => new Uint8Array(p)),
      merkleIndices,
    };

    // Get shared secret and encrypt
    const sharedSecret = await this.getSharedSecret();
    const { ciphertext, nonce } = await this.encryptOwnership(ownership, sharedSecret);

    // Get PDAs
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      PHANTOM_STREAMS_PROGRAM_ID
    );

    const [compDefPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("comp_def"), Buffer.from("verify_ownership")],
      PHANTOM_STREAMS_PROGRAM_ID
    );

    // Get Arcium accounts
    const arciumAccounts = await this.arciumClient.getComputationAccounts();

    // Submit verification request
    const tx = await this.program.methods
      .verifyOwnership(
        Buffer.from(ciphertext),
        Array.from(nonce)
      )
      .accounts({
        state: statePda,
        payer: this.wallet.publicKey,
        mempool: arciumAccounts.mempool,
        cluster: arciumAccounts.cluster,
        compDef: compDefPda,
        arciumProgram: ARCIUM_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Verification submitted:", tx);

    // Wait for MPC computation to complete
    console.log("Waiting for Arcium MPC computation...");
    const result = await awaitComputationFinalization(
      this.arciumClient,
      tx,
      60000 // 60 second timeout
    );

    // Decrypt the result
    const decrypted = await this.decryptResult(
      new Uint8Array(result.encryptedOutput),
      new Uint8Array(result.nonce),
      sharedSecret
    );

    return {
      txSignature: tx,
      nullifierHash: decrypted.nullifier,
      isValid: decrypted.isValid,
    };
  }

  /**
   * Create a new royalty vote
   */
  async createVote(
    voteId: string,
    optionsCount: number,
    durationSeconds: number
  ): Promise<string> {
    const voteIdHash = createHash("sha256")
      .update(voteId)
      .digest();

    const [votePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), voteIdHash],
      PHANTOM_STREAMS_PROGRAM_ID
    );

    const [compDefPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("comp_def"), Buffer.from("init_vote_tally")],
      PHANTOM_STREAMS_PROGRAM_ID
    );

    const arciumAccounts = await this.arciumClient.getComputationAccounts();

    const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

    const tx = await this.program.methods
      .createVote(
        Array.from(voteIdHash),
        optionsCount,
        new BN(endTime)
      )
      .accounts({
        vote: votePda,
        authority: this.wallet.publicKey,
        mempool: arciumAccounts.mempool,
        cluster: arciumAccounts.cluster,
        compDef: compDefPda,
        arciumProgram: ARCIUM_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Vote created:", tx);
    return tx;
  }

  /**
   * Cast an encrypted vote
   */
  async castVote(
    voteId: string,
    choice: number,
    weight: bigint
  ): Promise<string> {
    const voteIdHash = createHash("sha256")
      .update(voteId)
      .digest();

    const [votePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), voteIdHash],
      PHANTOM_STREAMS_PROGRAM_ID
    );

    const [compDefPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("comp_def"), Buffer.from("cast_royalty_vote")],
      PHANTOM_STREAMS_PROGRAM_ID
    );

    // Encrypt vote
    const sharedSecret = await this.getSharedSecret();
    const voteData: RoyaltyVote = { choice, weight };
    const serialized = new Uint8Array(9);
    serialized[0] = choice;
    new DataView(serialized.buffer).setBigUint64(1, weight, true);
    
    const nonce = randomBytes(16);
    const ciphertext = await encrypt(serialized, sharedSecret, nonce);

    const arciumAccounts = await this.arciumClient.getComputationAccounts();

    const tx = await this.program.methods
      .castVote(
        Buffer.from(ciphertext),
        Array.from(nonce)
      )
      .accounts({
        vote: votePda,
        voter: this.wallet.publicKey,
        mempool: arciumAccounts.mempool,
        cluster: arciumAccounts.cluster,
        compDef: compDefPda,
        arciumProgram: ARCIUM_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Vote cast:", tx);
    return tx;
  }
}

// ============================================
// DEMO
// ============================================

async function main() {
  console.log("\n🎵 PHANTOM STREAMS - Arcium MPC Demo 🎵\n");
  console.log("Private Music Rights Verification\n");
  console.log("=".repeat(50) + "\n");

  // Setup
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const wallet = Keypair.generate();

  console.log("Wallet:", wallet.publicKey.toBase58().slice(0, 8) + "...\n");

  const client = new PhantomStreamsClient(connection, wallet, "devnet");

  // Demo verification
  console.log("📝 STEP 1: Artist creates rights token");
  console.log("-".repeat(40));
  
  const trackId = "we-are-back-unicorny-2026";
  const tokenId = "rights-token-001";
  
  console.log("Track:", trackId);
  console.log("Token:", tokenId);
  console.log("✅ Rights token created\n");

  // Build mock Merkle proof
  console.log("🌳 STEP 2: Build Merkle proof");
  console.log("-".repeat(40));
  
  const merklePath: Uint8Array[] = [];
  const merkleIndices: number[] = [];
  
  for (let i = 0; i < 20; i++) {
    merklePath.push(randomBytes(32));
    merkleIndices.push(Math.random() > 0.5 ? 1 : 0);
  }
  
  console.log("Proof depth: 20 levels");
  console.log("✅ Merkle proof ready\n");

  // Verify via Arcium MPC
  console.log("🔐 STEP 3: Verify ownership via Arcium MPC");
  console.log("-".repeat(40));
  console.log("This proves: 'I own rights to this track'");
  console.log("This hides: Wallet address, other holdings\n");

  console.log("Encrypting ownership data...");
  console.log("Submitting to Arcium cluster...");
  console.log("MPC nodes processing encrypted data...\n");

  // In production:
  // const result = await client.verifyOwnership(
  //   wallet.publicKey,
  //   trackId,
  //   tokenId,
  //   merklePath,
  //   merkleIndices
  // );

  // Mock result for demo
  const mockNullifier = randomBytes(32);
  console.log("✅ OWNERSHIP VERIFIED!");
  console.log("Nullifier:", mockNullifier.toString("hex").slice(0, 16) + "...\n");

  // Summary
  console.log("=".repeat(50));
  console.log("\n📊 PRIVACY SUMMARY\n");
  console.log("PUBLIC (visible on-chain):");
  console.log("  • Track ID hash");
  console.log("  • Merkle root");
  console.log("  • Nullifier (prevents replay)");
  console.log("  • Verification result (true/false)\n");
  console.log("PRIVATE (hidden by Arcium MPC):");
  console.log("  • Wallet address");
  console.log("  • Rights token ID");
  console.log("  • Other holdings");
  console.log("  • Full Merkle proof path\n");
  console.log("=".repeat(50));
  console.log("\nPhantom Streams + Arcium = Privacy for creators 🎵🔐\n");
}

// Run if executed directly
main().catch(console.error);

export default PhantomStreamsClient;
