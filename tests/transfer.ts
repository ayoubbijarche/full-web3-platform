const { Keypair, Transaction, Connection, PublicKey } = require("@solana/web3.js");
const { getAssociatedTokenAddress, createTransferCheckedInstruction, createAssociatedTokenAccountInstruction } = require("@solana/spl-token");
const { bs58 } = require("@coral-xyz/anchor/dist/cjs/utils/bytes");


const owner = "48aMYtscHWWUV8xTg1XNoJigSBz7wy6duukZyhvyBBWdnQy2f2ZAPkA1rC9GAgReFa6XYvGsGrSiPkdncK8kygdm"
const spltoken = new PublicKey("565ocoMP5XxVpFhAVMED6Zh7V9qXd8qy1meeZ5oqzfyK"); // Program Id of your SPL Token, obtained during "anchor deploy"
const sourceWallet = Keypair.fromSecretKey(bs58.decode(owner));
const connection = new Connection("https://api.devnet.solana.com");
const destWallet = new PublicKey("8E1TjSr2jTPXDMiHFBDytLQS2orkmzTmgM29itFvs66g");
const tokens = 1100000; // set the amount of tokens to transfer.

export async function genAta(){
    let ata = await getAssociatedTokenAddress(
        spltoken, 
        destWallet,
        false
      );
    let tx = new Transaction();
        tx.add(
          createAssociatedTokenAccountInstruction(
            sourceWallet.publicKey, 
            ata,
            destWallet,
            spltoken
          )
        );
    console.log(`create ata txhash: ${await connection.sendTransaction(tx, [sourceWallet])}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
}

const solanaTransferSpl = async () => {
    let amount = tokens * 1 ** 6;
    let sourceTokenRaw = await getAssociatedTokenAddress(
        spltoken,
        sourceWallet.publicKey,
        false
    );

    let destTokenRaw = await getAssociatedTokenAddress(
        spltoken,
        destWallet,
        false
    );
    let sourceATA = sourceTokenRaw.toBase58();
    let destATA = destTokenRaw.toBase58(); 
    try {
        let transaction = new Transaction();
        transaction.add(
            createTransferCheckedInstruction(
                new PublicKey(sourceATA),
                spltoken,
                new PublicKey(destATA),
                sourceWallet.publicKey,
                amount,
                7
            )
        )
        let tx = await connection.sendTransaction(transaction, [sourceWallet])
        console.log('Tokens transferred Successfully, Receipt: ' + tx);
        return;
    }
    catch {
        let generateAta = await genAta();
            if (generateAta) {
                await new Promise((resolve) => setTimeout(resolve, 15000));
                solanaTransferSpl();
                return;
            }
        };
}

solanaTransferSpl()