import { PublicKey } from "@solana/web3.js";

export interface GoldListing {
  id: string;
  seller: PublicKey;
  price: number;
  amount: number;
  timestamp: number;
}

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
}
