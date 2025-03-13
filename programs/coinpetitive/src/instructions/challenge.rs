use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self, system_instruction};
use std::str::FromStr;

#[account]
pub struct Challenge {
    pub creator: Pubkey,
    pub video_submissions: Vec<VideoSubmission>,
    pub is_active: bool,
    pub winner: Option<Pubkey>,
    pub registration_fee: u64,
    pub submission_fee: u64,
    pub voting_fee: u64,
    pub reward: u64,
    pub total_votes: u64,
    pub voting_treasury: u64,  // Add this field for voting treasury
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VideoSubmission {
    pub participant: Pubkey,
    pub vote_count: u64,
    pub voters: Vec<Pubkey>,
    pub video_url: String,
}

#[derive(Accounts)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8      // discriminator
            + 32       // creator pubkey
            + 4 + (340 * 10)  // video submissions vec (max 10)
            + 1        // is_active
            + 33       // winner option
            + 8        // registration_fee
            + 8        // submission_fee
            + 8        // voting_fee
            + 8        // reward
            + 8        // total_votes
            + 8        // voting_treasury
    )]
    pub challenge: Account<'info, Challenge>,
    /// CHECK: This is the program account that will receive the creation fee
    #[account(mut)]
    pub program_account: AccountInfo<'info>,
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
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteForVideo<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    /// CHECK: This is the creator of the challenge
    #[account(mut)]
    pub creator: AccountInfo<'info>,
    #[account(
        mut,
        has_one = creator @ ErrorCode::InvalidCreator,
    )]
    pub challenge: Account<'info, Challenge>,
    pub system_program: Program<'info, System>,
}

pub fn create_challenge(
    ctx: Context<CreateChallenge>, 
    reward: u64,
    registration_fee: u64,
    submission_fee: u64,
    voting_fee: u64
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Transfer 0.002 SOL (2_000_000 lamports) from creator to program account
    let creation_fee = 2_000_000;
    let ix = system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.program_account.key(),
        creation_fee
    );
    
    solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.program_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Initialize challenge state
    challenge.creator = *ctx.accounts.user.key;
    challenge.reward = reward;
    challenge.video_submissions = Vec::new();
    challenge.is_active = true;
    challenge.winner = None;
    challenge.registration_fee = registration_fee;
    challenge.submission_fee = submission_fee;
    challenge.voting_fee = voting_fee;
    challenge.total_votes = 0;
    challenge.voting_treasury = 0;

    Ok(())
}

pub fn join_challenge(ctx: Context<JoinChallenge>) -> Result<()> {
    require!(ctx.accounts.challenge.is_active, ErrorCode::ChallengeNotActive);
    
    // Only check if they've already joined through video submissions
    require!(
        !ctx.accounts.challenge.video_submissions.iter().any(|s| s.participant == *ctx.accounts.user.key),
        ErrorCode::AlreadyJoined
    );

    // Transfer registration fee
    let ix = system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.challenge.key(),
        ctx.accounts.challenge.registration_fee
    );
    
    solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.challenge.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    Ok(())
}

pub fn submit_video(ctx: Context<SubmitVideo>, video_url: String) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let participant = ctx.accounts.participant.key();
    let submission_fee = challenge.submission_fee;

    // Check if participant has already submitted
    require!(
        !challenge.video_submissions.iter().any(|s| s.participant == participant),
        ErrorCode::AlreadySubmitted
    );

    // Transfer submission fee
    let ix = system_instruction::transfer(
        &ctx.accounts.participant.key(),
        &challenge.key(),
        submission_fee
    );
    
    solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.participant.to_account_info(),
            challenge.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Add submission with video URL
    challenge.video_submissions.push(VideoSubmission {
        participant,
        vote_count: 0,
        voters: Vec::new(),
        video_url,
    });

    Ok(())
}

pub fn vote_for_video(ctx: Context<VoteForVideo>, submission_index: u64) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    
    // Validate submission index
    require!(
        submission_index < challenge.video_submissions.len() as u64,
        ErrorCode::InvalidSubmissionIndex
    );

    let voting_fee = challenge.voting_fee;
    let voter = ctx.accounts.voter.key();

    // Check if voter has already voted
    require!(
        !challenge.video_submissions[submission_index as usize]
            .voters
            .contains(&voter),
        ErrorCode::AlreadyVoted
    );

    // Transfer voting fee to challenge account
    let ix = system_instruction::transfer(
        &ctx.accounts.voter.key(),
        &challenge.key(),
        voting_fee
    );
    
    solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.voter.to_account_info(),
            challenge.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Update total votes and treasury first
    challenge.total_votes += 1;
    challenge.voting_treasury += voting_fee;

    // Store total votes before mutable borrow
    let total_votes = challenge.total_votes;

    // Update submission vote count and add voter
    let submission = &mut challenge.video_submissions[submission_index as usize];
    submission.vote_count += 1;
    submission.voters.push(voter);

    // Check if this submission is now the winner
    if submission.vote_count > total_votes / 2 {
        challenge.winner = Some(submission.participant);
        challenge.is_active = false;
    }

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
    #[msg("User has already voted for this submission")]
    AlreadyVoted,
    #[msg("Invalid creator")]
    InvalidCreator,
    #[msg("User has already submitted a video")]
    AlreadySubmitted,
}



