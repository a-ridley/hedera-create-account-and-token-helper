# Hedera Create Accounts with Tokens Helper
This project creates four Hedera Testnet accounts with a balance of 10 HBAR where two of the accounts are owners of Fungible tokens, and 4 NFTs.

### Description of Accounts Created
Accounts created:
* Account 1: An ED25519 account that acts as a **Sender**. This account is the owner of the Fungible Token created and the five minted NFTs.
* Account 2: An ED25519 account that acts as a **Receiver**. This account has zero FT's and NFTs.
* Account 3: An ECDSA account with an alias that acts as a **Sender**. This account is the owner of another Fungible Token created and another five minted NFTs.
* Account 4: An ECDSA account with an alias that acts as a **Reciever**. This account has zero FT's and NFTs.

## How to Use
1. Create a Hedera Testnet account at [portal.hedera.com](https://portal.hedera.com/register). Your account will receive 10,000 test HBAR every 24 hours.
2. Rename the `.env.example` file to `.env` and add the credentials from your Hedera Testnet account.
3. In the projects root directory run `npm i`
4. run `node index.js` to execute

**Note: Private Keys should never be shared pubicly.**

## Sample Output
```JSON
{
  "ed25519": {
    "sender": {
      "accountId": "0.0.xxxxxxxx",
      "privateKey": "302...",
      "FungibleTokenId": "0.0.xxxxxxxx",
      "NftTokenId": "0.0.xxxxxxxx"
    },
    "receiver": {
      "accountId": "0.0.xxxxxxxx",
      "privateKey": "302..."
    }
  },
  "ecdsaWithAlias": {
    "sender": {
      "accountId": "0.0.xxxxxxxx",
      "privateKey": "...hexadecimal string of length 64...",
      "FungibleTokenId": "0.0.xxxxxxxx",
      "NftTokenId": "0.0.xxxxxxxx"
    },
    "receiver": {
      "accountId": "0.0.xxxxxxxx",
      "privateKey": "...hexadecimal string of length 64..."
    }
  }
}
```
