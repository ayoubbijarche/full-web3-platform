use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Challenge not active")]
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
    #[msg("Already participated")]
    AlreadyParticipated,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Submission not found")]
    SubmissionNotFound,
    #[msg("Invalid treasury")]
    InvalidTreasury,
    #[msg("Invalid token program")]
    InvalidTokenProgram,
    #[msg("Invalid token treasury")]
    InvalidVotingTreasury,
}