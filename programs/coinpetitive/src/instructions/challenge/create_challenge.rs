use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self, system_instruction};
use crate::instructions::challenge::types::Challenge;

pub const TOKEN_2022_PROGRAM_ID: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const ASSOCIATED_TOKEN_PROGRAM_ID: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

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
            + 1        // max_participants field (u8)
            + 4        // vector length overhead
            + (32 * 50) // space for up to 50 participants (32 bytes per pubkey)
    )]
    pub challenge: Account<'info, Challenge>,
    /// CHECK: This is the program account that will receive the creation fee
    #[account(mut)]
    pub program_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Token mint using Token-2022 
    #[account(address = CPT_TOKEN_MINT.parse::<Pubkey>().unwrap())]
    pub token_mint: AccountInfo<'info>,
    
    /// CHECK: Creator's token account - only needed for reference
    pub creator_token_account: AccountInfo<'info>,
    
    /// CHECK: Challenge's token account - created during this transaction
    #[account(mut)]
    pub challenge_token_account: AccountInfo<'info>,

    /// CHECK: Associated Token Program
    #[account(address = ASSOCIATED_TOKEN_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub associated_token_program: AccountInfo<'info>,
}

pub fn handle(
    ctx: Context<CreateChallenge>,
    reward: u64,
    participation_fee: u64,
    voting_fee: u64,
    max_participants: u8 
) -> Result<()> {
    // Fixed creation fee of 0.002 SOL
    let creation_fee = 2_000_000; // 0.002 SOL in lamports
    
    // Transfer SOL creation fee to program treasury
    msg!("Transferring {} lamports to treasury", creation_fee);
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
    
    // Create ATA for challenge using proper ATA instruction
    msg!("Creating associated token account for challenge");
    
    // This is the format used by the Associated Token Program
    let create_ata_ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.associated_token_program.key(),
        accounts: vec![
            // This needs to be in the exact order expected by the ATA program:
            solana_program::instruction::AccountMeta::new(ctx.accounts.user.key(), true),            // Payer (must sign)
            solana_program::instruction::AccountMeta::new(ctx.accounts.challenge_token_account.key(), false), // ATA address
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.challenge.key(), false),      // Owner
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.token_mint.key(), false),     // Mint
            solana_program::instruction::AccountMeta::new_readonly(solana_program::system_program::ID, false), // System program
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),   // Token program
        ],
        // The ATA program expects no instruction data
        data: vec![],
    };
    
    // Invoke the instruction with all required accounts
    solana_program::program::invoke(
        &create_ata_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.challenge_token_account.to_account_info(),
            ctx.accounts.challenge.to_account_info(),
            ctx.accounts.token_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
    )?;
    
    msg!("Associated token account created");
    
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
    
    // Set max_participants with a reasonable default if zero
    challenge.max_participants = if max_participants == 0 { 50 } else { max_participants };
    
    Ok(())
}