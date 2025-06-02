import {
    createTransferInstruction,
    getMint,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
  } from "@solana/web3.js";
  // import { getAccount } from "@solana/spl-token";
  import { QUICKNODE_RPC_URL } from "./utils/constants";
  export interface ITransactionResponse {
    data: {
      signature: string;
      transaction: string;
    };
  }
  
  export default class SolanaRpcParticle {
    private connection: Connection;
  
    constructor(chainId: number) {
      const connection = new Connection(QUICKNODE_RPC_URL);
      this.connection = connection;
    }
  
    getBalance = async (address: string): Promise<string> => {
      try {
        const balance = await this.connection.getBalance(new PublicKey(address));
        console.log("balance", balance);
        return balance.toString();
      } catch (error) {
        return error as string;
      }
    };
  
    async getTokenBalance(
      walletAddress: string,
      tokenAddress: string
    ): Promise<string> {
      try {
        const walletPublicKey = new PublicKey(walletAddress);
        const tokenMintPublicKey = new PublicKey(tokenAddress);
  
        // Fetch all token accounts for the wallet that match the token mint
        const tokenAccounts = await this.connection.getTokenAccountsByOwner(
          walletPublicKey,
          {
            mint: tokenMintPublicKey,
          }
        );
  
        if (tokenAccounts.value.length === 0) {
          console.log("No token accounts found for this wallet and token mint.");
          return "0";
        }
  
        // Assuming the first token account holds the desired token
        const tokenAccountPubkey = tokenAccounts.value[0].pubkey;
  
        // Get the balance of the token account
        const balanceResult = await this.connection.getTokenAccountBalance(
          tokenAccountPubkey
        );
  
        return balanceResult?.value?.uiAmount?.toFixed(4) || "0";
      } catch (error) {
        console.error("Failed to get token balance:", error);
        return "0";
        // throw error;
      }
    }
  
    async sendSolTransaction(
      recipient: string,
      amount: number,
      solanaWallet: any, // Add solanaWallet parameter
      publicClient: any
    ): Promise<string> {
      const fromPubkey = solanaWallet.publicKey;
      const toPubkey = new PublicKey(recipient);
      const lamports = parseFloat(amount.toFixed(6)) * LAMPORTS_PER_SOL;
  
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );
  
      // Get latest blockhash using publicClient
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash({
          commitment: "finalized",
        });
  
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = fromPubkey;
  
      // Send transaction using solanaWallet
      const { signature } = await solanaWallet.sendTransaction(transaction);
  
      // Wait for confirmation
      await this.connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );
  
      return signature;
    }
  
    async sendToken(
      recipient: string,
      tokenAddress: string,
      amount: number,
      solanaWallet: any,
      publicClient: any
    ): Promise<string> {
      const senderPublicKey = solanaWallet.publicKey;
      const recipientPublicKey = new PublicKey(recipient);
      const tokenMintPublicKey = new PublicKey(tokenAddress);
  
      const mintInfo = await getMint(this.connection, tokenMintPublicKey);
      const decimals = mintInfo.decimals;
  
      const rawAmount = amount * Math.pow(10, decimals);
  
      const [senderTokenAccount, recipientTokenAccount] = await Promise.all([
        getOrCreateAssociatedTokenAccount(
          this.connection,
          solanaWallet.publicKey,
          tokenMintPublicKey,
          senderPublicKey
        ),
        getOrCreateAssociatedTokenAccount(
          this.connection,
          solanaWallet.publicKey,
          tokenMintPublicKey,
          recipientPublicKey
        ),
      ]);
  
      const transaction = new Transaction().add(
        createTransferInstruction(
          senderTokenAccount.address,
          recipientTokenAccount.address,
          senderPublicKey,
          rawAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash({
          commitment: "finalized",
        });
  
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = senderPublicKey;
  
      const { signature } = await solanaWallet.sendTransaction(transaction);
  
      await this.connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );
  
      return signature;
    }
    async signAndSendTransaction(
      data: ITransactionResponse,
      solanaWallet: any
    ): Promise<string> {
      try {
        // Decode the transaction from base64
        const transaction = Transaction.from(
          Buffer.from(data.data.transaction, "base64")
        );
  
        // Sign the transaction
        const { signature } = await solanaWallet.sendTransaction(transaction);
  
        await this.connection.confirmTransaction(signature, "confirmed");
  
        return signature;
      } catch (error: any) {
        throw new Error(`Failed to sign and send transaction: ${error.message}`);
      }
    }
  }
  