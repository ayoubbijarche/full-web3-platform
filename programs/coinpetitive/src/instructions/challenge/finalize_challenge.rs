use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Constants for clarity - same as in vote_for_submission.rs
pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

#[derive(Accounts)]
pub struct FinalizeChallenge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    
    // Token accounts - using AccountInfo like in vote_for_submission
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Verified in the handler as the winner
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    /// CHECK: Winner's token account
    #[account(mut)]
    pub winner_token_account: AccountInfo<'info>,
    
    /// CHECK: For winning voters
    #[account(mut)] 
    pub winning_voters_treasury: AccountInfo<'info>,
    
    /// CHECK: Creator's token account
    #[account(mut)]
    pub creator_token_account: AccountInfo<'info>,
    
    /// CHECK: Challenge's token account
    #[account(mut)]
    pub challenge_token_account: AccountInfo<'info>,
}

pub fn handle(
    ctx: Context<FinalizeChallenge>,
    winner_pubkey: Pubkey,
    winning_votes: u64
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Verify winning_votes makes sense
    require!(winning_votes <= challenge.total_votes, ErrorCode::InvalidVoteCount);
    
    // Verify winner matches the account provided
    require!(winner_pubkey == ctx.accounts.winner.key(), ErrorCode::InvalidWinner);
    
    // Mark challenge as inactive
    challenge.is_active = false;
    
    // Set winner info
    challenge.winner = Some(winner_pubkey);
    challenge.winning_votes = winning_votes;
    
    // Calculate token distribution:
    // 1. Winner gets the specified reward
    // 2. Winning voters split losing voters' fees
    // 3. Creator gets remainder of tokens
    
    let winner_reward = challenge.reward;
    
    // Calculate voting rewards
    let total_voting_fees = challenge.voting_treasury;
    let winning_voters_reward = if winning_votes < challenge.total_votes {
        // Calculate proportion of voting fees that go to winning voters
        // (total_votes - winning_votes) * voting_fee = losing voters' contribution
        (challenge.total_votes - winning_votes) * challenge.voting_fee
    } else {
        0 // If everyone voted for the winner, no redistribution
    };
    
    // Creator gets remaining funds after winner and voting rewards
    let creator_amount = challenge.challenge_treasury
        .saturating_sub(winner_reward)
        .saturating_add(total_voting_fees)
        .saturating_sub(winning_voters_reward);
    
    // PDA seeds for signing
    let (_, bump) = Pubkey::find_program_address(
        &[b"challenge", challenge.to_account_info().key.as_ref()],
        ctx.program_id
    );
    
    // Create seeds array for signing
    let bump_bytes = [bump];
    let challenge_key = challenge.key();
    let challenge_seed = b"challenge";
    let inner = &[challenge_seed, challenge_key.as_ref(), &bump_bytes][..];
    let seeds = &[inner];
    
    // Transfer reward to winner using Token-2022
    if winner_reward > 0 {
        // Create a Token-2022 Transfer instruction
        let winner_transfer_ix = solana_program::instruction::Instruction {
            program_id: ctx.accounts.token_program.key(),
            accounts: vec![
                solana_program::instruction::AccountMeta::new(ctx.accounts.challenge_token_account.key(), false),
                solana_program::instruction::AccountMeta::new(ctx.accounts.winner_token_account.key(), false),
                solana_program::instruction::AccountMeta::new_readonly(challenge.to_account_info().key(), true),
            ],
            // Token instruction 3 = Transfer, followed by amount as little-endian bytes
            data: [3].into_iter()
                .chain(winner_reward.to_le_bytes().into_iter())
                .collect(),
        };
        
        // Execute the transfer with PDA signing
        solana_program::program::invoke_signed(
            &winner_transfer_ix,
            &[
                ctx.accounts.challenge_token_account.to_account_info(),
                ctx.accounts.winner_token_account.to_account_info(),
                challenge.to_account_info(),
            ],
            seeds,
        )?;
        
        msg!("Transferred {} tokens to winner", winner_reward);
    }
    
    // Transfer voting rewards to winning voters treasury 
    if winning_voters_reward > 0 {
        // Create a Token-2022 Transfer instruction
        let voting_transfer_ix = solana_program::instruction::Instruction {
            program_id: ctx.accounts.token_program.key(),
            accounts: vec![
                solana_program::instruction::AccountMeta::new(ctx.accounts.challenge_token_account.key(), false),
                solana_program::instruction::AccountMeta::new(ctx.accounts.winning_voters_treasury.key(), false),
                solana_program::instruction::AccountMeta::new_readonly(challenge.to_account_info().key(), true),
            ],
            // Token instruction 3 = Transfer, followed by amount as little-endian bytes
            data: [3].into_iter()
                .chain(winning_voters_reward.to_le_bytes().into_iter())
                .collect(),
        };
        
        // Execute the transfer with PDA signing
        solana_program::program::invoke_signed(
            &voting_transfer_ix,
            &[
                ctx.accounts.challenge_token_account.to_account_info(),
                ctx.accounts.winning_voters_treasury.to_account_info(),
                challenge.to_account_info(),
            ],
            seeds,
        )?;
        
        msg!("Transferred {} tokens to winning voters treasury", winning_voters_reward);
    }
    
    // Transfer remaining to creator
    if creator_amount > 0 {
        // Create a Token-2022 Transfer instruction
        let creator_transfer_ix = solana_program::instruction::Instruction {
            program_id: ctx.accounts.token_program.key(),
            accounts: vec![
                solana_program::instruction::AccountMeta::new(ctx.accounts.challenge_token_account.key(), false),
                solana_program::instruction::AccountMeta::new(ctx.accounts.creator_token_account.key(), false),
                solana_program::instruction::AccountMeta::new_readonly(challenge.to_account_info().key(), true),
            ],
            // Token instruction 3 = Transfer, followed by amount as little-endian bytes
            data: [3].into_iter()
                .chain(creator_amount.to_le_bytes().into_iter())
                .collect(),
        };
        
        // Execute the transfer with PDA signing
        solana_program::program::invoke_signed(
            &creator_transfer_ix,
            &[
                ctx.accounts.challenge_token_account.to_account_info(),
                ctx.accounts.creator_token_account.to_account_info(),
                challenge.to_account_info(),
            ],
            seeds,
        )?;
        
        msg!("Transferred {} tokens to creator", creator_amount);
    }
    
    Ok(())
}