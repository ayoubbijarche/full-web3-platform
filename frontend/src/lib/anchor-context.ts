import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import { PublicKey, ComputeBudgetProgram, SystemProgram } from "@solana/web3.js";
import { useCallback } from "react";
import { Coinpetitive } from "../../../target/types/coinpetitive";
import idl from "../../../target/idl/coinpetitive.json";
import * as anchor from "@coral-xyz/anchor";

// Use the program ID from your Anchor.toml
const PROGRAM_ID = new PublicKey("J39RNWHB4Tc4utSGSE8fnmyLngMtYR6A2Mrz4j1hFirQ");
const RECIPIENT_WALLET = new PublicKey("8E1TjSr2jTPXDMiHFBDytLQS2orkmzTmgM29itFvs66g");

export function useAnchorContext() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getProvider = useCallback(() => {
    if (!wallet) {
      throw new Error("Wallet not connected!");
    }

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    return provider;
  }, [connection, wallet]);

  const getProgram = useCallback(() => {
    const provider = getProvider();

    return new Program(idl as Coinpetitive, provider);
  }, [getProvider]);

  const payChallenge = useCallback(async () => {
    const program = getProgram();
    const provider = getProvider();


    try {
      const context = {
        from: provider.wallet.publicKey,
        to: RECIPIENT_WALLET,
      }

      const amount = new anchor.BN(1 * web3.LAMPORTS_PER_SOL);
      const tx = await program.methods
        .payChallenge(amount)
        .accounts(context)
        .signers([provider.wallet])
        .transaction();

      console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      return tx;
    } catch (error) {
      console.error("Payment failed:", error);
      throw error;
    }
  }, [getProgram, getProvider]);

  return {
    getProvider,
    getProgram,
    payChallenge,
  };
}
