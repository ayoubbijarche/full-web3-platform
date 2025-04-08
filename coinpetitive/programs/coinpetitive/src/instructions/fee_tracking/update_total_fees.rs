// filepath: /home/ayoub/test/challenges-dapp/programs/coinpetitive/src/instructions/fee_tracking/update_total_fees.rs
use anchor_lang::prelude::*;
use crate::instructions::fee_tracking::state::FeeTrackingState;
use crate::instructions::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdateTotalFees<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    
    #[account(mut)]
    pub fee_tracking_state: Account<'info, FeeTrackingState>,
}

pub fn handle(ctx: Context<UpdateTotalFees>, fee_amount: u64) -> Result<()> {
    let fee_tracking_state = &mut ctx.accounts.fee_tracking_state;

    // Update the total fees paid
    fee_tracking_state.total_fees_paid += fee_amount;

    // Add the participant to the list if not already present
    if !fee_tracking_state.participants.contains(&ctx.accounts.participant.key()) {
        fee_tracking_state.participants.push(*ctx.accounts.participant.key);
    }

    msg!("Total fees updated. New total: {}", fee_tracking_state.total_fees_paid);
    Ok(())
}