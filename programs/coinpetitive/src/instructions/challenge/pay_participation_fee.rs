use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;
use crate::instructions::token::TokenState;


pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";


#[derive(Accounts)]
pub struct PayParticipationFee<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    
    #[account(mut)]
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
    
    // Add token_state for tracking fees
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    
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
    
    // After successfully processing the payment, track the fee
    let token_state = &mut ctx.accounts.token_state;
    let fee_amount = challenge.participation_fee;
    
    // Update total entry fees tracked
    token_state.total_entry_fees = token_state.total_entry_fees
        .checked_add(fee_amount)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    
    // Check fee milestones
    if token_state.total_entry_fees >= 50_000_000 {
        token_state.mint_conditions_met[2] = true;
        msg!("Milestone reached: 50M total entry fees paid!");
    }
    
    if token_state.total_entry_fees >= 100_000_000 {
        token_state.mint_conditions_met[3] = true;
        msg!("Milestone reached: 100M total entry fees paid!");
    }
    
    msg!("Entry fee of {} tracked. Total fees: {}", fee_amount, token_state.total_entry_fees);
    
    msg!("Participation fee paid successfully");
    msg!("Participant {} added to challenge", participant_key);
    
    Ok(())
}