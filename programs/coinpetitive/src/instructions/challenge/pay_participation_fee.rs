use anchor_lang::prelude::*;
use anchor_lang::solana_program;
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
        constraint = challenge.reward_token_mint.to_string() == CPT_TOKEN_MINT @ ErrorCode::InvalidTokenMint
    )]
    pub challenge: Account<'info, Challenge>,
    
    /// CHECK: Treasury account (PDA)
    #[account(
        mut,
        // No constraint needed as we'll check programmatically in handle function
    )]
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
    
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<PayParticipationFee>) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let participant_key = ctx.accounts.participant.key();
    
    // Verify treasury account matches the one stored in the challenge
    require!(
        ctx.accounts.treasury.key() == challenge.treasury,
        ErrorCode::InvalidTreasury
    );
    
    // Check if participant has already paid
    require!(
        !challenge.has_participant(&participant_key),
        ErrorCode::AlreadyParticipated
    );
    
    // Check max participants only if it's set
    if challenge.max_participants > 0 {
        require!(
            challenge.participants.len() < challenge.max_participants as usize,
            ErrorCode::MaxParticipantsReached
        );
    }
    
    // Log information for debugging
    msg!("Paying participation fee: {} tokens", challenge.participation_fee);
    msg!("From participant: {}", participant_key);
    msg!("To treasury: {}", challenge.treasury);
    
    // Create a Token-2022 Transfer instruction
    let transfer_ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(ctx.accounts.participant_token_account.key(), false),
            solana_program::instruction::AccountMeta::new(ctx.accounts.treasury_token_account.key(), false),
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
            ctx.accounts.treasury_token_account.to_account_info(),
            ctx.accounts.participant.to_account_info(),
        ],
    )?;
    
    // Update challenge treasury
    challenge.challenge_treasury += challenge.participation_fee;
    
    // Add participant to the list
    challenge.participants.push(participant_key);
    
    msg!("Participation fee paid successfully");
    msg!("Participant {} added to challenge", participant_key);
    
    Ok(())
}