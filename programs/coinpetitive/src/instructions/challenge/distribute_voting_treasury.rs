use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use crate::instructions::challenge::types::Challenge;
use crate::instructions::challenge::errors::ErrorCode;

// Constants for clarity
pub const TOKEN_2022_PROGRAM_ID_STR: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const CPT_TOKEN_MINT: &str = "mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9";

#[derive(Accounts)]
pub struct DistributeVotingTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        // Remove this constraint to allow anyone to distribute rewards:
        // constraint = challenge.creator == authority.key() @ ErrorCode::Unauthorized,
    )]
    pub challenge: Account<'info, Challenge>,
    
    // Token accounts
    /// CHECK: Token-2022 program
    #[account(address = TOKEN_2022_PROGRAM_ID_STR.parse::<Pubkey>().unwrap())]
    pub token_program: AccountInfo<'info>,
    
    /// CHECK: Voting Treasury PDA - verified in handler
    #[account(mut)]
    pub voting_treasury: AccountInfo<'info>,
    
    /// CHECK: Voting Treasury's token account
    #[account(mut)]
    pub voting_treasury_token_account: AccountInfo<'info>,
    
    /// CHECK: Voter's token account to receive reward
    #[account(mut)]
    pub voter_token_account: AccountInfo<'info>,
}

pub fn handle(ctx: Context<DistributeVotingTreasury>, voter: Pubkey, winning_voters_count: u64) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    
    // Verify voting treasury matches the one stored in the challenge
    require!(
        ctx.accounts.voting_treasury.key() == challenge.voting_treasury_pda,
        ErrorCode::InvalidVotingTreasury
    );
    
    // Find the winning submission from the finalized challenge
    let winning_submission = challenge.winner.ok_or(ErrorCode::ChallengeStillActive)?;
    
    // Check if this voter voted for the winning submission
    let voted_for_winner = challenge.voters
        .iter()
        .any(|(v, s)| *v == voter && *s == winning_submission);
    
    require!(voted_for_winner, ErrorCode::VoterDidNotVoteForWinner);
    
    // Validate the winning voters count
    require!(winning_voters_count > 0, ErrorCode::InvalidVoteCount);
    
    // Calculate this voter's reward using the count provided from PocketBase
    let reward_per_voter = challenge.voting_treasury / winning_voters_count;
    
    // Make sure there's a reward to distribute
    require!(reward_per_voter > 0, ErrorCode::NoRewardToDistribute);
    
    // Get bump seeds for voting treasury PDA to sign transaction
    let challenge_pubkey = challenge.key();
    let (_, bump) = Pubkey::find_program_address(
        &[b"voting_treasury", challenge_pubkey.as_ref()],
        ctx.program_id
    );
    
    let voting_treasury_seeds = &[
        b"voting_treasury", 
        challenge_pubkey.as_ref(), 
        &[bump]
    ];
    
    // Transfer reward to voter from voting treasury
    msg!("Transferring {} tokens to voter {} from voting treasury", reward_per_voter, voter);
    
    // Verify that the voter_token_account belongs to the voter
    // In production this would need more verification
    
    let voter_transfer_ix = solana_program::instruction::Instruction {
        program_id: ctx.accounts.token_program.key(),
        accounts: vec![
            solana_program::instruction::AccountMeta::new(ctx.accounts.voting_treasury_token_account.key(), false),
            solana_program::instruction::AccountMeta::new(ctx.accounts.voter_token_account.key(), false),
            solana_program::instruction::AccountMeta::new_readonly(ctx.accounts.voting_treasury.key(), true),
        ],
        data: [3].into_iter() // Token instruction 3 = Transfer
            .chain(reward_per_voter.to_le_bytes().into_iter())
            .collect(),
    };
    
    solana_program::program::invoke_signed(
        &voter_transfer_ix,
        &[
            ctx.accounts.voting_treasury_token_account.to_account_info(),
            ctx.accounts.voter_token_account.to_account_info(),
            ctx.accounts.voting_treasury.to_account_info(),
        ],
        &[voting_treasury_seeds],
    )?;
    
    msg!("Transferred {} tokens to voter: {}", reward_per_voter, voter);
    
    Ok(())
}