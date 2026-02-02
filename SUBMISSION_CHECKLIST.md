# SUBMISSION CHECKLIST

## Deadline: February 1, 2026

### Repository Setup
- [ ] Create public GitHub repo: `phantom-streams`
- [ ] Push all code
- [ ] Add MIT license
- [ ] Verify README renders correctly

### Arcium MPC Build
- [ ] Install Arcium: `curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash`
- [ ] Verify: `arcium --version`
- [ ] Build: `arcium build`
- [ ] Fix any Arcis errors
- [ ] Initialize MXE: `arcium init-mxe --cluster devnet`
- [ ] Record MXE program ID

### Noir ZK Build
- [ ] Install Noir: `noirup -v 1.0.0-beta.13`
- [ ] Check: `cd circuits && nargo check`
- [ ] Compile: `nargo compile`
- [ ] Test: `nargo test`

### Solana Programs
- [ ] Build: `anchor build`
- [ ] Test: `anchor test`
- [ ] Deploy: `anchor deploy --provider.cluster devnet`
- [ ] Record program IDs:
  - phantom_streams: _______________
  - phantom_streams_arcium: _______________

### Demo Verification
- [ ] Run: `npm run demo`
- [ ] Run: `npm run demo:arcium`
- [ ] Screenshot or record output

### Documentation
- [ ] Update README with deployed program IDs
- [ ] Update README with MXE address
- [ ] Add deployment date
- [ ] Verify all instructions work for fresh clone

### Video (3 minutes max)
- [ ] Record demo video
- [ ] Upload to YouTube/Loom
- [ ] Add link to README

### Submission Form
Submit at: https://solanafoundation.typeform.com/privacyhack

Required fields:
- [ ] Project name: Phantom Streams
- [ ] GitHub URL
- [ ] Demo video URL
- [ ] Team members
- [ ] Contact email
- [ ] Bounties targeting:
  - [x] Open Track (Light Protocol) - $18K
  - [x] Arcium - $10K  
  - [x] Aztec/Noir (Non-Financial) - $2.5K
  - [x] Helius - $5K
  - [x] Encrypt.trade (Educational) - $1K

### Sponsor Shoutouts (in README)
- [ ] Light Protocol
- [ ] Arcium
- [ ] Aztec/Noir
- [ ] Helius
- [ ] Sunspot

---

## POST-SUBMISSION

### Verification
- [ ] Clone repo fresh and test build
- [ ] Verify devnet programs are accessible
- [ ] Test demo runs end-to-end

### Promotion
- [ ] Tweet about submission (tag @solaboratories @arcaboratories @aztaboratories @heaboratories)
- [ ] Post in hackathon Discord
- [ ] Share in Solana Privacy channel

---

## EMERGENCY CONTACTS

- Hackathon Discord: https://discord.gg/solana
- Arcium Discord: https://discord.com/invite/arcium
- Cat McGee (Solana Foundation): @CatMcGeeCode

---

## JUDGING CRITERIA (from hackathon page)

1. **Technical Implementation** - Does it work?
2. **Innovation** - Is it novel?
3. **Privacy Preservation** - Does it actually provide privacy?
4. **User Experience** - Is it usable?
5. **Documentation** - Is it well documented?

### Our Strengths:
- ✅ Technical: Dual stack (Arcium MPC + Noir ZK)
- ✅ Innovation: Non-DeFi use case (music rights)
- ✅ Privacy: Wallet never revealed
- ✅ UX: Clear demo flow
- ✅ Docs: Comprehensive README + architecture
