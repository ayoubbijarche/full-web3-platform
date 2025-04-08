// filepath: /home/ayoub/test/challenges-dapp/programs/coinpetitive/src/errors.rs
use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The treasury account is invalid.")]
    InvalidTreasury,
    
    #[msg("The participant has already participated.")]
    AlreadyParticipated,
    
    #[msg("The maximum number of participants has been reached.")]
    MaxParticipantsReached,
    
    #[msg("The token program is invalid.")]
    InvalidTokenProgram,
    
    #[msg("The minting condition has not been met.")]
    MintingConditionNotMet,
    
    #[msg("The fee amount is invalid.")]
    InvalidFeeAmount,
    
    #[msg("The milestone has already been reached.")]
    MilestoneAlreadyReached,
    
    #[msg("Insufficient funds for the operation.")]
    InsufficientFunds,
    
    #[msg("Unauthorized access.")]
    UnauthorizedAccess,
    
    #[msg("An unknown error occurred.")]
    UnknownError,
}