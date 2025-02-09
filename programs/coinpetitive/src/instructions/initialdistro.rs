use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::str::FromStr;

/*
    token allocation at launch is 21M
    founder gets 1.1M
    developer 500k
    Affiliator Rewards 500k
    18.9 for public use and liquidity pool
*/



#[derive(Accounts)]
pub struct PartiesTr<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum TokenErr {
    #[msg("Not the owner")]
    YouNoTokenOwner,
}

pub fn founder_transfer(ctx: Context<PartiesTr>, amount: u64) -> Result<()> {
    let founder_wallet = Pubkey::from_str("5w3VpTacYmcCBXygAxFoCDfG4R11q9dbj4WGLVswweKE")
        .expect("Failed to parse founder wallet");
    require!(
        ctx.accounts.to.owner == founder_wallet,
        TokenErr::YouNoTokenOwner
    );
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}

pub fn dev_transfer(ctx: Context<PartiesTr>, amount: u64) -> Result<()> {
    let dev_wallet = Pubkey::from_str("DhCu49epRCawP9Yp2ZoatzSvfmTewi2x73xEM6Vb2kh2")
        .expect("Failed to parse dev wallet");
    
    require!(
        ctx.accounts.to.owner == dev_wallet,
        TokenErr::YouNoTokenOwner
    );
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}



pub fn do_marketing_transfer(ctx: Context<PartiesTr>, amount: u64) -> Result<()> {
    let marketing_wallet = Pubkey::from_str("973DKZUVJQqo11pXs74KzB1jwjrMMXLueBBiRCwi9Eh")
            .expect("Failed to parse marketing wallet");
    
    require!(
        ctx.accounts.to.owner == marketing_wallet,
        TokenErr::YouNoTokenOwner
    );
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}

