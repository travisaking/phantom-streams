// Phantom Streams - Solana Program with Arcium MPC Integration
// Private Music Rights Verification
//
// This program orchestrates MPC computations via Arcium
// For Solana Privacy Hackathon 2026

use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Computation definition offsets for each encrypted instruction
const COMP_DEF_OFFSET_VERIFY_OWNERSHIP: u32 = comp_def_offset("verify_ownership");
const COMP_DEF_OFFSET_INIT_VOTE_TALLY: u32 = comp_def_offset("init_vote_tally");
const COMP_DEF_OFFSET_CAST_ROYALTY_VOTE: u32 = comp_def_offset("cast_royalty_vote");
const COMP_DEF_OFFSET_REVEAL_VOTE_RESULT: u32 = comp_def_offset("reveal_vote_result");
const COMP_DEF_OFFSET_VERIFY_PAYMENT: u32 = comp_def_offset("verify_payment_threshold");

declare_id!("PhntmStr3amsMPCxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[arcium_program]
pub mod phantom_streams {
    use super::*;

    // ========================================
    // INITIALIZATION
    // ========================================

    /// Initialize the protocol state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.merkle_root = [0u8; 32];
        state.verification_count = 0;
        state.bump = ctx.bumps.state;

        msg!("Phantom Streams initialized with Arcium MPC");
        Ok(())
    }

    /// Initialize computation definition for verify_ownership
    /// Must be called once before any verifications
    pub fn init_verify_ownership_comp_def(
        ctx: Context<InitCompDef>,
    ) -> Result<()> {
        // This registers the encrypted instruction with Arcium
        arcium_anchor::init_comp_def(
            ctx.accounts,
            COMP_DEF_OFFSET_VERIFY_OWNERSHIP,
        )?;
        msg!("Initialized verify_ownership computation definition");
        Ok(())
    }

    /// Initialize computation definition for voting
    pub fn init_vote_comp_def(
        ctx: Context<InitCompDef>,
    ) -> Result<()> {
        arcium_anchor::init_comp_def(
            ctx.accounts,
            COMP_DEF_OFFSET_CAST_ROYALTY_VOTE,
        )?;
        msg!("Initialized vote computation definition");
        Ok(())
    }

    // ========================================
    // MERKLE ROOT MANAGEMENT
    // ========================================

    /// Update the Merkle root (only authority)
    pub fn update_merkle_root(
        ctx: Context<UpdateRoot>,
        new_root: [u8; 32],
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;

        require!(
            ctx.accounts.authority.key() == state.authority,
            PhantomError::Unauthorized
        );

        let old_root = state.merkle_root;
        state.merkle_root = new_root;

        emit!(MerkleRootUpdated {
            old_root,
            new_root,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Merkle root updated");
        Ok(())
    }

    // ========================================
    // PRIVATE OWNERSHIP VERIFICATION (via Arcium MPC)
    // ========================================

    /// Request ownership verification via Arcium MPC
    /// 
    /// The user provides encrypted ownership proof
    /// Arcium nodes verify it without seeing the actual wallet
    pub fn verify_ownership(
        ctx: Context<VerifyOwnership>,
        encrypted_ownership: Vec<u8>,  // Encrypted RightsOwnership struct
        nonce: [u8; 16],               // Encryption nonce
    ) -> Result<()> {
        let state = &ctx.accounts.state;

        // Queue the computation with Arcium
        queue_computation(
            ctx.accounts.arcium_accounts(),
            COMP_DEF_OFFSET_VERIFY_OWNERSHIP,
            &encrypted_ownership,
            &nonce,
            &state.merkle_root,  // Public input: current merkle root
        )?;

        msg!("Ownership verification queued with Arcium MPC");
        Ok(())
    }

    /// Callback from Arcium after MPC verification completes
    pub fn verify_ownership_callback(
        ctx: Context<VerifyOwnershipCallback>,
        encrypted_result: Vec<u8>,  // Encrypted VerificationResult
        nonce: [u8; 16],
        nullifier_hash: [u8; 32],   // Extracted from result for nullifier tracking
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let nullifier = &mut ctx.accounts.nullifier;

        // Check nullifier hasn't been used
        require!(!nullifier.is_used, PhantomError::NullifierAlreadyUsed);

        // Mark nullifier as used
        nullifier.is_used = true;
        nullifier.hash = nullifier_hash;
        nullifier.used_at = Clock::get()?.unix_timestamp;
        nullifier.bump = ctx.bumps.nullifier;

        // Increment verification count
        state.verification_count = state.verification_count.saturating_add(1);

        // Store encrypted result for user to decrypt
        emit!(OwnershipVerified {
            nullifier_hash,
            encrypted_result,
            verification_id: state.verification_count,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Ownership verified via Arcium MPC");
        Ok(())
    }

    // ========================================
    // PRIVATE VOTING (for royalty decisions)
    // ========================================

    /// Create a new royalty vote with encrypted tally
    pub fn create_vote(
        ctx: Context<CreateVote>,
        vote_id: [u8; 32],
        options_count: u8,
        end_time: i64,
    ) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        vote.id = vote_id;
        vote.authority = ctx.accounts.authority.key();
        vote.options_count = options_count;
        vote.end_time = end_time;
        vote.is_revealed = false;
        vote.bump = ctx.bumps.vote;

        // Queue init_vote_tally to create encrypted [0,0,0,...] tally
        queue_computation(
            ctx.accounts.arcium_accounts(),
            COMP_DEF_OFFSET_INIT_VOTE_TALLY,
            &[],  // No inputs needed
            &[0u8; 16],
            &[],
        )?;

        msg!("Vote created, initializing encrypted tally");
        Ok(())
    }

    /// Callback to receive initialized encrypted tally
    pub fn create_vote_callback(
        ctx: Context<CreateVoteCallback>,
        encrypted_tally: Vec<u8>,
        nonce: [u8; 16],
    ) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        vote.encrypted_tally = encrypted_tally;
        vote.tally_nonce = nonce;

        msg!("Vote tally initialized");
        Ok(())
    }

    /// Cast an encrypted vote
    pub fn cast_vote(
        ctx: Context<CastVote>,
        encrypted_vote: Vec<u8>,  // Encrypted RoyaltyVote
        nonce: [u8; 16],
    ) -> Result<()> {
        let vote = &ctx.accounts.vote;

        // Check vote is still open
        let now = Clock::get()?.unix_timestamp;
        require!(now < vote.end_time, PhantomError::VoteClosed);
        require!(!vote.is_revealed, PhantomError::VoteAlreadyRevealed);

        // Queue cast_royalty_vote computation
        // Inputs: encrypted_vote + current encrypted_tally
        let mut inputs = encrypted_vote.clone();
        inputs.extend_from_slice(&vote.encrypted_tally);

        queue_computation(
            ctx.accounts.arcium_accounts(),
            COMP_DEF_OFFSET_CAST_ROYALTY_VOTE,
            &inputs,
            &nonce,
            &[],
        )?;

        msg!("Vote cast, updating encrypted tally");
        Ok(())
    }

    /// Callback to receive updated encrypted tally after vote
    pub fn cast_vote_callback(
        ctx: Context<CastVoteCallback>,
        new_encrypted_tally: Vec<u8>,
        nonce: [u8; 16],
    ) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        vote.encrypted_tally = new_encrypted_tally;
        vote.tally_nonce = nonce;

        emit!(VoteCast {
            vote_id: vote.id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Vote recorded in encrypted tally");
        Ok(())
    }

    /// Reveal the vote result (authority only, after end_time)
    pub fn reveal_result(
        ctx: Context<RevealResult>,
    ) -> Result<()> {
        let vote = &ctx.accounts.vote;

        // Check authorization and timing
        require!(
            ctx.accounts.authority.key() == vote.authority,
            PhantomError::Unauthorized
        );
        
        let now = Clock::get()?.unix_timestamp;
        require!(now >= vote.end_time, PhantomError::VoteStillOpen);
        require!(!vote.is_revealed, PhantomError::VoteAlreadyRevealed);

        // Queue reveal computation
        queue_computation(
            ctx.accounts.arcium_accounts(),
            COMP_DEF_OFFSET_REVEAL_VOTE_RESULT,
            &vote.encrypted_tally,
            &vote.tally_nonce,
            &[],
        )?;

        msg!("Vote reveal queued");
        Ok(())
    }

    /// Callback with revealed winner
    pub fn reveal_result_callback(
        ctx: Context<RevealResultCallback>,
        winning_option: u8,
    ) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        vote.is_revealed = true;
        vote.winning_option = Some(winning_option);

        emit!(VoteRevealed {
            vote_id: vote.id,
            winning_option,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Vote result revealed: option {}", winning_option);
        Ok(())
    }
}

// ========================================
// ACCOUNTS
// ========================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolState::SIZE,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProtocolState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Arcium computation definition PDA
    #[account(mut)]
    pub comp_def: UncheckedAccount<'info>,
    
    /// CHECK: Arcium program
    pub arcium_program: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRoot<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump
    )]
    pub state: Account<'info, ProtocolState>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct VerifyOwnership<'info> {
    #[account(seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, ProtocolState>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // Arcium accounts for MPC
    /// CHECK: Arcium mempool
    #[account(mut)]
    pub mempool: UncheckedAccount<'info>,
    
    /// CHECK: Arcium cluster
    pub cluster: UncheckedAccount<'info>,
    
    /// CHECK: Computation definition
    pub comp_def: UncheckedAccount<'info>,
    
    /// CHECK: Arcium program
    pub arcium_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(encrypted_result: Vec<u8>, nonce: [u8; 16], nullifier_hash: [u8; 32])]
pub struct VerifyOwnershipCallback<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, ProtocolState>,

    #[account(
        init,
        payer = payer,
        space = 8 + NullifierAccount::SIZE,
        seeds = [b"nullifier", nullifier_hash.as_ref()],
        bump
    )]
    pub nullifier: Account<'info, NullifierAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(vote_id: [u8; 32])]
