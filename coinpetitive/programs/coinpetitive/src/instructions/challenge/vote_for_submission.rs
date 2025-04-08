// filepath: /home/ayoub/test/challenges-dapp/programs/coinpetitive/src/instructions/challenge/vote_for_submission.rs
use anchor_lang::prelude::*;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

#[derive(Accounts)]
pub struct VoteForSubmission<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    
    /// CHECK: Voter's token account
    #[account(mut)]
    pub voter_token_account: AccountInfo<'info>,
    
    /// CHECK: Challenge's treasury account
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<VoteForSubmission>, submission_id: u64) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let voter_key = ctx.accounts.voter.key();
    
    // Check if the challenge is active
    require!(challenge.is_active, ErrorCode::ChallengeNotActive);
    
    // Check if the voter has already voted
    require!(
        !challenge.has_voted(&voter_key),
        ErrorCode::AlreadyVoted
    );
    
    // Log the voting action
    msg!("Voter {} is voting for submission {}", voter_key, submission_id);
    
    // Update the challenge state with the new vote
    challenge.record_vote(voter_key, submission_id);
    
    msg!("Vote recorded successfully");
    
    Ok(())
}