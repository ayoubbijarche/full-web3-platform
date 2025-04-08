use anchor_lang::prelude::*;

#[account]
pub struct ChallengeTracker {
    pub total_challenges: u64,
    pub authority: Pubkey,
}

impl ChallengeTracker {
    // Space required for the account
    pub const SPACE: usize = 8 + // discriminator
                             8 + // total_challenges
                             32; // authority
}

#[derive(Accounts)]
pub struct InitializeChallengeTracker<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = ChallengeTracker::SPACE,
        seeds = [b"challenge_tracker"],
        bump
    )]
    pub challenge_tracker: Account<'info, ChallengeTracker>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TrackChallenge<'info> {
    #[account(
        mut,
        seeds = [b"challenge_tracker"],
        bump,
    )]
    pub challenge_tracker: Account<'info, ChallengeTracker>,
}

pub fn initialize_challenge_tracker(ctx: Context<InitializeChallengeTracker>) -> Result<()> {
    let tracker = &mut ctx.accounts.challenge_tracker;
    tracker.total_challenges = 0;
    tracker.authority = ctx.accounts.authority.key();
    
    msg!("Challenge tracker initialized");
    
    Ok(())
}

pub fn track_challenge_completion(ctx: Context<TrackChallenge>) -> Result<()> {
    let tracker = &mut ctx.accounts.challenge_tracker;
    
    // Increment challenge count
    tracker.total_challenges = tracker.total_challenges.checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    msg!("Challenge completion tracked! Total challenges: {}", tracker.total_challenges);
    
    Ok(())
}

pub fn track_challenges_batch(ctx: Context<TrackChallenge>, count: u64) -> Result<()> {
    let tracker = &mut ctx.accounts.challenge_tracker;
    
    // Add multiple challenges at once
    tracker.total_challenges = tracker.total_challenges.checked_add(count)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    msg!("Batch tracked {} challenges! Total challenges: {}", count, tracker.total_challenges);
    
    Ok(())
}