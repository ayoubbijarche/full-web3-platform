use anchor_lang::prelude::*;
pub mod instructions;
use instructions::token::*;

declare_id!("565ocoMP5XxVpFhAVMED6Zh7V9qXd8qy1meeZ5oqzfyK");

#[program]
pub mod coinpetitive {
    use super::*;
    pub fn init_token(
        ctx: Context<InitToken>,
        metadata: InitTokenParams
    ) -> Result<()> {
        initiate_token(ctx, metadata)
    }
    
    pub fn mint_token(
        ctx: Context<MintTokens>,
        supply: u64,
    ) -> Result<()> {
        mint_tokens(ctx, supply)
    }
}

