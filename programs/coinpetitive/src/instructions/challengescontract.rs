use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use std::collections::BTreeMap;



#[account]
pub struct Challenge{
    pub entry : u64,
    pub prize : u64,
    pub participats : Pubkey
}

#[derive(Accounts)]
pub struct InitChallenge{}