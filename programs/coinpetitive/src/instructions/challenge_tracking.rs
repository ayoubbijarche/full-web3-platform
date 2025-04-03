use anchor_lang::prelude::*;
use crate::instructions::token::TokenState;
use crate::instructions::token_errors::TokenError;

#[derive(Accounts)]
pub struct TrackChallenge<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    
    // Any signer can track challenges now
    pub authority: Signer<'info>,
    
    // System program
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TrackChallengesBatch<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    
    // Any signer can track challenges now
    pub authority: Signer<'info>,
    
    // System program
    pub system_program: Program<'info, System>,
}

// Track a single completed challenge
pub fn track_challenge_completion(ctx: Context<TrackChallenge>) -> Result<()> {
    let token_state = &mut ctx.accounts.token_state;
    
    // Get current timestamp for rate limiting
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    
    // Basic rate limiting to prevent spam - one increment per second per account
    if current_time <= token_state.last_challenge_tracked {
        return Err(TokenError::TooManyRequests.into());
    }
    
    // Increment the challenge counter
    token_state.challenges_completed = token_state.challenges_completed.checked_add(1)
        .ok_or(TokenError::ArithmeticOverflow)?;
    
    // Update last tracked time
    token_state.last_challenge_tracked = current_time;
    
    // Check if we've hit any milestones
    check_challenge_milestones(token_state)?;
    
    msg!("Challenge completion tracked. Total: {}", token_state.challenges_completed);
    Ok(())
}

// Track multiple completed challenges in a batch - keep lower limit since anyone can call
pub fn track_challenges_batch(ctx: Context<TrackChallengesBatch>, count: u64) -> Result<()> {
    let token_state = &mut ctx.accounts.token_state;
    
    // More restrictive count limit since anyone can call this function
    require!(count > 0 && count <= 100, TokenError::InvalidBatchSize);
    
    // Rate limiting - one batch per minute per account
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    if current_time - token_state.last_challenge_tracked < 60 {
        return Err(TokenError::TooManyRequests.into());
    }
    
    // Increment the challenge counter
    token_state.challenges_completed = token_state.challenges_completed.checked_add(count)
        .ok_or(TokenError::ArithmeticOverflow)?;
    
    // Update last tracked time
    token_state.last_challenge_tracked = current_time;
    
    // Check if we've hit any milestones
    check_challenge_milestones(token_state)?;
    
    msg!("Batch of {} challenges tracked. Total: {}", count, token_state.challenges_completed);
    Ok(())
}

// Helper function to check if challenge milestones have been met
fn check_challenge_milestones(token_state: &mut TokenState) -> Result<()> {
    // Just log the current total for monitoring purposes
    msg!("Current total challenges completed: {}", token_state.challenges_completed);
    Ok(())
}

