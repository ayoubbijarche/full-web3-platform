use anchor_lang::prelude::*;

#[account]
pub struct Challenge {
    pub creator: Pubkey,
    pub is_active: bool,
    pub reward: u64,
    pub participation_fee: u64,
    pub voting_fee: u64,
    pub challenge_treasury: u64,      // Holds participation fees
    pub voting_treasury: u64,         // Holds voting fees
    pub winner: Option<Pubkey>,
    pub total_votes: u64,
    pub winning_votes: u64,           // Votes for the winner
    pub reward_token_mint: Pubkey,    // CPT token mint
}