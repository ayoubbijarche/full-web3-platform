use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::TokenAccount;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Constants for clarity
pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

#[derive(Accounts)]
pub struct PayParticipationFee<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    
    #[account(
        mut, 
        constraint = challenge.is_active @ ErrorCode::ChallengeNotActive,
        constraint = challenge.reward_token_mint.to_string() == CPT_TOKEN_MINT @ ErrorCode::InvalidTokenMint,
        // Remove the max participants check
        // constraint = !challenge.has_participant(&participant.key()) @ ErrorCode::AlreadyParticipating
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
    
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<PayParticipationFee>) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let participant_key = ctx.accounts.participant.key();
    

    
    // Log information for debugging
    msg!("Paying participation fee: {} tokens", challenge.participation_fee);
    msg!("From participant: {}", participant_key);
    msg!("To challenge account: {}", challenge.key());
    
    // Create a Token-2022 Transfer instruction
    let transfer_ix = solana_program::instruction::Instruction {
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
        &transfer_ix,
        &[
            ctx.accounts.participant_token_account.to_account_info(),
            ctx.accounts.challenge_token_account.to_account_info(),
            ctx.accounts.participant.to_account_info(),
        ],
    )?;
    
    // Update challenge treasury
    challenge.challenge_treasury += challenge.participation_fee;
    
    // Add participant WITHOUT checking max participants
    challenge.participants.push(participant_key);
    
    msg!("Participation fee paid successfully");
    msg!("Participant {} added to challenge", participant_key);
    
    Ok(())
}