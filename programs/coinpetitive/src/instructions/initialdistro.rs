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
pub struct PartiesTr<'info>{
    #[account(mut)]
    pub from : Account<'info , TokenAccount>,
    #[account(mut)]
    pub to : Account<'info , TokenAccount>,
    pub authority : Signer<'info>,
    pub token_program : Program<'info , Token>
}


pub fn founder_transfer(ctx : Context<PartiesTr> , amount : u64)->Result<()>{
    let founder_hardcoded_key = Pubkey::from_str("8E1TjSr2jTPXDMiHFBDytLQS2orkmzTmgM29itFvs66g").unwrap();
    
    require_keys_eq!(ctx.accounts.to.key(), founder_hardcoded_key, TokenErr::YouNoTokenOwner);
    
    let cpi_accounts = Transfer{
        from : ctx.accounts.from.to_account_info(),
        to :  ctx.accounts.to.to_account_info(),
        authority : ctx.accounts.authority.to_account_info()
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}


pub fn dev_transfer(ctx : Context<PartiesTr> , amount : u64)->Result<()>{
    let founder_hardcoded_key = Pubkey::from_str("YourRecipientWalletAddress").unwrap();
    
    require_keys_eq!(ctx.accounts.to.key(), founder_hardcoded_key, TokenErr::YouNoTokenOwner);
    
    let cpi_accounts = Transfer{
        from : ctx.accounts.from.to_account_info(),
        to :  ctx.accounts.to.to_account_info(),
        authority : ctx.accounts.authority.to_account_info()
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}


pub fn marketing_transfer(ctx : Context<PartiesTr> , amount : u64)->Result<()>{
    let founder_hardcoded_key = Pubkey::from_str("YourRecipientWalletAddress").unwrap();
    
    require_keys_eq!(ctx.accounts.to.key(), founder_hardcoded_key, TokenErr::YouNoTokenOwner);
    
    let cpi_accounts = Transfer{
        from : ctx.accounts.from.to_account_info(),
        to :  ctx.accounts.to.to_account_info(),
        authority : ctx.accounts.authority.to_account_info()
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}



#[error_code]
pub enum TokenErr{
    #[msg("Not the owner")]
    YouNoTokenOwner,
}