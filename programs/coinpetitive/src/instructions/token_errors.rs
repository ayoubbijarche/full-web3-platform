use anchor_lang::prelude::*;

#[error_code]
pub enum TokenError {
    #[msg("Not the owner")]
    YouNotTokenOwner,
    #[msg("Exceeds initial supply cap of 21M tokens")]
    ExceedsInitialSupplyCap,
    #[msg("Exceeds maximum supply cap of 61M tokens")]
    ExceedsMaxSupplyCap,
    #[msg("Minting increment must be exactly 5M tokens")]
    InvalidMintIncrement,
    #[msg("Minting is limited to once per year")]
    MintingTooFrequent,
    #[msg("No minting conditions have been met")]
    NoMintConditionsMet,
    #[msg("Exceeds daily sell limit of 1% of circulating supply")]
    ExceedsDailySellLimit,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid batch size")]
    InvalidBatchSize,
    #[msg("Wallet already tracked")]
    WalletAlreadyTracked,
    #[msg("Too many requests")]
    TooManyRequests,
    #[msg("Invalid blockhash")]
    InvalidBlockhash,
    #[msg("Invalid token owner")]
    NotTokenOwner,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Insufficient token balance")]
    InsufficientTokenBalance,
    #[msg("Not authorized")]
    NotAuthorized
}
