use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self, system_instruction};
use anchor_spl::token::{Mint, Transfer, Token, TokenAccount, transfer};
use crate::instructions::challenge::types::Challenge;

pub const TOKEN_2022_PROGRAM_ID: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

#[derive(Accounts)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8      // discriminator
            + 32       // creator pubkey
            + 1        // is_active
            + 8        // reward
            + 8        // participation_fee
            + 8        // voting_fee
            + 8        // challenge_treasury
            + 8        // voting_treasury
            + 33       // winner option
            + 8        // total_votes
            + 8        // winning_votes
            + 32       // reward_token_mint
    )]
    pub challenge: Account<'info, Challenge>,
    /// CHECK: This is the program account that will receive the creation fee
    #[account(mut)]
    pub program_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    
    // Use Token-2022 program address
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Token mint using Token-2022 
    pub token_mint: AccountInfo<'info>,
    
    /// CHECK: Creator's token account - only needed for reference, no transfer occurs
    pub creator_token_account: AccountInfo<'info>,
    
    /// CHECK: Challenge's token account - only needed for reference, will be funded by participants
    pub challenge_token_account: AccountInfo<'info>,
}

pub fn handle(
    ctx: Context<CreateChallenge>,
    reward: u64,
    participation_fee: u64,
    voting_fee: u64
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Fixed creation fee of 0.002 SOL
    let creation_fee = 2_000_000; // 0.002 SOL in lamports
    
    // Transfer SOL creation fee to program treasury
    let ix = system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.program_account.key(),
        creation_fee
    );
    
    solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.program_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    
    // Initialize challenge state
    challenge.creator = *ctx.accounts.user.key;
    challenge.is_active = true;
    challenge.reward = reward;
    challenge.participation_fee = participation_fee;
    challenge.voting_fee = voting_fee;
    challenge.challenge_treasury = 0; // Start at 0, will be funded by participants
    challenge.voting_treasury = 0;
    challenge.winner = None;
    challenge.total_votes = 0;
    challenge.winning_votes = 0;
    challenge.reward_token_mint = ctx.accounts.token_mint.key();
    
    Ok(())
}