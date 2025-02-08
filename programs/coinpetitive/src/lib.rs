use anchor_lang::prelude::*;
pub mod instructions;
use instructions::token::*;
use instructions::initialdistro::*;

declare_id!("565ocoMP5XxVpFhAVMED6Zh7V9qXd8qy1meeZ5oqzfyK");

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
        marketing_transfer(ctx, amount);
        Ok(())
    }
}

