#!/usr/bin/env node

const {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  Hbar,
  AccountId,
  TokenType,
  AccountInfoQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();
/*
 Purpose: This file creates a total of 4 Hedera accounts and then creates FT & NFT tokens on the Hedera network.
          1. ed25519Sender is the account that will be the SENDER and used to create a FT & NFT. It is an ED25519 account.
          2. ed25519Receiver is the account that will be the RECEIVER of the FT & NFT. It is an ED25519 account.
          3. ecdsaSender is the account that will be the SENDER and used to create a new FT & NFT. It is an ECDSA account with an alias.
          4. ecdsaReceiver is the account that will be the RECEIVER of the FT & NFT. It is an ECDSA account with an alias.
*/

const accountAndTokenCreation = async () => {
  /* -------------- Create Your Client ---------------- */
  // Grab your Hedera testnet account ID and private key from your .env file
  const myAccountId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
  const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

  // If we weren't able to grab it, we should throw a new error
  if (!myAccountId || !myPrivateKey) {
    throw new Error("Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present");
  }

  const client = Client.forTestnet();
  client.setMinBackoff(10);
  client.setMaxBackoff(100);
  client.setMaxAttempts(50);
  client.setOperator(myAccountId, myPrivateKey);

  /* -------------- Generate ED25519 Sender Account ---------------- */

  console.log('Creating ED25519 sender account');

  // Create new ED25519Sender keys
  const ed25519SenderPrivateKey = PrivateKey.generateED25519();
  const ed25519SenderPublicKey = ed25519SenderPrivateKey.publicKey;

  // Create ED25519 Sender account with 10 HBAR
  const ed25519Sender = await new AccountCreateTransaction()
    .setKey(ed25519SenderPublicKey)
    .setInitialBalance(new Hbar(10))
    .execute(client);

  // Get the ed25519 sender account ID
  const ed25519SenderReceipt = await ed25519Sender.getReceipt(client);
  const ed25519SenderAccountId = ed25519SenderReceipt.accountId;

  console.log('Created ED25519 sender account');

  /* -------------- Generate ED25519 Receiver Account ---------------- */

  console.log('Creating ED25519 receiver account');

  // Create new ED25519Receiver keys
  const ed25519ReceiverPrivateKey = PrivateKey.generateED25519();
  const ed25519ReceiverPublicKey = ed25519ReceiverPrivateKey.publicKey;

  // Create ED25519 Receiver account with 10 HBAR
  const ed25519Receiver = await new AccountCreateTransaction()
    .setKey(ed25519ReceiverPublicKey)
    .setInitialBalance(new Hbar(10))
    .execute(client);

  // Get the ed25519 receiver account ID
  const ed25519ReceiverReceipt = await ed25519Receiver.getReceipt(client);
  const ed25519ReceiverAccountId = ed25519ReceiverReceipt.accountId;

  console.log('Created ED25519 receiver account');

  /* -------------- Create Send HBAR Helper ---------------- */
  async function sendHbar(client, senderAccountId, receiverAccountId, hbarAmount) {
    const transferHbarResponse = new TransferTransaction()
      .addHbarTransfer(senderAccountId, new Hbar(-hbarAmount))
      .addHbarTransfer(receiverAccountId, new Hbar(hbarAmount))
      .execute(client);

    const transactionReceipt = await (await transferHbarResponse).getReceipt(client);
    console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());

    return transactionReceipt;
  }

  /* -------------- Generate ECDSA Sender Account with alias ---------------- */

  console.log('Creating ECDSA sender account with alias');

  // Create new ECDSA Sender keys
  const ecdsaSenderPrivateKey = PrivateKey.generateECDSA();
  const ecdsaSenderPublicKey = ecdsaSenderPrivateKey.publicKey;

  // Generate a public key alias
  const ecdsaSenderPublicKeyAlias = ecdsaSenderPublicKey.toAccountId(0, 0);

  // Create ECDSA Sender account by transferring HBAR to the ecdsa sender public key alias
  await sendHbar(client, myAccountId, ecdsaSenderPublicKeyAlias, 10);
  // Get the ECDSA Sender account ID
  const ecdsaSenderAccountInfo = await new  AccountInfoQuery()
    .setAccountId(ecdsaSenderPublicKeyAlias)
    .execute(client);

  const ecdsaSenderAccountId = ecdsaSenderAccountInfo.accountId;
 
  console.log('Created ECDSA sender account with alias');

  /* -------------- Generate ECDSA Receiver Account with alias ---------------- */

  console.log('Creating ECDSA receiver account with alias');

  const ecdsaReceiverPrivateKey = PrivateKey.generateECDSA();
  const ecdsaReceiverPublicKey = ecdsaReceiverPrivateKey.publicKey;

  // Generate a public key alias
  const ecdsaReceiverPublicKeyAlias = ecdsaReceiverPublicKey.toAccountId(0, 0);

  // Create ECDSA Receiver account by transferring HBAR to the ecdsa Receiver public key alias
  await sendHbar(client, myAccountId, ecdsaReceiverPublicKeyAlias, 10);
  // Get the ECDSA Receiver account ID
  const ecdsaReceiverAccountInfo = await new  AccountInfoQuery()
  .setAccountId(ecdsaReceiverPublicKeyAlias)
  .execute(client);

  const ecdsaReceiverAccountId = ecdsaReceiverAccountInfo.accountId;

  console.log('Created ECDSA receiver account with alias');

  /* -------------- Create Token Creation Helper ---------------- */
  const createTokensForAccount = async (client, treasuryAccountId, treasuryAccountPrivateKey) => {
    /* -------------- Create Fungible Token ---------------- */

    console.log('Creating fungible token');

    // Generate Supply Key
    const supplyKeyForFT = PrivateKey.generateED25519();

    // Create Fungible Token Type with a decimals of 1
    const createFTokenTxn = await new TokenCreateTransaction()
      .setTokenName('HederaFungible')
      .setTokenSymbol('HFun')
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(1)
      .setInitialSupply(100)
      .setTreasuryAccountId(treasuryAccountId)
      .setSupplyKey(supplyKeyForFT)
      .setMaxTransactionFee(new Hbar(30))
      .freezeWith(client)

    // Sign the transaction with the treasury account private key
    const createFTokenTxnSigned = await createFTokenTxn.sign(treasuryAccountPrivateKey);
    const createFTokenTxnResponse = await createFTokenTxnSigned.execute(client);

    // Get the receipt of the transaction
    const createFTokenTxnReceipt = await createFTokenTxnResponse.getReceipt(client);
    const createFTTokenStatus = createFTokenTxnReceipt.status.toString();
    const createFTTokenId = createFTokenTxnReceipt.tokenId;
    console.log(`Fungible Token Creation was a ${createFTTokenStatus}`);

    /* -------------- Create Non Fungible Token ---------------- */

    console.log('Creating non-fungible token');

    // IPFS content identifiers for the NFT metadata
    const metadataIPFSUrls = [
      Buffer.from("ipfs://bafkreiap62fsqxmo4hy45bmwiqolqqtkhtehghqauixvv5mcq7uofdpvt4"),
      Buffer.from("ipfs://bafkreibvluvlf36lilrqoaum54ga3nlumms34m4kab2x67f5piofmo5fsa"),
      Buffer.from("ipfs://bafkreidrqy67amvygjnvgr2mgdgqg2alaowoy34ljubot6qwf6bcf4yma4"),
      Buffer.from("ipfs://bafkreicoorrcx3d4foreggz72aedxhosuk3cjgumglstokuhw2cmz22n7u"),
      Buffer.from("ipfs://bafkreidv7k5vfn6gnj5mhahnrvhxep4okw75dwbt6o4r3rhe3ktraddf5a"),
    ];

    const supplyKeyForNFT = PrivateKey.generateED25519();

    const createNFTokenTxn = await new TokenCreateTransaction()
      .setTokenName('HederaNFT')
      .setTokenSymbol('HNFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setTreasuryAccountId(treasuryAccountId)
      .setSupplyKey(supplyKeyForNFT)
      .setAdminKey(treasuryAccountPrivateKey)
      .setMaxTransactionFee(new Hbar(30))
      .freezeWith(client);

    const createNFTokenTxnSigned = await createNFTokenTxn.sign(treasuryAccountPrivateKey);
    const createNFTokenTxnResponse = await createNFTokenTxnSigned.execute(client);
    const createNFTokenTxnReceipt = await createNFTokenTxnResponse.getReceipt(client);
    const nfTokenId = createNFTokenTxnReceipt.tokenId;

    // Create the NFT metadata
    const metadatas = metadataIPFSUrls.map(url => Buffer.from(url));

    // Mint NFTs
    const mintNFTokenTxn = await new TokenMintTransaction()
      .setTokenId(nfTokenId)
      .setMetadata(metadatas)
      .freezeWith(client);

    const mintNFTokenTxnSigned = await mintNFTokenTxn.sign(supplyKeyForNFT);
    const mintNFTokenTxnResponse = await mintNFTokenTxnSigned.execute(client);
    const mintNFTokenTxnReceipt = await mintNFTokenTxnResponse.getReceipt(client);
    const mintNFTokenStatus = mintNFTokenTxnReceipt.status.toString();
    console.log(`NFT Minting was a ${mintNFTokenStatus}`);

    return [createFTTokenId, nfTokenId]
  }

  /* -------------- Create Tokens for ED25519 Sender ---------------- */
  const [ed25519FtTokenId, ed25519NftTokenId] = await createTokensForAccount(client, ed25519SenderAccountId, ed25519SenderPrivateKey);

  /* -------------- Create Tokens for ECDSA Sender ---------------- */
  const [ecdsaFtTokenId, ecdsaNftTokenId] = await createTokensForAccount(client, ecdsaSenderAccountId, ecdsaSenderPrivateKey);

  /* -------------- Print Account Info ---------------- */
  console.log(JSON.stringify({
    ed25519: {
      sender: {
        accountId: ed25519SenderAccountId.toString(),
        privateKey: ed25519SenderPrivateKey.toString(),
        FungibleTokenId: ed25519FtTokenId.toString(),
        NftTokenId: ed25519NftTokenId.toString(),
      },
      receiver: {
        accountId: ed25519ReceiverAccountId.toString(),
        privateKey: ed25519ReceiverPrivateKey.toString(),
      },
    },
    ecdsaWithAlias: {
      sender: {
        accountId: ecdsaSenderAccountId.toString(),
        privateKey: ecdsaSenderPrivateKey.toStringRaw(),
        FungibleTokenId: ecdsaFtTokenId.toString(),
        NftTokenId: ecdsaNftTokenId.toString(),
      },
      receiver: {
        accountId: ecdsaReceiverAccountId.toString(),
        privateKey: ecdsaReceiverPrivateKey.toStringRaw(),
      }
    }
  }, null, 2))
  client.close();
}

accountAndTokenCreation();
