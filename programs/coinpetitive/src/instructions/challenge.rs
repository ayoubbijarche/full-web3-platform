use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use std::collections::BTreeMap;

#[account]
pub struct Challenge {
    pub creator: Pubkey,
    pub description: String,
    pub reward: u64,
    pub participants: Vec<Pubkey>,
    pub submissions: Vec<Submission>,
    pub is_active: bool,
    pub winner: Option<Pubkey>,
    pub total_votes: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Submission {
    pub participant: Pubkey,
    pub video_url: String,
    pub votes: u64,
}

#[derive(Accounts)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 200 + 8 + 32 * 50 + 8 + 32 + 1 + 32 + 8
    )]
    pub challenge: Account<'info, Challenge>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitVideo<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
}

#[derive(Accounts)]
pub struct VoteSubmission<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is safe because we only transfer SOL to this account
    #[account(mut)]
    pub program_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_challenge(ctx: Context<CreateChallenge>, description: String, reward: u64) -> Result<()> {
    // First pay the challenge fee
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.challenge.key(),
        2_000_000, // 0.002 SOL fee
    );
    
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.challenge.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Initialize challenge
    let challenge = &mut ctx.accounts.challenge;
    challenge.creator = *ctx.accounts.user.key;
    challenge.description = description;
    challenge.reward = reward;
    challenge.participants = Vec::new();
    challenge.submissions = Vec::new();
    challenge.is_active = true;
    challenge.winner = None;
    challenge.total_votes = 0;

    Ok(())
}

pub fn join_challenge(ctx: Context<JoinChallenge>) -> Result<()> {
    require!(ctx.accounts.challenge.is_active, ErrorCode::ChallengeNotActive);
    
    // Check if user hasn't already joined
    require!(
        !ctx.accounts.challenge.participants.contains(ctx.accounts.user.key),
        ErrorCode::AlreadyJoined
    );

    // Pay participation fee
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.challenge.key(),
        1_000_000, // 0.001 SOL participation fee
    );
    
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.challenge.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    let challenge = &mut ctx.accounts.challenge;
    challenge.participants.push(*ctx.accounts.user.key);
    Ok(())
}

pub fn submit_video(ctx: Context<SubmitVideo>, video_url: String) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    require!(challenge.is_active, ErrorCode::ChallengeNotActive);
    require!(
        challenge.participants.contains(ctx.accounts.participant.key),
        ErrorCode::NotAParticipant
    );

    let submission = Submission {
        participant: *ctx.accounts.participant.key,
        video_url,
        votes: 0,
    };

    challenge.submissions.push(submission);
    Ok(())
}

pub fn vote_submission(ctx: Context<VoteSubmission>, submission_index: u64) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    require!(challenge.is_active, ErrorCode::ChallengeNotActive);
    require!(
        submission_index < challenge.submissions.len() as u64,
        ErrorCode::InvalidSubmissionIndex
    );

    // Pay voting fee
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.voter.key(),
        &challenge.key(),
        500_000, // 0.0005 SOL voting fee
    );
    
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.voter.to_account_info(),
            challenge.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    challenge.submissions[submission_index as usize].votes += 1;
    challenge.total_votes += 1;

    // Check if this submission is now the winner
    let current_votes = challenge.submissions[submission_index as usize].votes;
    let winner_participant = challenge.submissions[submission_index as usize].participant;
    
    if current_votes > challenge.total_votes / 2 {
        challenge.winner = Some(winner_participant);
        challenge.is_active = false;
    }

    Ok(())
}

pub fn pay_challenge(ctx: Context<PayChallenge>) -> Result<()> {
    let amount = 2_000_000; // 0.002 SOL fee
    
    // Transfer SOL from user to program wallet
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.program_wallet.key(),
        amount,
    );
    
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.program_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Challenge is not active")]
    ChallengeNotActive,
    #[msg("User has already joined this challenge")]
    AlreadyJoined,
    #[msg("User is not a participant in this challenge")]
    NotAParticipant,
    #[msg("Invalid submission index")]
    InvalidSubmissionIndex,
}



