// tests/gold-marketplace.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GoldMarketplace } from "../target/types/gold_marketplace";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("gold-marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GoldMarketplace as Program<GoldMarketplace>;
  let mint: PublicKey;
  let sellerTokenAccount: PublicKey;
  let buyerTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  
  const seller = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  const amount = new anchor.BN(100); // 100 tokens
  const price = new anchor.BN(LAMPORTS_PER_SOL); // 1 SOL

  before(async () => {
    // Airdrop SOL to seller and buyer
    await provider.connection.requestAirdrop(seller.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(buyer.publicKey, 2 * LAMPORTS_PER_SOL);

    // Create mint and token accounts
    mint = await createMint(
      provider.connection,
      seller,
      seller.publicKey,
      null,
      6
    );

    sellerTokenAccount = await createAccount(
      provider.connection,
      seller,
      mint,
      seller.publicKey
    );

    buyerTokenAccount = await createAccount(
      provider.connection,
      buyer,
      mint,
      buyer.publicKey
    );

    // Mint tokens to seller
    await mintTo(
      provider.connection,
      seller,
      mint,
      sellerTokenAccount,
      seller,
      100
    );
  });

  it("Creates a listing", async () => {
    const listing = anchor.web3.Keypair.generate();
    
    await program.methods
      .createListing(amount, price)
      .accounts({
        seller: seller.publicKey,
        listing: listing.publicKey,
        mint,
        sellerTokenAccount,
        escrowTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([seller, listing])
      .rpc();

    const listingAccount = await program.account.listing.fetch(listing.publicKey);
    assert.ok(listingAccount.seller.equals(seller.publicKey));
    assert.ok(listingAccount.amount.eq(amount));
    assert.ok(listingAccount.price.eq(price));
    assert.ok(listingAccount.active);
  });

  it("Purchases a listing", async () => {
    const listing = anchor.web3.Keypair.generate();
    
    // First create a listing
    await program.methods
      .createListing(amount, price)
      .accounts({
        seller: seller.publicKey,
        listing: listing.publicKey,
        mint,
        sellerTokenAccount,
        escrowTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([seller, listing])
      .rpc();

    // Then purchase it
    await program.methods
      .purchase()
      .accounts({
        buyer: buyer.publicKey,
        listing: listing.publicKey,
        seller: seller.publicKey,
        escrowTokenAccount,
        buyerTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    const listingAccount = await program.account.listing.fetch(listing.publicKey);
    assert.ok(!listingAccount.active);
  });
});