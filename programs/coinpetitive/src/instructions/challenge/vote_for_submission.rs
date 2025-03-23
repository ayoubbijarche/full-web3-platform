use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Constants for clarity
pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

#[derive(Accounts)]
pub struct VoteForSubmission<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(
        mut, 
        constraint = challenge.is_active @ ErrorCode::ChallengeNotActive
    )]
    pub challenge: Account<'info, Challenge>,
    
    /// CHECK: Treasury account (PDA) - verified in the handler
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    // Token accounts
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Voter's token account
    #[account(mut)]
    pub voter_token_account: AccountInfo<'info>,
    
    /// CHECK: Treasury's token account
    #[account(mut)]
    pub treasury_token_account: AccountInfo<'info>,
    
    /// CHECK: Just storing submission ID for reference
    pub submission_id: AccountInfo<'info>,

    /// CHECK: Voting Treasury account (PDA)
    #[account(mut)]
    pub voting_treasury: AccountInfo<'info>,
    
    /// CHECK: Voting Treasury's token account
    #[account(mut)]
    pub voting_treasury_token_account: AccountInfo<'info>,
}

pub fn handle(ctx: Context<VoteForSubmission>) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let voter = ctx.accounts.voter.key();
    let submission_id = ctx.accounts.submission_id.key();
    
    // Add a check for maximum voters
    require!(
        challenge.voters.len() < 150, // Set a reasonable limit based on your space allocation
        ErrorCode::MaxVotersReached // Add this new error
    );
    
    // Verify treasury account matches the one stored in the challenge
    require!(
        ctx.accounts.treasury.key() == challenge.treasury,
        ErrorCode::InvalidTreasury
    );

    // Verify voting treasury account matches the one stored in the challenge
    require!(
        ctx.accounts.voting_treasury.key() == challenge.voting_treasury_pda,
        ErrorCode::InvalidVotingTreasury
    );
    
    // Check if voter has already voted for this submission
    if challenge.has_voted_for(&voter, &submission_id) {
        return Err(ErrorCode::AlreadyVoted.into());
    }
    
    // Create a Token-2022 Transfer instruction - CORRECT IMPLEMENTATION
    let transfer_ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(ctx.accounts.voter_token_account.key(), false),
            solana_program::instruction::AccountMeta::new(ctx.accounts.voting_treasury_token_account.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.voter.key(), true),
        ],
        // Token instruction 3 = Transfer, followed by amount as little-endian bytes
        data: [3].into_iter()
              .chain(challenge.voting_fee.to_le_bytes().into_iter())
              .collect(),
    };
    
    // Execute the transfer with the correct accounts
    solana_program::program::invoke(
        &transfer_ix,
        &[
            ctx.accounts.voter_token_account.to_account_info(),
            ctx.accounts.voting_treasury_token_account.to_account_info(),
            ctx.accounts.voter.to_account_info(),
        ],
    )?;
    
    // Update voting treasury and total votes
    challenge.voting_treasury += challenge.voting_fee;
    challenge.total_votes += 1;
    
    // This correctly adds/updates the submission vote
    challenge.add_vote(voter, submission_id)?;
    
    msg!("Vote recorded for submission {}", submission_id);
    
    Ok(())
}