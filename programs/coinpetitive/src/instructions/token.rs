use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{create_metadata_accounts_v3 , mpl_token_metadata::types::DataV2 , CreateMetadataAccountsV3 , Metadata as Metaplex},
    token::{mint_to, burn, transfer, Mint, MintTo, Burn, Transfer, Token, TokenAccount}
};

// Import constants from token_constants.rs
use crate::instructions::token_constants::{
    INITIAL_SUPPLY,
    MAX_SUPPLY,
    MINT_INCREMENT,
    BURN_RATE,
    MIN_TIME_BETWEEN_MINTS
};

// Import error type from token_errors.rs
use crate::instructions::token_errors::TokenError;


#[derive(Accounts)]
#[instruction(params: InitTokenParams)]
pub struct InitToken<'info> {
    #[account(mut)]
    /// CHECK: UncheckedAccount
    pub metadata: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = payer,
        mint::decimals = params.decimals,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    // State account to track supply and minting conditions
    #[account(
        init,
        seeds = [b"token_state"],
        bump,
        payer = payer,
        space = 8 + TokenState::SPACE,
    )]
    pub token_state: Account<'info, TokenState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"mint"],
        bump,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}

#[account]
#[derive(Default, Debug)]
pub struct TokenState {
    pub current_supply: u64,
    pub last_mint_timestamp: i64,
    pub challenges_completed: u64,
    pub total_entry_fees: u64,
    pub unique_wallets: u64,
    pub mint_conditions_used: [bool; 8], // Track which of the 8 conditions have been used
    pub mint_conditions_met: [bool; 8],  // Track which of the 8 conditions have been met
    pub is_self_sustaining: bool, // Track if platform is self-sustaining
    pub last_challenge_tracked: i64, // Add this field
    pub pending_mint_milestone: Option<u8>, // Store which milestone triggers the next mint
}

impl TokenState {
    pub const SPACE: usize = 8 + // discriminator
        8 + // current_supply
        8 + // last_mint_timestamp
        8 + // challenges_completed
        8 + // total_entry_fees
        8 + // unique_wallets
        8 + // mint_conditions_used (8 booleans)
        8 + // mint_conditions_met (8 booleans)
         8 + // last_challenge_tracked
         1 + // is_self_sustaining boolean
         1; // pending_mint_milestone (Option<u8>)
}

// Burn tokens struct
#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// Struct for daily sell limit tracking
#[derive(Accounts)]
pub struct TransferWithLimit<'info> {
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    
    pub token_program: Program<'info, Token>,
}




pub fn initiate_token(ctx: Context<InitToken>, metadata: InitTokenParams) -> Result<()> {
    let seeds = &["mint".as_bytes(), &[ctx.bumps.mint]];
    let signer = [&seeds[..]];

    let token_data: DataV2 = DataV2 {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let metadata_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            payer: ctx.accounts.payer.to_account_info(),
            update_authority: ctx.accounts.mint.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            mint_authority: ctx.accounts.mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
        &signer,
    );

    create_metadata_accounts_v3(metadata_ctx, token_data, false, true, None)?;
    
    // Initialize token state
    let token_state = &mut ctx.accounts.token_state;
    token_state.current_supply = 0;
    token_state.last_mint_timestamp = Clock::get()?.unix_timestamp;
    token_state.challenges_completed = 0;
    token_state.total_entry_fees = 0;
    token_state.unique_wallets = 0;
    token_state.mint_conditions_used = [false; 8]; // Initialize all conditions as unused
    token_state.mint_conditions_met = [false; 8];  // Initialize all conditions as unmet
    token_state.is_self_sustaining = false;
    token_state.last_challenge_tracked = 0; // Initialize last challenge tracked
    token_state.pending_mint_milestone = None; // Initialize pending mint milestone
    
    msg!("Token mint and state initialized successfully.");
    Ok(())
}

pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u64) -> Result<()> {
    let token_state = &mut ctx.accounts.token_state;
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Only maintain the max supply cap check for safety
    require!(
        token_state.current_supply + quantity <= MAX_SUPPLY,
        TokenError::ExceedsMaxSupplyCap
    );
    
    // Perform the mint - no conditions checked
    let seeds = &["mint".as_bytes(), &[ctx.bumps.mint]];
    let signer = [&seeds[..]];
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                authority: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
            &signer,
        ),
        quantity,
    )?;
    
    // Update state
    token_state.current_supply += quantity;
    token_state.last_mint_timestamp = current_timestamp;
    
    msg!("Tokens minted successfully: {}", quantity);
    msg!("Current supply: {}", token_state.current_supply);
    Ok(())
}

// Burn tokens function (for the 1% transaction fee)
pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;
    
    msg!("Burned {} tokens", amount);
    Ok(())
}


pub fn transfer_with_limit(ctx: Context<TransferWithLimit>, amount: u64) -> Result<()> {
    // Calculate 1% of total supply as daily limit
    let circulating_supply = ctx.accounts.mint.supply;
    let daily_limit = circulating_supply / 100; // 1% of supply
    
    // Check against the daily limit
    require!(amount <= daily_limit, TokenError::ExceedsDailySellLimit);
    
    // Calculate burn amount (1% for liquidity pool transactions)
    let burn_amount = amount * BURN_RATE as u64 / 100;
    let transfer_amount = amount - burn_amount;
    
    // Transfer reduced amount to recipient
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        transfer_amount,
    )?;
    
    // Burn the calculated amount
    if burn_amount > 0 {
        burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            burn_amount,
        )?;
        
        // Update token state to reflect the burn
        ctx.accounts.token_state.current_supply = ctx.accounts.token_state.current_supply
            .checked_sub(burn_amount)
            .ok_or(TokenError::ArithmeticOverflow)?;
            
        msg!("Burned {} tokens ({}% of transfer amount)", burn_amount, BURN_RATE);
    }
    
    msg!("Transferred {} tokens with {} tokens burned", transfer_amount, burn_amount);
    Ok(())
}


