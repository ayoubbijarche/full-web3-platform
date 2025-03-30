use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Define Token-2022 program ID constant
pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";
// Add fixed submission fee - 5 tokens with 9 decimals (5 * 10^9)
pub const FIXED_SUBMISSION_FEE: u64 = 5_000_000_000;

// Token instruction enum
#[derive(Clone, Debug)]
pub enum TokenInstruction {
    Transfer = 3,
}

#[derive(Accounts)]
pub struct SubmitVideo<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    
    #[account(
        mut, 
        constraint = challenge.reward_token_mint.to_string() == CPT_TOKEN_MINT @ ErrorCode::InvalidTokenMint
    )]
    pub challenge: Account<'info, Challenge>,
    
    /// CHECK: Treasury account (PDA) - verified in the handler
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Participant's token account
    #[account(mut)]
    pub participant_token_account: AccountInfo<'info>,
    
    /// CHECK: Treasury's token account
    #[account(mut)]
    pub treasury_token_account: AccountInfo<'info>,
    
    /// CHECK: This is a unique reference for the video
    pub video_reference: AccountInfo<'info>,
}

pub fn handle(ctx: Context<SubmitVideo>, video_url: String) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Verify treasury account matches the one stored in the challenge
    require!(
        ctx.accounts.treasury.key() == challenge.treasury,
        ErrorCode::InvalidTreasury
    );
    
    // Use fixed submission fee instead of challenge.participation_fee
    msg!("Submitting video and paying fixed fee: {} tokens", FIXED_SUBMISSION_FEE);
    msg!("From participant: {}", ctx.accounts.participant.key());
    msg!("To treasury: {}", ctx.accounts.treasury.key());
    
    // Create a simplified Transfer instruction manually with FIXED_SUBMISSION_FEE
    let ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(ctx.accounts.participant_token_account.key(), false),
            solana_program::instruction::AccountMeta::new(ctx.accounts.treasury_token_account.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.participant.key(), true),
        ],
        // Token instruction 3 = Transfer, followed by amount as little-endian bytes
        data: [3].into_iter()
              .chain(FIXED_SUBMISSION_FEE.to_le_bytes().into_iter())
              .collect(),
    };
    
    // Execute the transfer
    solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.participant_token_account.to_account_info(),
            ctx.accounts.treasury_token_account.to_account_info(),
            ctx.accounts.participant.to_account_info(),
        ],
    )?;
    
    // Update challenge treasury with fixed fee instead of challenge.participation_fee
    challenge.challenge_treasury += FIXED_SUBMISSION_FEE;
    
    msg!("Video submitted and fixed submission fee of {} paid successfully", FIXED_SUBMISSION_FEE);
    
    // Add video reference and initial votes
    challenge.submission_votes.push((ctx.accounts.video_reference.key(), 0));
    
    Ok(())
}