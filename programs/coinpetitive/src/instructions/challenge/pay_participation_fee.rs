use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Transfer, TokenAccount};
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Define the Token program ID constant
pub const TOKEN_PROGRAM_ID_STR: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

#[derive(Accounts)]
pub struct PayParticipationFee<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    #[account(mut, constraint = challenge.is_active @ ErrorCode::ChallengeNotActive)]
    pub challenge: Account<'info, Challenge>,
    
    // Use Standard Token program
    /// CHECK: Standard Token program
    #[account(address = TOKEN_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = participant_token_account.mint == challenge.reward_token_mint
    )]
    pub participant_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = challenge_token_account.mint == challenge.reward_token_mint
    )]
    pub challenge_token_account: Account<'info, TokenAccount>,
}

pub fn handle(ctx: Context<PayParticipationFee>) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Transfer participation fee from participant to challenge using Token-2022
    let cpi_accounts = Transfer {
        from: ctx.accounts.participant_token_account.to_account_info(),
        to: ctx.accounts.challenge_token_account.to_account_info(),
        authority: ctx.accounts.participant.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    transfer(cpi_ctx, challenge.participation_fee)?;
    
    // Update challenge treasury
    challenge.challenge_treasury += challenge.participation_fee;
    
    Ok(())
}