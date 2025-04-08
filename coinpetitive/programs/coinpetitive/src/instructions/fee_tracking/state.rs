// filepath: /home/ayoub/test/challenges-dapp/programs/coinpetitive/src/instructions/fee_tracking/state.rs
use anchor_lang::prelude::*;

#[account]
pub struct FeeTracking {
    pub total_fees_paid: u64,
    pub participants: Vec<Pubkey>,
}

impl FeeTracking {
    pub fn new() -> Self {
        Self {
            total_fees_paid: 0,
            participants: Vec::new(),
        }
    }

    pub fn update_fees(&mut self, fee: u64, participant: Pubkey) {
        self.total_fees_paid += fee;
        if !self.participants.contains(&participant) {
            self.participants.push(participant);
        }
    }

    pub fn get_total_fees(&self) -> u64 {
        self.total_fees_paid
    }

    pub fn get_participants(&self) -> &Vec<Pubkey> {
        &self.participants
    }
}