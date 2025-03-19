use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Challenge is not active")]
    ChallengeNotActive,
    #[msg("Challenge is still active")]
    ChallengeStillActive,
    #[msg("Invalid creator")]
    InvalidCreator,
    #[msg("Invalid submission ID")]
    InvalidSubmissionId,
    #[msg("Voting period has not ended")]
    VotingPeriodActive,
    #[msg("Invalid vote count")]
    InvalidVoteCount,
    #[msg("Invalid winner")]
    InvalidWinner,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Maximum participants reached")]
    MaxParticipantsReached,
    #[msg("Already participating in this challenge")]
    AlreadyParticipating,
    
    // Add new error codes
    #[msg("Already voted for this submission")]
    AlreadyVoted,
    #[msg("Submission not found")]
    SubmissionNotFound,
}