pub struct CreateVote<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vote::SIZE,
        seeds = [b"vote", vote_id.as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(mut)]
    pub authority: Signer<'info>,

    // Arcium accounts
    /// CHECK: Arcium mempool
    #[account(mut)]
    pub mempool: UncheckedAccount<'info>,
    
    /// CHECK: Arcium cluster
    pub cluster: UncheckedAccount<'info>,
    
    /// CHECK: Computation definition
    pub comp_def: UncheckedAccount<'info>,
    
    /// CHECK: Arcium program
    pub arcium_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateVoteCallback<'info> {
    #[account(mut)]
    pub vote: Account<'info, Vote>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub vote: Account<'info, Vote>,

    #[account(mut)]
    pub voter: Signer<'info>,

    // Arcium accounts
    /// CHECK: Arcium mempool
    #[account(mut)]
    pub mempool: UncheckedAccount<'info>,
    
    /// CHECK: Arcium cluster
    pub cluster: UncheckedAccount<'info>,
    
    /// CHECK: Computation definition
    pub comp_def: UncheckedAccount<'info>,
    
    /// CHECK: Arcium program
    pub arcium_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVoteCallback<'info> {
    #[account(mut)]
    pub vote: Account<'info, Vote>,
}

#[derive(Accounts)]
pub struct RevealResult<'info> {
    #[account(mut)]
    pub vote: Account<'info, Vote>,

    pub authority: Signer<'info>,

    // Arcium accounts
    /// CHECK: Arcium mempool
    #[account(mut)]
    pub mempool: UncheckedAccount<'info>,
    
    /// CHECK: Arcium cluster
    pub cluster: UncheckedAccount<'info>,
    
    /// CHECK: Computation definition
    pub comp_def: UncheckedAccount<'info>,
    
    /// CHECK: Arcium program
    pub arcium_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RevealResultCallback<'info> {
    #[account(mut)]
    pub vote: Account<'info, Vote>,
}

