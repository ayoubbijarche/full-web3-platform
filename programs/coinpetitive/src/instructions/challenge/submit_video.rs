use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Define Token-2022 program ID constant
pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

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
        constraint = challenge.is_active @ ErrorCode::ChallengeNotActive,
        constraint = challenge.reward_token_mint.to_string() == CPT_TOKEN_MINT @ ErrorCode::InvalidTokenMint
    )]
    pub challenge: Account<'info, Challenge>,
    
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Participant's token account
    #[account(mut)]
    pub participant_token_account: AccountInfo<'info>,
    
    /// CHECK: Challenge's token account
    #[account(mut)]
    pub challenge_token_account: AccountInfo<'info>,
    
    /// CHECK: This is a unique reference for the video
    pub video_reference: AccountInfo<'info>,
}

pub fn handle(ctx: Context<SubmitVideo>, video_url: String) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    msg!("Submitting video and paying participation fee: {} tokens", challenge.participation_fee);
    msg!("From participant: {}", ctx.accounts.participant.key());
    
    // Create a simplified Transfer instruction manually
    let ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(ctx.accounts.participant_token_account.key(), false),
            solana_program::instruction::AccountMeta::new(ctx.accounts.challenge_token_account.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.participant.key(), true),
        ],
        // Token instruction 3 = Transfer, followed by amount as little-endian bytes
        data: [3].into_iter()
              .chain(challenge.participation_fee.to_le_bytes().into_iter())
              .collect(),
    };
    
    // Execute the transfer
    solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.participant_token_account.to_account_info(),
            ctx.accounts.challenge_token_account.to_account_info(),
            ctx.accounts.participant.to_account_info(),
        ],
    )?;
    
    // Update challenge treasury
    challenge.challenge_treasury += challenge.participation_fee;
    
    msg!("Video submitted and participation fee paid successfully");
    
    Ok(())
}