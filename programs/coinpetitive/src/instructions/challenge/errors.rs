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
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Maximum number of voters reached for this challenge")]
    MaxVotersReached,
    #[msg("No submissions found")]
    NoSubmissions,
    #[msg("No votes found for any submission")]
    NoVotes,
    #[msg("Voter did not vote for the winning submission")]
    VoterDidNotVoteForWinner,
    #[msg("No reward to distribute")]
    NoRewardToDistribute,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("math overflow")]
    MathOverflow,
    #[msg("No winner declared")]
    NoWinnerDeclared,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Insufficient funds")]
    InsufficientFunds


}