// filepath: /home/ayoub/test/challenges-dapp/programs/coinpetitive/src/instructions/challenge/create_challenge.rs
use anchor_lang::prelude::*;
use crate::instructions::fee_tracking::{self, state::FeeTrackingState};
use crate::instructions::milestone_tracking::{self, state::MilestoneTrackingState};
use crate::instructions::challenge::types::Challenge;
use crate::instructions::errors::ErrorCode;

#[derive(Accounts)]
#[instruction(reward: u64, participation_fee: u64, voting_fee: u64, max_participants: u8, challenge_id: u64)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = 8 + // discriminator
               32 + // creator: Pubkey
               1 +  // is_active: bool
               8 +  // reward: u64
               8 +  // participation_fee: u64
               8 +  // voting_fee: u64
               8 +  // challenge_treasury: u64
               8 +  // voting_treasury: u64
               33 + // winner: Option<Pubkey>
               8 +  // total_votes: u64
               8 +  // winning_votes: u64
               32 + // reward_token_mint: Pubkey
               4 + (32 * max_participants as usize) + // participants vec with length prefix
               1 +  // max_participants: u8
               4 + (40 * 20) + // submission_votes: Vec<(Pubkey, u64)> - limit to 20 submissions
               4 + (64 * 50) + // voters: Vec<(Pubkey, Pubkey)> - limit to 50 voters
               32 + // treasury: Pubkey
               32   // voting_treasury_pda: Pubkey
    )]
    pub challenge: Account<'info, Challenge>,
    
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    #[account(mut)]
    pub program_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    
    pub token_program: AccountInfo<'info>,
    
    pub token_mint: AccountInfo<'info>,
    
    pub creator_token_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub treasury_token_account: AccountInfo<'info>,

    pub associated_token_program: AccountInfo<'info>,

    #[account(mut)]
    pub voting_treasury: AccountInfo<'info>,

    #[account(mut)]
    pub voting_treasury_token_account: AccountInfo<'info>,

    #[account(mut)]
    pub fee_tracking_state: Account<'info, FeeTrackingState>,

    #[account(mut)]
    pub milestone_tracking_state: Account<'info, MilestoneTrackingState>,
}

pub fn handle(
    ctx: Context<CreateChallenge>,
    reward: u64,
    participation_fee: u64,
    voting_fee: u64,
    max_participants: u8,
    challenge_id: u64
) -> Result<()> {
    // Update total fees paid
    fee_tracking::update_total_fees(ctx.accounts.fee_tracking_state, participation_fee)?;

    // Check and mint tokens based on milestones
    milestone_tracking::mint_milestone(ctx.accounts.milestone_tracking_state)?;

    // Initialize challenge state
    let challenge = &mut ctx.accounts.challenge;
    challenge.creator = *ctx.accounts.user.key;
    challenge.is_active = true;
    challenge.reward = reward;
    challenge.participation_fee = participation_fee;
    challenge.voting_fee = voting_fee;
    challenge.challenge_treasury = 0;
    challenge.voting_treasury = 0;
    challenge.winner = None;
    challenge.total_votes = 0;
    challenge.winning_votes = 0;
    challenge.reward_token_mint = ctx.accounts.token_mint.key();
    challenge.participants = Vec::new();
    challenge.submission_votes = Vec::new();
    challenge.voters = Vec::new();
    
    // Store the treasury address in the challenge
    challenge.treasury = ctx.accounts.treasury.key();
    challenge.voting_treasury_pda = ctx.accounts.voting_treasury.key();
    
    // Set max_participants with a reasonable default if zero
    challenge.max_participants = if max_participants == 0 { 50 } else { max_participants };
    
    Ok(())
}