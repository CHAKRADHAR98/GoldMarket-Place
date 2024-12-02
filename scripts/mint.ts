import { getKeypairFromFile } from "@solana-developers/helpers";
import { createInitializeMetadataPointerInstruction, createInitializeMintInstruction, ExtensionType, getMintCloseAuthority, getMintLen, getTokenMetadata, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token";
import { createInitializeInstruction, createUpdateFieldInstruction, pack, TokenMetadata } from "@solana/spl-token-metadata";
import { Connection, Keypair, SystemProgram, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

const connection =new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = await getKeypairFromFile("/.config/solana/id.json");
console.log("payer",payer.publicKey.toBase58());
const mint = Keypair.generate();
console.log("mint",mint.publicKey.toBase58());
const metadata : TokenMetadata={
    mint: mint.publicKey,
    name: "Tokenized Gold",
    symbol: "GOLD",
    uri: "https://ivory-adorable-coyote-450.mypinata.cloud/ipfs/QmRwDCfY1pkDrRddSV1Mcg2uayLD7cY3jeZYaJdNYFkxtq",
    additionalMetadata: [
        ["Purity","24k"],
        ["Weight","1g"]
    ]
}

const mintspace= getMintLen([
    ExtensionType.MetadataPointer
]);

const metadataSpace=TYPE_SIZE+LENGTH_SIZE+pack(metadata).length;
const lamports =await connection.getMinimumBalanceForRentExemption(
  mintspace+metadataSpace  );

const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: mintspace,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID
});

const initializeMetadataPointerIx =createInitializeMetadataPointerInstruction(
    mint.publicKey,
    payer.publicKey,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID
)

const initializemintIx = createInitializeMintInstruction(
    mint.publicKey,
    2,
    payer.publicKey,
    null,
    TOKEN_2022_PROGRAM_ID)

const initializeMetadataIx = createInitializeInstruction({  
    mint: mint.publicKey,
    metadata: mint.publicKey,
    mintAuthority: payer.publicKey,        
    name: metadata.name,
    symbol: metadata.symbol,  
    uri: metadata.uri,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey  
})
const updateMetadataFields = metadata.additionalMetadata.map(([field, value]) =>
    createUpdateFieldInstruction({
        metadata: mint.publicKey,
        programId: TOKEN_2022_PROGRAM_ID,
        updateAuthority: payer.publicKey,
        field,
        value
    })
);

const transaction = new Transaction().add(
    createAccountIx,
    initializeMetadataPointerIx,
    initializemintIx,
    initializeMetadataIx,   
    ...updateMetadataFields // Spread the array to include all update instructions
)

const sig= await sendAndConfirmTransaction( 
    connection,
    transaction,
    [payer,mint]
);
console.log("sig",sig);

const chainMetadata= await getTokenMetadata(
    connection,
    mint.publicKey,
)
console.log("chainMetadata",chainMetadata);

export { createGoldToken };
