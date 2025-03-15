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
}
