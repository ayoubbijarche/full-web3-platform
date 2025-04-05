use anchor_lang::prelude::*;

pub mod instructions;
use instructions::*;
use instructions::token::*;
use instructions::challenge::*;

declare_id!("85BWkfTtjB7MehWvBa9GEakYfmR414wtGYVePUqBxDCT");

#[program]
pub mod coinpetitive {
    use super::*;

    pub fn init_token(
        ctx: Context<InitToken>,
        metadata: InitTokenParams
    ) -> Result<()> {
        instructions::token::initiate_token(ctx, metadata)
    }
    
    pub fn mint_token(
        ctx: Context<MintTokens>,
        supply: u64,
    ) -> Result<()> {
        instructions::token::mint_tokens(ctx, supply)
    }
    
    pub fn transfer_founder(
        ctx: Context<PartiesTr>,
        amount: u64
    ) -> Result<()> {
        founder_transfer(ctx, amount)
    }

    pub fn transfer_dev(
        ctx: Context<PartiesTr>,
        amount: u64
    ) -> Result<()> {
        dev_transfer(ctx, amount)
    }

    pub fn marketing_transfer(
        ctx: Context<PartiesTr>,
        amount: u64
    ) -> Result<()> {
        do_marketing_transfer(ctx, amount)
    }

    // Updated Challenge Functions
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        reward: u64,
        participation_fee: u64,
        voting_fee: u64,
        max_participants: u8,
        challenge_id: u64  // Add this new parameter
    ) -> Result<()> {
        instructions::challenge::create_challenge(
            ctx,
            reward,
            participation_fee,
            voting_fee,
            max_participants,
            challenge_id
        )
    }

    pub fn pay_participation_fee(
        ctx: Context<PayParticipationFee>
    ) -> Result<()> {
        instructions::challenge::pay_participation_fee(ctx)
    }

    pub fn vote_for_submission(
        ctx: Context<VoteForSubmission>
    ) -> Result<()> {
        instructions::challenge::vote_for_submission(ctx)
    }

    pub fn finalize_challenge(
        ctx: Context<FinalizeChallenge>,
        winner_pubkey: Pubkey,
        winning_votes: u64
    ) -> Result<()> {
        instructions::challenge::finalize_challenge(
            ctx, 
            winner_pubkey,
            winning_votes
        )
    }
    
    pub fn submit_video(
        ctx: Context<SubmitVideo>,
        video_url: String
    ) -> Result<()> {
        instructions::challenge::submit_video(ctx, video_url)
    }
    
    pub fn distribute_voting_treasury(
        ctx: Context<DistributeVotingTreasury>,
        voter: Pubkey,
        voter_index: u64
    ) -> Result<()> {
        instructions::challenge::distribute_voting_treasury(ctx, voter, voter_index)
    }
    
    // Note: The following functions are removed as they're
    // no longer needed with our simplified approach:
    // - join_challenge
    // - submit_video
    // - vote_for_video
}

