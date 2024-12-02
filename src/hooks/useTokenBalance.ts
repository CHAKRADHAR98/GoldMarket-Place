import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { GOLD_TOKEN_MINT } from '@/utils/constants';

export const useTokenBalance = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;

    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await connection.getTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(GOLD_TOKEN_MINT),
        });

        if (response.value.length > 0) {
          const balance = await connection.getTokenAccountBalance(
            response.value[0].pubkey
          );
          setBalance(balance.value.uiAmount);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Set up subscription for balance updates
    const subscriptionId = connection.onAccountChange(
      publicKey,
      () => {
        fetchBalance();
      }
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection, publicKey]);

  return { balance, loading };
};
