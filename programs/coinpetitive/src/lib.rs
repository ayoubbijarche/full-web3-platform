use anchor_lang::prelude::*;

pub mod instructions;
use instructions::*;
use instructions::token::*;
use instructions::challenge::*;

declare_id!("7RUA3ry7n4ELZpMA4TwQBMmiHTKEhwSqML5xywM4m2pr");

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

    pub fn create_challenge(
        ctx: Context<CreateChallenge>, 
        reward: u64,
        registration_fee: u64,
        submission_fee: u64,
        voting_fee: u64
    ) -> Result<()> {
        instructions::challenge::create_challenge(
            ctx, 
            voting_fee,
            reward,
            registration_fee,
            submission_fee
        )
    }

    pub fn join_challenge(ctx: Context<JoinChallenge>) -> Result<()> {
        instructions::challenge::join_challenge(ctx)
    }

    pub fn submit_video(
        ctx: Context<SubmitVideo>,
        video_url: String,
    ) -> Result<()> {
        instructions::challenge::submit_video(ctx, video_url)
    }

    pub fn vote_for_video(
        ctx: Context<VoteForVideo>,
        submission_index: u64,
    ) -> Result<()> {
        instructions::challenge::vote_for_video(ctx, submission_index)
    }


}

