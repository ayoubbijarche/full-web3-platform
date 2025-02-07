use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{create_metadata_accounts_v3 , mpl_token_metadata::types::DataV2 , CreateMetadataAccountsV3 , Metadata as Metaplex},
    token::{mint_to , Mint , MintTo , Token , TokenAccount}
};


#[derive(AnchorSerialize , AnchorDeserialize , Debug , Clone)]
pub struct InitMeta{
    pub name : String,
    pub symbol : String,
    pub uri : String,
    pub decimals : u8
}


#[derive(Accounts)]
#[instruction(params : InitMeta)]
pub struct InitToken<'info>{
    #[account(mut)]
    /// CHECK: UncheckedAccount
    pub metadata : UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"cpv"],
        bump,
        payer = payer,
        mint::decimals = params.decimals,
        mint::authority = mint
    )]
    pub mint : Account<'info , Mint>,
    #[account(mut)]
    pub payer : Signer<'info>,
    pub rent : Sysvar<'info , Rent>,
    pub system_program : Program<'info , System>,
    pub token_program : Program<'info , Token>,
    pub token_metadata_program : Program<'info , Metaplex>
}


#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(
        mut,
        seeds = [b"cpv"],
        bump
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub destination: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}



pub fn init_token(ctx : Context<InitToken> , metadata : InitMeta) -> Result<()>{
    let seeds = &["cpv".as_bytes() , &[ctx.bumps.mint]];
    let signer = [&seeds[..]];
    let token_data = DataV2{
        name : metadata.name,
        symbol : metadata.symbol,
        uri : metadata.uri,
        creators : None,
        collection : None,
        uses : None,
        seller_fee_basis_points : 0
    };
    
    let metadata_ctx = CpiContext::new_with_signer(
        ctx.accounts.metadata.to_account_info(),
        CreateMetadataAccountsV3{
            payer : ctx.accounts.payer.to_account_info(),
            update_authority : ctx.accounts.mint.to_account_info(),
            mint : ctx.accounts.mint.to_account_info(),
            metadata : ctx.accounts.metadata.to_account_info(),
            mint_authority : ctx.accounts.mint.to_account_info(),
            system_program : ctx.accounts.system_program.to_account_info(),
            rent : ctx.accounts.rent.to_account_info()
        },
        &signer
    );
    
    create_metadata_accounts_v3(metadata_ctx, token_data ,false , true , None)?;
    
    msg!("created metadata successfully");
    
    Ok(())
}

pub fn mint_token(ctx : Context<MintToken> , supply : u64)->Result<()>{
    let seeds = &["cpv".as_bytes() , &[ctx.bumps.mint]];
    let signer = [&seeds[..]]; 
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                authority : ctx.accounts.mint.to_account_info(),
                to : ctx.accounts.destination.to_account_info(),
                mint : ctx.accounts.mint.to_account_info()
            },
            &signer,
        ),
        supply
    )?;
    Ok(())
}