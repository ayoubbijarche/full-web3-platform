use anchor_lang::prelude::*;

#[account]
pub struct FeeTracker {
    pub total_participation_fees: u64,
    pub total_voting_fees: u64,
    pub total_challenges: u64,
    pub authority: Pubkey,
}

impl FeeTracker {
    // Space required for the account
    pub const SPACE: usize = 8 + // discriminator
                             8 + // total_participation_fees
                             8 + // total_voting_fees
                             8 + // total_challenges
                             32; // authority
}

#[derive(Accounts)]
pub struct InitializeFeeTracker<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = FeeTracker::SPACE,
        seeds = [b"fee_tracker"],
        bump
    )]
    pub fee_tracker: Account<'info, FeeTracker>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateFee<'info> {
    // Only the program itself should update this
    #[account(
        mut,
        seeds = [b"fee_tracker"],
        bump,
    )]
    pub fee_tracker: Account<'info, FeeTracker>,
}

pub fn initialize_fee_tracker(ctx: Context<InitializeFeeTracker>) -> Result<()> {
    let fee_tracker = &mut ctx.accounts.fee_tracker;
    fee_tracker.total_participation_fees = 0;
    fee_tracker.total_voting_fees = 0;
    fee_tracker.total_challenges = 0;
    fee_tracker.authority = ctx.accounts.authority.key();
    
    msg!("Fee tracker initialized");
    
    Ok(())
}

pub fn track_participation_fee(ctx: Context<UpdateFee>, amount: u64) -> Result<()> {
    let fee_tracker = &mut ctx.accounts.fee_tracker;
    
    // Update total fees
    fee_tracker.total_participation_fees = fee_tracker.total_participation_fees.checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    msg!("Updated participation fee: total is now {}", fee_tracker.total_participation_fees);
    
    Ok(())
}

