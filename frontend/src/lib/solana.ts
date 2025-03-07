import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, SendTransactionError } from '@solana/web3.js';
import { Coinpetitive } from '../../../target/types/coinpetitive';

const PROGRAM_ID = new PublicKey("CZ9rbEqcWAibvYdrJoFWKWqRhn2PHwWocRZU4erTcGfJ");

interface ProgramIDL {
  version: "0.1.0";
  name: "coinpetitive";
  instructions: [
    {
      name: "payChallenge";
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "programWallet";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "createChallenge";
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "challenge";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "description";
          type: "string";
        },
        {
          name: "reward";
          type: "u64";
        }
      ];
    },
    {
      name: "joinChallenge";
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "challenge";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "submitVideo";
      accounts: [
        {
          name: "participant";
          isMut: true;
          isSigner: true;
        },
        {
          name: "challenge";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "videoUrl";
          type: "string";
        }
      ];
    },
    {
      name: "voteSubmission";
      accounts: [
        {
          name: "voter";
          isMut: true;
          isSigner: true;
        },
        {
          name: "challenge";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "submissionIndex";
          type: "u64";
        }
      ];
    }
  ];
}

export const useSolanaProgram = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getProgram = () => {
    if (!wallet) return null;

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { 
        commitment: 'processed',
        preflightCommitment: 'processed'
      }
    );
    anchor.setProvider(provider);

    return new Program<ProgramIDL>(
      {
        version: "0.1.0",
        name: "coinpetitive",
        instructions: [
          {
            name: "payChallenge",
            accounts: [
              {
                name: "user",
                isMut: true,
                isSigner: true,
              },
              {
                name: "programWallet",
                isMut: true,
                isSigner: false,
              },
              {
                name: "systemProgram",
                isMut: false,
                isSigner: false,
              }
            ],
            args: []
          },
          {
            name: "createChallenge",
            accounts: [
              {
                name: "user",
                isMut: true,
                isSigner: true,
              },
              {
                name: "challenge",
                isMut: true,
                isSigner: false,
              },
              {
                name: "systemProgram",
                isMut: false,
                isSigner: false,
              }
            ],
            args: [
              {
                name: "description",
                type: "string",
              },
              {
                name: "reward",
                type: "u64",
              }
            ]
          },
          {
            name: "joinChallenge",
            accounts: [
              {
                name: "user",
                isMut: true,
                isSigner: true,
              },
              {
                name: "challenge",
                isMut: true,
                isSigner: false,
              },
              {
                name: "systemProgram",
                isMut: false,
                isSigner: false,
              }
            ],
            args: []
          },
          {
            name: "submitVideo",
            accounts: [
              {
                name: "participant",
                isMut: true,
                isSigner: true,
              },
              {
                name: "challenge",
                isMut: true,
                isSigner: false,
              }
            ],
            args: [
              {
                name: "videoUrl",
                type: "string",
              }
            ]
          },
          {
            name: "voteSubmission",
            accounts: [
              {
                name: "voter",
                isMut: true,
                isSigner: true,
              },
              {
                name: "challenge",
                isMut: true,
                isSigner: false,
              },
              {
                name: "systemProgram",
                isMut: false,
                isSigner: false,
              }
            ],
            args: [
              {
                name: "submissionIndex",
                type: "u64",
              }
            ]
          }
        ]
      },
      PROGRAM_ID,
      provider
    );
  };

  const payChallengeFee = async () => {
    const program = getProgram();
    if (!program || !wallet) throw new Error('Wallet not connected');

    try {
      const txHash = await program.methods
        .payChallenge()
        .accounts({
          user: wallet.publicKey,
          programWallet: PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.provider.connection.confirmTransaction(txHash, 'processed');
      console.log(`Transaction: http://localhost:8899/tx/${txHash}?cluster=localnet`);

      return { success: true, signature: txHash };
    } catch (error) {
      if (error instanceof SendTransactionError) {
        console.error('Transaction Error Details:', {
          logs: error.logs,  
          message: error.message
        });
      }
      
      if (error instanceof Error && error.message.includes('Simulation failed')) {
        const simError = error as any;
        console.error('Simulation Error Details:', {
          logs: simError.logs,
          details: simError.details,
          errorMessage: simError.message
        });
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: (error as any)?.logs || [] 
      };
    }
  };

  const createChallenge = async (challengeAccount: PublicKey, description: string, reward: number) => {
    const program = getProgram();
    if (!program || !wallet) throw new Error('Wallet not connected');

    try {
      const txHash = await program.methods
        .createChallenge(description, new anchor.BN(reward))
        .accounts({
          user: wallet.publicKey,
          challenge: challengeAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.provider.connection.confirmTransaction(txHash, 'processed');
      console.log(`Transaction: http://localhost:8899/tx/${txHash}?cluster=localnet`);

      return { success: true, signature: txHash };
    } catch (error) {
      console.error('Error creating challenge:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: (error as any)?.logs || [] 
      };
    }
  };

  const joinChallenge = async (challengeAccount: PublicKey) => {
    const program = getProgram();
    if (!program || !wallet) throw new Error('Wallet not connected');

    try {
      const txHash = await program.methods
        .joinChallenge()
        .accounts({
          user: wallet.publicKey,
          challenge: challengeAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.provider.connection.confirmTransaction(txHash, 'processed');
      console.log(`Transaction: http://localhost:8899/tx/${txHash}?cluster=localnet`);

      return { success: true, signature: txHash };
    } catch (error) {
      console.error('Error joining challenge:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: (error as any)?.logs || [] 
      };
    }
  };

  const submitVideo = async (challengeAccount: PublicKey, videoUrl: string) => {
    const program = getProgram();
    if (!program || !wallet) throw new Error('Wallet not connected');

    try {
      const txHash = await program.methods
        .submitVideo(videoUrl)
        .accounts({
          participant: wallet.publicKey,
          challenge: challengeAccount,
        })
        .rpc();

      await program.provider.connection.confirmTransaction(txHash, 'processed');
      console.log(`Transaction: http://localhost:8899/tx/${txHash}?cluster=localnet`);

      return { success: true, signature: txHash };
    } catch (error) {
      console.error('Error submitting video:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: (error as any)?.logs || [] 
      };
    }
  };

  const voteSubmission = async (challengeAccount: PublicKey, submissionIndex: number) => {
    const program = getProgram();
    if (!program || !wallet) throw new Error('Wallet not connected');

    try {
      const txHash = await program.methods
        .voteSubmission(new anchor.BN(submissionIndex))
        .accounts({
          voter: wallet.publicKey,
          challenge: challengeAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.provider.connection.confirmTransaction(txHash, 'processed');
      console.log(`Transaction: http://localhost:8899/tx/${txHash}?cluster=localnet`);

      return { success: true, signature: txHash };
    } catch (error) {
      console.error('Error voting for submission:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: (error as any)?.logs || [] 
      };
    }
  };

  return {
    program: getProgram(),
    payChallengeFee,
    createChallenge,
    joinChallenge,
    submitVideo,
    voteSubmission
  };
};