# DEMO VIDEO SCRIPT (3 Minutes)

## Equipment
- Screen recording (OBS/Loom)
- Microphone
- Terminal ready
- Browser with Solana Explorer

---

## SCRIPT

### [0:00 - 0:25] HOOK

**[Show terminal with Phantom Streams logo/ASCII art]**

"Every time an independent artist checks their wallet on-chain, they're giving major labels a free competitive intelligence report.

Labels know exactly how much indie artists are earning, which tracks are performing, and who their biggest fans are.

Phantom Streams fixes this."

---

### [0:25 - 0:50] THE PROBLEM

**[Show simple diagram: Public Blockchain → Everyone Sees Everything]**

"On-chain music rights are completely public. 

When you own an NFT proving you have rights to a track, anyone can see:
- Your wallet address
- How many tracks you own  
- Your entire transaction history

For artists, this is a privacy nightmare.
For fans, it's surveillance.

We need private verification."

---

### [0:50 - 1:45] THE SOLUTION + LIVE DEMO

**[Switch to terminal]**

"Phantom Streams uses two privacy technologies:

First, Arcium's Multi-Party Computation. Your ownership data is encrypted and split across multiple nodes. No single node ever sees your wallet.

Second, Noir zero-knowledge proofs for static verification.

Let me show you."

**[Run demo]**
```bash
npm run demo:arcium
```

**[Narrate as output appears]**

"An artist mints a rights token for their track...

A fan purchases access and is added to the rights registry...

Now the fan wants to prove they own this track to access exclusive content.

They encrypt their ownership proof and submit it to Arcium's MPC network...

The nodes verify the Merkle inclusion proof WITHOUT ever seeing the wallet address...

And we get back: Ownership verified. 

The platform knows the fan has valid rights. But the wallet stays completely hidden."

---

### [1:45 - 2:15] TECHNICAL ARCHITECTURE

**[Show architecture diagram]**

"Here's the architecture:

Rights are minted as SPL tokens and indexed into a Merkle tree.

For real-time verification, we use Arcium MPC. The encrypted-ixs run verify_ownership on encrypted data.

For static proofs, we use Noir circuits verified on-chain via Sunspot.

Both paths give you the same result: private ownership verification.

Built on Solana for speed. Powered by Helius for indexing."

---

### [2:15 - 2:45] WHY THIS MATTERS

**[Show Privacy Summary]**

"What's public:
- The Merkle root
- A nullifier hash to prevent replay attacks
- Whether verification passed

What stays private:
- Your wallet address
- Your token holdings
- Your transaction history
- Your identity

This is infrastructure. Any music platform can integrate private rights verification.

Streaming services. NFT marketplaces. Fan clubs. All without surveillance."

---

### [2:45 - 3:00] CLOSE

**[Return to logo/terminal]**

"Privacy for creators, not just traders.

Built for Solana Privacy Hack 2026 with Arcium MPC, Noir ZK, Light Protocol, and Helius.

Phantom Streams. Open source. Ready to ship.

Thanks for watching."

**[Show GitHub URL]**

---

## RECORDING TIPS

1. **Practice 2-3 times** before recording
2. **Speak slowly** - you have 3 minutes
3. **Have demo pre-loaded** - don't wait for npm install
4. **Keep terminal font large** - viewers on phones
5. **Cut silence** - tighten in editing

## FALLBACK

If demo fails live:
- Use pre-recorded demo output
- Show screenshots
- Focus on architecture explanation

## UPLOAD

1. Export as MP4 (1080p)
2. Upload to YouTube (unlisted) or Loom
3. Add link to README and submission form
