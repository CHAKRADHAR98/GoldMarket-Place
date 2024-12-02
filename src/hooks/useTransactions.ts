import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction, TransactionInstruction } from '@solana/web3.js';
import { useState } from 'react';

export const useTransaction = () => {
  const { connection } = useConnection();
  const [processing, setProcessing] = useState(false);

  const sendAndConfirmTransaction = async (
    transaction: Transaction,
    signers: Keypair[]
  ) => {
    try {
      setProcessing(true);
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      // Sign transaction
      transaction.sign(...signers);
      
      // Send transaction
      const signature = await connection.sendRawTransaction(
        transaction.serialize()
      );
      
      // Confirm transaction
      await connection.confirmTransaction(signature);
      
      return signature;
    } finally {
      setProcessing(false);
    }
  };

  return {
    sendAndConfirmTransaction,
    processing,
  };
};