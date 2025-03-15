use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Transfer, Token, TokenAccount};
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

#[derive(Accounts)]
pub struct VoteForSubmission<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut, constraint = challenge.is_active @ ErrorCode::ChallengeNotActive)]
    pub challenge: Account<'info, Challenge>,
    
    // Token accounts
    pub token_program: Program<'info, Token>,
    #[account(
        mut,
        constraint = voter_token_account.mint == challenge.reward_token_mint
    )]
    pub voter_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = challenge_token_account.mint == challenge.reward_token_mint
    )]
    pub challenge_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Just storing submission ID for reference
    pub submission_id: AccountInfo<'info>,
}

pub fn handle(ctx: Context<VoteForSubmission>) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Transfer voting fee from voter to challenge
    let cpi_accounts = Transfer {
        from: ctx.accounts.voter_token_account.to_account_info(),
        to: ctx.accounts.challenge_token_account.to_account_info(),
        authority: ctx.accounts.voter.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    transfer(cpi_ctx, challenge.voting_fee)?;
    
    // Update voting treasury and total votes
    challenge.voting_treasury += challenge.voting_fee;
    challenge.total_votes += 1;
    
    Ok(())
}