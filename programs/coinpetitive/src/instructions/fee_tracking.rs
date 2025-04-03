use anchor_lang::prelude::*;
use crate::instructions::token::TokenState;
use crate::instructions::token_errors::TokenError;

#[derive(Accounts)]
pub struct TrackEntryFee<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    

    pub authority: Signer<'info>,
    
    // System program
    pub system_program: Program<'info, System>,
}


pub fn track_entry_fee(ctx: Context<TrackEntryFee>, fee_amount: u64) -> Result<()> {
    let token_state = &mut ctx.accounts.token_state;
    

    token_state.total_entry_fees = token_state.total_entry_fees.checked_add(fee_amount)
        .ok_or(TokenError::ArithmeticOverflow)?;
    

    check_fee_milestones(token_state)?;
    
    msg!("Entry fee of {} tracked. Total fees: {}", fee_amount, token_state.total_entry_fees);
    Ok(())
}


fn check_fee_milestones(token_state: &mut TokenState) -> Result<()> {
    msg!("Current total entry fees: {}", token_state.total_entry_fees);
    Ok(())
}