// ========================================
// STATE
// ========================================

#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub verification_count: u64,
    pub bump: u8,
}

impl ProtocolState {
    pub const SIZE: usize = 32 + 32 + 8 + 1;
}

#[account]
pub struct NullifierAccount {
    pub is_used: bool,
    pub hash: [u8; 32],
    pub used_at: i64,
    pub bump: u8,
}

impl NullifierAccount {
    pub const SIZE: usize = 1 + 32 + 8 + 1;
}

#[account]
pub struct Vote {
    pub id: [u8; 32],
    pub authority: Pubkey,
    pub options_count: u8,
    pub end_time: i64,
    pub is_revealed: bool,
    pub winning_option: Option<u8>,
    pub encrypted_tally: Vec<u8>,
    pub tally_nonce: [u8; 16],
    pub bump: u8,
}

impl Vote {
    // Base size + max tally size (512 bytes for encrypted data)
    pub const SIZE: usize = 32 + 32 + 1 + 8 + 1 + 2 + 4 + 512 + 16 + 1;
}

// ========================================
// EVENTS
// ========================================

#[event]
pub struct MerkleRootUpdated {
    pub old_root: [u8; 32],
    pub new_root: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct OwnershipVerified {
    pub nullifier_hash: [u8; 32],
    pub encrypted_result: Vec<u8>,
    pub verification_id: u64,
    pub timestamp: i64,
}

#[event]
pub struct VoteCast {
    pub vote_id: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct VoteRevealed {
    pub vote_id: [u8; 32],
    pub winning_option: u8,
    pub timestamp: i64,
}

// ========================================
// ERRORS
// ========================================

#[error_code]
pub enum PhantomError {
    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Nullifier already used")]
    NullifierAlreadyUsed,

    #[msg("Vote is closed")]
    VoteClosed,

    #[msg("Vote is still open")]
    VoteStillOpen,

    #[msg("Vote already revealed")]
    VoteAlreadyRevealed,

    #[msg("Invalid proof")]
    InvalidProof,
}
