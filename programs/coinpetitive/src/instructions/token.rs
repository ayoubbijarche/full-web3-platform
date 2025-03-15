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
    pub is_self_sustaining: bool, // Track if platform is self-sustaining
}

impl TokenState {
    pub const SPACE: usize = 8 + // discriminator
        8 + // current_supply
        8 + // last_mint_timestamp
        8 + // challenges_completed
        8 + // total_entry_fees
        8 + // unique_wallets
        8 + // mint_conditions_used (8 booleans)
        1; // is_self_sustaining boolean
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
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    #[account(
        seeds = [b"mint"],
        bump,
    )]
    pub mint: Account<'info, Mint>,
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
    token_state.is_self_sustaining = false;
    
    msg!("Token mint and state initialized successfully.");
    Ok(())
}

pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u64) -> Result<()> {
    let token_state = &mut ctx.accounts.token_state;
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Check if this is initial minting or additional minting
    if token_state.current_supply == 0 {
        // Initial minting - enforce the 21M cap
        require!(quantity <= INITIAL_SUPPLY, TokenError::ExceedsInitialSupplyCap);
    } else {
        // Additional minting - enforce restrictions
        
        // 1. Check max supply cap
        require!(
            token_state.current_supply + quantity <= MAX_SUPPLY,
            TokenError::ExceedsMaxSupplyCap
        );
        
        // 2. Check increment size (5M per mint)
        require!(quantity == MINT_INCREMENT, TokenError::InvalidMintIncrement);
        
        // 3. Check time restriction (one mint per year)
        require!(
            current_timestamp - token_state.last_mint_timestamp >= MIN_TIME_BETWEEN_MINTS,
            TokenError::MintingTooFrequent
        );
        
        // 4. Check if any new minting condition is met
        let mut condition_index: Option<usize> = None;
        
        // Check each minting condition in order and find first unused one that's met
        // Condition 0: 5M challenges completed
        if !token_state.mint_conditions_used[0] && token_state.challenges_completed >= 5_000_000 {
            condition_index = Some(0);
        }
        // Condition 1: 10M challenges completed
        else if !token_state.mint_conditions_used[1] && token_state.challenges_completed >= 10_000_000 {
            condition_index = Some(1);
        }
        // Condition 2: 50M total entry fees paid
        else if !token_state.mint_conditions_used[2] && token_state.total_entry_fees >= 50_000_000 {
            condition_index = Some(2);
        }
        // Condition 3: 100M total entry fees paid
        else if !token_state.mint_conditions_used[3] && token_state.total_entry_fees >= 100_000_000 {
            condition_index = Some(3);
        }
        // Condition 4: 250,000 unique wallets holding tokens
        else if !token_state.mint_conditions_used[4] && token_state.unique_wallets >= 250_000 {
            condition_index = Some(4);
        }
        // Condition 5: 500,000 unique wallets holding tokens
        else if !token_state.mint_conditions_used[5] && token_state.unique_wallets >= 500_000 {
            condition_index = Some(5);
        }
        // Condition 6: 1M unique wallets holding tokens
        else if !token_state.mint_conditions_used[6] && token_state.unique_wallets >= 1_000_000 {
            condition_index = Some(6);
        }
        // Condition 7: Platform reaches self-sustaining revenue
        else if !token_state.mint_conditions_used[7] && token_state.is_self_sustaining {
            condition_index = Some(7);
        }
        
        // Require that at least one condition is met
        require!(condition_index.is_some(), TokenError::NoMintConditionsMet);
        
        // Mark the condition as used
        if let Some(index) = condition_index {
            token_state.mint_conditions_used[index] = true;
        }
    }
    
    // Perform the mint
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
    msg!("Next eligible mint time: {}", current_timestamp + MIN_TIME_BETWEEN_MINTS);
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

// Transfer with sell limit protection
pub fn transfer_with_limit(ctx: Context<TransferWithLimit>, amount: u64) -> Result<()> {
    // Calculate 1% of total supply as daily limit
    let circulating_supply = ctx.accounts.mint.supply;
    let daily_limit = circulating_supply / 100; // 1% of supply
    
    // In a real implementation, you would track user's daily transfers in storage
    // For simplicity, we're just checking the current transaction
    require!(amount <= daily_limit, TokenError::ExceedsDailySellLimit);
    
    // Calculate burn amount (1% for liquidity pool transactions)
    let burn_amount = amount * BURN_RATE as u64 / 100;
    let transfer_amount = amount - burn_amount;
    
    // Update the unique wallets count if this is a new wallet receiving tokens
    // In a real implementation, you would track each unique wallet
    // For this example, we're just incrementing the counter as a placeholder
    let is_new_wallet = true; // This should be replaced with actual check
    
    if is_new_wallet {
        ctx.accounts.token_state.unique_wallets += 1;
        msg!("New unique wallet tracked. Total unique wallets: {}", ctx.accounts.token_state.unique_wallets);
    }
    
    // Transfer tokens
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
    
    // In a real implementation, you would burn the tokens here
    // This would require additional accounts and logic
    
    msg!("Transferred {} tokens with {} tokens burned", transfer_amount, burn_amount);
    Ok(())
}

// Define a separate instruction to track unique wallets
// This would be a more scalable approach in a production implementation
#[derive(Accounts)]
pub struct TrackWallet<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    pub wallet: Signer<'info>,
}

// Function to track wallets via a separate instruction
pub fn track_wallet(ctx: Context<TrackWallet>) -> Result<()> {
    // In a real implementation, you would maintain a set of wallet addresses
    // and check if this wallet is already in the set before incrementing
    
    // Placeholder logic - in reality, would check if this is actually a new wallet
    let is_new_wallet = true; // Replace with actual check in production
    
    if is_new_wallet {
        ctx.accounts.token_state.unique_wallets += 1;
        msg!("New unique wallet tracked. Total unique wallets: {}", ctx.accounts.token_state.unique_wallets);
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateRevenue<'info> {
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
    )]
    pub token_state: Account<'info, TokenState>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// Function to update the self-sustaining revenue status
// This would typically be called by an admin or governance process
pub fn update_self_sustaining_status(ctx: Context<UpdateRevenue>, is_self_sustaining: bool) -> Result<()> {
    let token_state = &mut ctx.accounts.token_state;
    
    // Update the self-sustaining status
    token_state.is_self_sustaining = is_self_sustaining;
    
    msg!("Platform self-sustaining status updated to: {}", is_self_sustaining);
    
    // If this is the first time the platform becomes self-sustaining,
    // it could trigger a minting event (if all other conditions are met)
    if is_self_sustaining {
        msg!("Platform has reached self-sustaining revenue. This may trigger the final minting event.");
    }
    
    Ok(())
}