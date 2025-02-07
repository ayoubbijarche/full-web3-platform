use anchor_lang::prelude::*;
pub mod instructions;
use instructions::*;

declare_id!("565ocoMP5XxVpFhAVMED6Zh7V9qXd8qy1meeZ5oqzfyK");

#[program]
pub mod coinpetitive {
    use super::*;
    pub fn init_token(
        ctx : Context<InitToken>,
        metadata : InitMeta
    )->Result<()>{
        init_token(ctx, metadata);
        Ok(())
    }
    
    pub fn mint_token(
        ctx : Context<MintToken>,
        supply : u64,
    )->Result<()>{
        mint_token(ctx, supply);
        Ok(())
    }
}

