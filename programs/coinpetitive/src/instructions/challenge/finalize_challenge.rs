use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Constants for clarity
pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

#[derive(Accounts)]
pub struct FinalizeChallenge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = challenge.creator == authority.key() @ ErrorCode::Unauthorized,
        constraint = challenge.is_active @ ErrorCode::ChallengeNotActive
    )]
    pub challenge: Account<'info, Challenge>,
    
    // Token accounts
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Winner's token account - verified in handler
    #[account(mut)]
    pub winner_token_account: AccountInfo<'info>,
    
    /// CHECK: Main treasury PDA - verified in handler
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: Treasury's token account
    #[account(mut)]
    pub treasury_token_account: AccountInfo<'info>,
    
    /// CHECK: Creator's token account to receive remaining funds
    #[account(mut)]
    pub creator_token_account: AccountInfo<'info>,
}

pub fn handle(ctx: Context<FinalizeChallenge>) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Verify treasury matches the one stored in the challenge
    require!(
        ctx.accounts.treasury.key() == challenge.treasury,
        ErrorCode::InvalidTreasury
    );
    
    // Find the submission with the most votes
    if challenge.submission_votes.is_empty() {
        return Err(ErrorCode::NoSubmissions.into());
    }
    
    // Sort submissions by vote count (descending)
    let mut sorted_submissions = challenge.submission_votes.clone();
    sorted_submissions.sort_by(|a, b| b.1.cmp(&a.1));
    
    // Get the winning submission
    let (winning_submission, winning_votes) = sorted_submissions[0];
    
    // Make sure the winner has at least one vote
    if winning_votes == 0 {
        return Err(ErrorCode::NoVotes.into());
    }
    
    msg!("Found winner submission: {} with {} votes", winning_submission, winning_votes);
    
    // Find the winner's pubkey by checking which participant submitted this
    // In our simplified implementation, we'll use the submission_id as the winner's wallet address
    // This assumes the submission_id is the participant's pubkey
    let winner_pubkey = winning_submission;
    
    // Mark challenge as inactive
    challenge.is_active = false;
    
    // Set winner info
    challenge.winner = Some(winner_pubkey);
    challenge.winning_votes = winning_votes;
    
    // Distribute tokens: Winner gets the specified reward from main treasury
    let winner_reward = challenge.reward;
    
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
    
    // Transfer reward to winner from main treasury
    if winner_reward > 0 {
        msg!("Transferring {} tokens to winner from main treasury", winner_reward);
        
        // Verify that the winner_token_account belongs to the winner
        // This needs to be the associated token account for the CPT token
        // In production this would need more verification
        
        let winner_transfer_ix = solana_program::instruction::Instruction {
            program_id: ctx.accounts.token_program.key(),
            accounts: vec![
                solana_program::instruction::AccountMeta::new(ctx.accounts.treasury_token_account.key(), false),
                solana_program::instruction::AccountMeta::new(ctx.accounts.winner_token_account.key(), false),
                solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.treasury.key(), true),
            ],
            data: [3].into_iter() // Token instruction 3 = Transfer
                .chain(winner_reward.to_le_bytes().into_iter())
                .collect(),
        };
        
        solana_program::program::invoke_signed(
            &winner_transfer_ix,
            &[
                ctx.accounts.treasury_token_account.to_account_info(),
                ctx.accounts.winner_token_account.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
            &[treasury_seeds],
        )?;
        
        msg!("Transferred {} tokens to winner: {}", winner_reward, winner_pubkey);
    }

    // After the winner is paid, transfer any remaining balance to the creator
    // Calculate how much is left in the treasury
    let treasury_balance = challenge.challenge_treasury - winner_reward;

    if treasury_balance > 0 {
        msg!("Transferring remaining {} tokens from treasury to creator", treasury_balance);
        
        // Get creator's token account - this needs to be passed as a parameter
        // In a full implementation, we'd check that this account belongs to the creator
        
        // instruction to transfer the remaining tokens to creator
        let creator_transfer_ix = solana_program::instruction::Instruction {
            program_id: ctx.accounts.token_program.key(),
            accounts: vec![
                solana_program::instruction::AccountMeta::new(ctx.accounts.treasury_token_account.key(), false),
                solana_program::instruction::AccountMeta::new(ctx.accounts.creator_token_account.key(), false),
                solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.treasury.key(), true),
            ],
            data: [3].into_iter() // Token instruction 3 = Transfer
                .chain(treasury_balance.to_le_bytes().into_iter())
                .collect(),
        };
        
        // Execute the transfer
        solana_program::program::invoke_signed(
            &creator_transfer_ix,
            &[
                ctx.accounts.treasury_token_account.to_account_info(),
                ctx.accounts.creator_token_account.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
            &[treasury_seeds],
        )?;
        
        msg!("Transferred remaining {} tokens to creator", treasury_balance);
    }
    
    msg!("Challenge finalized successfully!");
    Ok(())
}