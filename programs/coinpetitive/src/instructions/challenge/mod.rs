pub mod types;
pub mod errors;
pub mod create_challenge;
pub mod pay_participation_fee;
pub mod submit_video;
pub mod vote_for_submission;
pub mod finalize_challenge;
pub mod distribute_voting_treasury;
pub mod claim_creator_reward;
use anchor_lang::prelude::*;
pub use types::*;
pub use errors::*;
pub use create_challenge::*;
pub use pay_participation_fee::*;
pub use submit_video::*;
pub use vote_for_submission::*;
pub use finalize_challenge::*;
pub use distribute_voting_treasury::*;
pub use claim_creator_reward::*;
pub mod challenge_tracking;



// Re-export the handler functions with clear names
pub fn create_challenge(
    ctx: Context<CreateChallenge>,
    reward: u64,
    participation_fee: u64,
    voting_fee: u64,
    max_participants: u8,
    _challenge_id: u64
) -> Result<()> {
    create_challenge::handle(ctx, reward, participation_fee, voting_fee , max_participants , _challenge_id)
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
    finalize_challenge::handle(ctx)
}

// Add this function
pub fn distribute_voting_treasury(
    ctx: Context<DistributeVotingTreasury>,
    voter: Pubkey,
    voter_index: u64
) -> Result<()> {
    distribute_voting_treasury::handle(ctx, voter, voter_index)
}

pub fn claim_creator_reward(ctx: Context<ClaimCreatorReward>) -> Result<()> {
    claim_creator_reward::handle(ctx)
}