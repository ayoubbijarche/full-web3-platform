// filepath: /home/ayoub/test/challenges-dapp/programs/coinpetitive/src/instructions/milestone_tracking/state.rs
use anchor_lang::prelude::*;

#[account]
pub struct MilestoneTracking {
    pub milestones_met: u64,
    pub last_mint_time: i64,
}

impl MilestoneTracking {
    pub fn new() -> Self {
        Self {
            milestones_met: 0,
            last_mint_time: Clock::get().unwrap().unix_timestamp,
        }
    }

    pub fn update_milestones(&mut self, milestones: u64) {
        self.milestones_met += milestones;
        self.last_mint_time = Clock::get().unwrap().unix_timestamp;
    }

    pub fn check_milestones(&self, threshold: u64) -> bool {
        self.milestones_met >= threshold
    }
}