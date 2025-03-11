import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, SendTransactionError, ComputeBudgetProgram, Commitment } from '@solana/web3.js';
import { Coinpetitive } from '../../../target/types/coinpetitive';
import { program } from '@project-serum/anchor/dist/cjs/native/system';


const PROGRAM_ID = new PublicKey("3aGvnvvFebPJt52wEuVsCHjwqDeVYzTNrmWmKMZ4Uu72");

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

  const payChallengeFee = () => {
    it("pays for challenge", async ()=>
    {
      const program = getProgram();
      const payer = anchor.workspace.provider.wallet.publicKey;
      const context = {
        user: payer,
        programWallet: new anchor.web3.PublicKey("8zhGg2MhHb4aGDa62jymyUTT3mkzQAyqPJme4Cyn6iYh"),
        systemProgram: anchor.web3.SystemProgram.programId,
      }
      
      try{
        const txHash = await program?.methods
      }


    })
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
      let detailedLogs: string[] = [];
      if (error instanceof SendTransactionError && typeof error.getLogs === 'function') {
        detailedLogs = await error.getLogs(connection);
        console.error('Error creating challenge (detailed logs):', detailedLogs);
      }
      console.error('Error creating challenge:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: detailedLogs.length ? detailedLogs : (error as any)?.logs || [] 
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

  const validateConnection = async () => {
    const { connection } = useConnection();
    try {
      const version = await connection.getVersion();
      console.log('Connected to:', connection.rpcEndpoint);
      console.log('Solana version:', version);
      return true;
    } catch (error) {
      console.error('RPC Connection failed:', error);
      return false;
    }
  };

  return {
    program: getProgram(),
    payChallengeFee,
    createChallenge,
    joinChallenge,
    submitVideo,
    voteSubmission,
    validateConnection  // Add this
  };
};