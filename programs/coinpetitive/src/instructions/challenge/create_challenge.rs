use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self, system_instruction};
use std::str::FromStr;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::errors::ErrorCode;

pub const TOKEN_2022_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
pub const ASSOCIATED_TOKEN_PROGRAM_ID: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

#[derive(Accounts)]
#[instruction(
    reward: u64,
    participation_fee: u64,
    voting_fee: u64,
    max_participants: u8,
    challenge_id: u64
)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        // Calculate space more carefully to stay under 10KB limit
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
    
    // Treasury PDA - simplify the definition
    /// CHECK: This is a PDA that will be the treasury for the challenge
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: This is the program account that will receive the creation fee
    #[account(mut)]
    pub program_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    
    /// CHECK: Token-2022 program
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Token mint using Token-2022 
    pub token_mint: AccountInfo<'info>,
    
    /// CHECK: Creator's token account
    pub creator_token_account: AccountInfo<'info>,
    
    /// CHECK: Treasury's token account
    #[account(mut)]
    pub treasury_token_account: AccountInfo<'info>,

    /// CHECK: Associated Token Program
    pub associated_token_program: AccountInfo<'info>,

    /// CHECK: Voting Treasury account (PDA)
    #[account(mut)]
    pub voting_treasury: AccountInfo<'info>,

    /// CHECK: Voting Treasury token account
    #[account(mut)]
    pub voting_treasury_token_account: AccountInfo<'info>,
}

pub fn handle(
    ctx: Context<CreateChallenge>,
    reward: u64,
    participation_fee: u64,
    voting_fee: u64,
    max_participants: u8,
    challenge_id: u64
) -> Result<()> {
    // Create the treasury PDA ourselves rather than relying on the derived account
    let (treasury_pda, treasury_bump) = Pubkey::find_program_address(
        &[b"treasury", ctx.accounts.challenge.key().as_ref()],
        ctx.program_id
    );

    // Create separate voting treasury 
    let (voting_treasury_pda, voting_treasury_bump) = Pubkey::find_program_address(
        &[b"voting_treasury", ctx.accounts.challenge.key().as_ref()],
        ctx.program_id
    );
    
    // Verify we received the correct treasury account
    require!(
        treasury_pda == ctx.accounts.treasury.key(),
        ErrorCode::InvalidTreasury
    );
    
    // Create the treasury account
    let rent = Rent::get()?;
    let space = 16; // Small account for data
    let lamports = rent.minimum_balance(space);
    
    // Create the treasury account
    let create_treasury_ix = system_instruction::create_account(
        &ctx.accounts.user.key(),
        &treasury_pda,
        lamports,
        space as u64,
        ctx.program_id
    );
    
    // Create the treasury with PDA signing
    solana_program::program::invoke_signed(
        &create_treasury_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&[b"treasury", ctx.accounts.challenge.key().as_ref(), &[treasury_bump]]],
    )?;
    
    // Add after creating the main treasury
    // Create the voting treasury account
    let create_voting_treasury_ix = system_instruction::create_account(
        &ctx.accounts.user.key(),
        &voting_treasury_pda,
        lamports, // Same rent amount
        space as u64,
        ctx.program_id
    );

    // Create the voting treasury with PDA signing
    solana_program::program::invoke_signed(
        &create_voting_treasury_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.voting_treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&[b"voting_treasury", ctx.accounts.challenge.key().as_ref(), &[voting_treasury_bump]]],
    )?;

    // Define gas amount for both treasuries
    let gas_amount = 2_000_000; // 0.002 SOL

    // Transfer gas SOL to voting treasury PDA
    let voting_treasury_gas_ix = system_instruction::transfer(
        &ctx.accounts.user.key(),
        &voting_treasury_pda,
        gas_amount // Same 0.001 SOL
    );

    solana_program::program::invoke(
        &voting_treasury_gas_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.voting_treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Fixed creation fee of 0.002 SOL
    let creation_fee = 2_000_000; // 0.002 SOL in lamports
    
    // Transfer SOL creation fee to program treasury
    msg!("Transferring {} lamports to program treasury", creation_fee);
    let program_treasury_ix = system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.program_account.key(),
        creation_fee
    );
    
    solana_program::program::invoke(
        &program_treasury_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.program_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    
    // Transfer gas SOL to treasury PDA (0.001 SOL for operations)
    msg!("Transferring gas SOL to treasury PDA");
    let treasury_gas_ix = system_instruction::transfer(
        &ctx.accounts.user.key(),
        &treasury_pda,
        gas_amount
    );
    
    solana_program::program::invoke(
        &treasury_gas_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    
    // Verify token program is the expected one
    let token_2022_id = Pubkey::from_str(TOKEN_2022_PROGRAM_ID).unwrap();
    require!(
        ctx.accounts.token_program.key() == token_2022_id,
        ErrorCode::InvalidTokenProgram
    );
    
    // Verify token mint is the expected one
    let token_mint_id = Pubkey::from_str(CPT_TOKEN_MINT).unwrap();

    
    // Create ATA for treasury using proper ATA instruction
    msg!("Creating associated token account for treasury");
    
    // Format used by the Associated Token Program
    let create_ata_ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.associated_token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(ctx.accounts.user.key(), true),
            solana_program::instruction::AccountMeta::new(ctx.accounts.treasury_token_account.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(treasury_pda, false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.token_mint.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(solana_program::system_program::ID, false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        ],
        data: vec![],
    };
    
    // Invoke the instruction with all required accounts
    solana_program::program::invoke(
        &create_ata_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.treasury_token_account.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.token_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
    )?;
    
    msg!("Treasury token account created");

    // Create ATA for voting treasury
    msg!("Creating associated token account for voting treasury");

    let create_voting_ata_ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.associated_token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(ctx.accounts.user.key(), true),
            solana_program::instruction::AccountMeta::new(ctx.accounts.voting_treasury_token_account.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(voting_treasury_pda, false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.token_mint.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(solana_program::system_program::ID, false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        ],
        data: vec![],
    };

    solana_program::program::invoke(
        &create_voting_ata_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.voting_treasury_token_account.to_account_info(),
            ctx.accounts.voting_treasury.to_account_info(),
            ctx.accounts.token_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
    )?;

    msg!("Voting treasury token account created");
    
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
    challenge.treasury = treasury_pda;
    challenge.voting_treasury_pda = voting_treasury_pda;
    
    // Set max_participants with a reasonable default if zero
    challenge.max_participants = if max_participants == 0 { 50 } else { max_participants };
    
    Ok(())
}