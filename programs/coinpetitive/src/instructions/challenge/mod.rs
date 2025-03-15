pub mod types;
pub mod errors;
pub mod create_challenge;
pub mod pay_participation_fee;
pub mod submit_video;
pub mod vote_for_submission;
pub mod finalize_challenge;
use anchor_lang::prelude::*;
pub use types::*;
pub use errors::*;
pub use create_challenge::*;
pub use pay_participation_fee::*;
pub use submit_video::*;
pub use vote_for_submission::*;
pub use finalize_challenge::*;

// Re-export the handler functions with clear names
pub fn create_challenge(
    ctx: Context<CreateChallenge>,
    reward: u64,
    participation_fee: u64,
    voting_fee: u64
) -> Result<()> {
    create_challenge::handle(ctx, reward, participation_fee, voting_fee)
}

pub fn pay_participation_fee(ctx: Context<PayParticipationFee>) -> Result<()> {
    pay_participation_fee::handle(ctx)
}

pub fn submit_video(ctx: Context<SubmitVideo>, video_url: String) -> Result<()> {
    submit_video::handle(ctx, video_url)
}

pub fn vote_for_submission(ctx: Context<VoteForSubmission>) -> Result<()> {
    vote_for_submission::handle(ctx)
}

pub fn finalize_challenge(
    ctx: Context<FinalizeChallenge>,
    winner_pubkey: Pubkey,
    winning_votes: u64
) -> Result<()> {
    finalize_challenge::handle(ctx, winner_pubkey, winning_votes)
}