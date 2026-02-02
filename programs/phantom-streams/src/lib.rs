use anchor_lang::prelude::*;

declare_id!("PhntmStr3amsXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod phantom_streams {
    use super::*;

    /// Initialize the protocol state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.merkle_root = [0u8; 32];
        state.verification_count = 0;
        state.bump = ctx.bumps.state;
        
        msg!("Phantom Streams initialized");
        Ok(())
    }

    /// Update the Merkle root (only authority can call)
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

    /// Verify an ownership proof
    /// In production, this would verify the actual ZK proof
    /// For MVP/demo, we verify proof format and track nullifiers
    pub fn verify_ownership(
        ctx: Context<VerifyOwnership>,
        proof_data: Vec<u8>,
        track_id: [u8; 32],
        nullifier_hash: [u8; 32],
        merkle_root_snapshot: [u8; 32],
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let nullifier = &mut ctx.accounts.nullifier;
        
        // 1. Verify nullifier hasn't been used
        require!(!nullifier.is_used, PhantomError::NullifierAlreadyUsed);
        
        // 2. Verify merkle root matches current state
        // (In production, might allow recent roots within a window)
        require!(
            state.merkle_root == merkle_root_snapshot,
            PhantomError::InvalidMerkleRoot
        );
        
        // 3. Verify proof data is present
        // TODO: Integrate with Sunspot or similar ZK verifier
        // For MVP, we check proof is non-empty
        require!(proof_data.len() > 0, PhantomError::InvalidProof);
        
        // 4. Mark nullifier as used
        nullifier.is_used = true;
        nullifier.track_id = track_id;
        nullifier.used_at = Clock::get()?.unix_timestamp;
        nullifier.bump = ctx.bumps.nullifier;
        
        // 5. Increment verification count
        state.verification_count = state.verification_count.checked_add(1)
            .ok_or(PhantomError::Overflow)?;
        
        // 6. Emit verification event
        emit!(OwnershipVerified {
            track_id,
            nullifier_hash,
            verification_id: state.verification_count,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Ownership verified for track");
        Ok(())
    }

    /// Check if a nullifier has been used (view function)
    pub fn check_nullifier(ctx: Context<CheckNullifier>) -> Result<bool> {
        Ok(ctx.accounts.nullifier.is_used)
    }
}

// ========== ACCOUNTS ==========

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
#[instruction(proof_data: Vec<u8>, track_id: [u8; 32], nullifier_hash: [u8; 32])]
pub struct VerifyOwnership<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump
    )]
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
#[instruction(nullifier_hash: [u8; 32])]
pub struct CheckNullifier<'info> {
    #[account(
        seeds = [b"nullifier", nullifier_hash.as_ref()],
        bump = nullifier.bump
    )]
    pub nullifier: Account<'info, NullifierAccount>,
}

// ========== STATE ==========

#[account]
pub struct ProtocolState {
    /// Authority that can update merkle root
    pub authority: Pubkey,
    /// Current merkle root of rights registry
    pub merkle_root: [u8; 32],
    /// Total successful verifications
    pub verification_count: u64,
    /// PDA bump
    pub bump: u8,
}

impl ProtocolState {
    pub const SIZE: usize = 32 + 32 + 8 + 1;
}

#[account]
pub struct NullifierAccount {
    /// Whether this nullifier has been used
    pub is_used: bool,
    /// Track ID this nullifier was used for
    pub track_id: [u8; 32],
    /// Timestamp when used
    pub used_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl NullifierAccount {
    pub const SIZE: usize = 1 + 32 + 8 + 1;
}

// ========== EVENTS ==========

#[event]
pub struct MerkleRootUpdated {
    pub old_root: [u8; 32],
    pub new_root: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct OwnershipVerified {
    pub track_id: [u8; 32],
    pub nullifier_hash: [u8; 32],
    pub verification_id: u64,
    pub timestamp: i64,
}

// ========== ERRORS ==========

#[error_code]
pub enum PhantomError {
    #[msg("Unauthorized - only authority can perform this action")]
    Unauthorized,
    
    #[msg("Nullifier has already been used")]
    NullifierAlreadyUsed,
    
    #[msg("Merkle root does not match current state")]
    InvalidMerkleRoot,
    
    #[msg("Invalid ZK proof")]
    InvalidProof,
    
    #[msg("Arithmetic overflow")]
    Overflow,
}
