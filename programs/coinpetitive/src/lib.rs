use anchor_lang::prelude::*;
pub mod instructions;
use instructions::token::*;
use instructions::initialdistro::*;
use instructions::challenge::*;

declare_id!("3aGvnvvFebPJt52wEuVsCHjwqDeVYzTNrmWmKMZ4Uu72");

#[program]
pub mod coinpetitive {
    use super::*;
    pub fn init_token(
        ctx: Context<InitToken>,
        metadata: InitTokenParams
    ) -> Result<()> {
        initiate_token(ctx, metadata);
        Ok(())
    }
    
    pub fn mint_token(
        ctx: Context<MintTokens>,
        supply: u64,
    )-> Result<()> {
        mint_tokens(ctx, supply);
        Ok(())
    }
    
    pub fn transfer_founder(
        ctx: Context<PartiesTr>,
        amount : u64
    )-> Result<()> {
        founder_transfer(ctx, amount);
        Ok(())
    }
    pub fn transfer_dev(
        ctx: Context<PartiesTr>,
        amount : u64
    )-> Result<()> {
        dev_transfer(ctx, amount);
        Ok(())
    }
    pub fn marketing_transfer(
        ctx: Context<PartiesTr>,
        amount : u64
    )-> Result<()> {
        do_marketing_transfer(ctx, amount);
        Ok(())
    }

    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        description: String,
        reward: u64,
    ) -> Result<()> {
        instructions::challenge::create_challenge(ctx, description, reward)
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

    pub fn vote_submission(
        ctx: Context<VoteSubmission>,
        submission_index: u64,
    ) -> Result<()> {
        instructions::challenge::vote_submission(ctx, submission_index)
    }

    pub fn pay_challenge(
        ctx: Context<PayChallenge>,
    ) -> Result<()> {
        pay_challenge(ctx)
    }
}

