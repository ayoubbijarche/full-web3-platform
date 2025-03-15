use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Transfer, Token, TokenAccount};
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

#[derive(Accounts)]
pub struct FinalizeChallenge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    
    // Token accounts
    pub token_program: Program<'info, Token>,
    
    /// CHECK: Verified in the handler as the winner
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    #[account(
        mut,
        constraint = winner_token_account.mint == challenge.reward_token_mint
    )]
    pub winner_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: For winning voters
    #[account(mut)] 
    pub winning_voters_treasury: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = creator_token_account.mint == challenge.reward_token_mint
    )]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = challenge_token_account.mint == challenge.reward_token_mint
    )]
    pub challenge_token_account: Account<'info, TokenAccount>,
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
    
    // Transfer reward to winner
    let winner_transfer_accounts = Transfer {
        from: ctx.accounts.challenge_token_account.to_account_info(),
        to: ctx.accounts.winner_token_account.to_account_info(),
        authority: challenge.to_account_info(),
    };
    
    let winner_transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        winner_transfer_accounts
    ).with_signer(seeds);
    
    transfer(winner_transfer_ctx, winner_reward)?;
    
    // Transfer voting rewards to winning voters treasury 
    if winning_voters_reward > 0 {
        let voting_transfer_accounts = Transfer {
            from: ctx.accounts.challenge_token_account.to_account_info(),
            to: ctx.accounts.winning_voters_treasury.to_account_info(),
            authority: challenge.to_account_info(),
        };
        
        let voting_transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            voting_transfer_accounts
        ).with_signer(seeds);
        
        transfer(voting_transfer_ctx, winning_voters_reward)?;
    }
    
    // Transfer remaining to creator
    if creator_amount > 0 {
        let creator_transfer_accounts = Transfer {
            from: ctx.accounts.challenge_token_account.to_account_info(),
            to: ctx.accounts.creator_token_account.to_account_info(),
            authority: challenge.to_account_info(),
        };
        
        let creator_transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            creator_transfer_accounts
        ).with_signer(seeds);
        
        transfer(creator_transfer_ctx, creator_amount)?;
    }
    
    Ok(())
}