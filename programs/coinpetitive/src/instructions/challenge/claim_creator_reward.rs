use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

#[derive(Accounts)]
pub struct ClaimCreatorReward<'info> {
    // The creator must be the signer
    #[account(mut)]
    pub creator: Signer<'info>,
    
    // The challenge account - verify it's finalized and creator is correct
    #[account(
        mut,
        constraint = !challenge.is_active @ ErrorCode::ChallengeStillActive,
        constraint = challenge.creator == creator.key() @ ErrorCode::InvalidCreator
    )]
    pub challenge: Account<'info, Challenge>,
    
    // Token accounts
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Main treasury PDA - verified in handler
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: Treasury's token account
    #[account(mut)]
    pub treasury_token_account: AccountInfo<'info>,
    
    /// CHECK: Creator's token account
    #[account(mut)]
    pub creator_token_account: AccountInfo<'info>,
    
    // System program
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<ClaimCreatorReward>) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    
    // Verify treasury matches the one stored in the challenge
    require!(
        ctx.accounts.treasury.key() == challenge.treasury,
        ErrorCode::InvalidTreasury
    );
    
    // Get all account infos first to prevent double borrowing
    let treasury_token_account = ctx.accounts.treasury_token_account.to_account_info();
    let creator_token_account = ctx.accounts.creator_token_account.to_account_info();
    let treasury = ctx.accounts.treasury.to_account_info();
    let token_program = ctx.accounts.token_program.to_account_info();
    
    // Get the actual treasury token balance
    let treasury_token_account_data = treasury_token_account.try_borrow_data()?;
    
    // The amount is at bytes 64-71 in token account data (spl_token layout)
    let mut amount_bytes = [0u8; 8];
    amount_bytes.copy_from_slice(&treasury_token_account_data[64..72]);
    let actual_treasury_balance = u64::from_le_bytes(amount_bytes);
    
    // Important: Drop the borrow before proceeding
    drop(treasury_token_account_data);
    
    msg!("Actual treasury token balance: {}", actual_treasury_balance);
    
    // Only continue if there's actually a balance to claim
    if actual_treasury_balance == 0 {
        msg!("No tokens to claim");
        return Ok(());
    }
    
    // Get bump seeds for treasury PDA to sign transaction
    let challenge_pubkey = challenge.key();
    let (_, bump) = Pubkey::find_program_address(
        &[b"treasury", challenge_pubkey.as_ref()],
        ctx.program_id
    );
    
    let treasury_seeds = &[
        b"treasury", 
        challenge_pubkey.as_ref(), 
        &[bump]
    ];
    
    // Transfer all remaining tokens to creator
    msg!("Transferring remaining {} tokens from treasury to creator", actual_treasury_balance);
    
    let creator_transfer_ix = solana_program::instruction::Instruction {
        program_id: token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(treasury_token_account.key(), false),
            solana_program::instruction::AccountMeta::new(creator_token_account.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(treasury.key(), true),
        ],
        data: [3].into_iter() // Token instruction 3 = Transfer
            .chain(actual_treasury_balance.to_le_bytes().into_iter())
            .collect(),
    };
    
    // Execute the transfer - reuse the account infos we got earlier
    solana_program::program::invoke_signed(
        &creator_transfer_ix,
        &[
            treasury_token_account,
            creator_token_account,
            treasury,
        ],
        &[treasury_seeds],
    )?;
    
    msg!("Transferred {} tokens to creator", actual_treasury_balance);
    
    Ok(())
}