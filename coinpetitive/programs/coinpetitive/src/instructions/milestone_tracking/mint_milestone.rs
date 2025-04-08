// filepath: /home/ayoub/test/challenges-dapp/programs/coinpetitive/src/instructions/milestone_tracking/mint_milestone.rs
use anchor_lang::prelude::*;
use crate::instructions::fee_tracking::state::FeeTrackingState;
use crate::instructions::milestone_tracking::state::MilestoneTrackingState;
use crate::instructions::errors::ErrorCode;

#[derive(Accounts)]
pub struct MintMilestone<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub fee_tracking_state: Account<'info, FeeTrackingState>,
    
    #[account(mut)]
    pub milestone_tracking_state: Account<'info, MilestoneTrackingState>,
    
    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<MintMilestone>) -> Result<()> {
    let fee_tracking = &ctx.accounts.fee_tracking_state;
    let milestone_tracking = &mut ctx.accounts.milestone_tracking_state;

    // Check if the required milestones have been met
    if fee_tracking.total_fees_paid >= 50_000_000 && !milestone_tracking.milestones_met.contains(&1) {
        milestone_tracking.milestones_met.push(1);
        // Mint tokens for this milestone
        mint_tokens(ctx.accounts.user.key(), 5_000_000)?;
    }

    if fee_tracking.total_fees_paid >= 100_000_000 && !milestone_tracking.milestones_met.contains(&2) {
        milestone_tracking.milestones_met.push(2);
        // Mint tokens for this milestone
        mint_tokens(ctx.accounts.user.key(), 5_000_000)?;
    }

    // Add more milestones as needed...

    Ok(())
}

fn mint_tokens(user: Pubkey, amount: u64) -> Result<()> {
    // Logic to mint tokens to the user's account
    // This function should interact with the token program to mint the specified amount
    msg!("Minting {} tokens to {}", amount, user);
    // Implement the actual minting logic here
    Ok(())
}