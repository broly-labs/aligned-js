# Aligned JS

Aligned JS is a JavaScript library for interacting with the Aligned layer.

## Installation

```bash
# latest official release (main branch)
$ npm install aligned-js

# or for latest pre-release version (develop branch)
$ npm install aligned-js@next

# or for latest beta release version (beta branch)
$ npm install aligned-js@beta
```

## SDK API Reference

### submit

Submits a proof to the batcher to be verified and returns an aligned verification data struct.

```js
import { submit, Network } from "aligned-js";

async function main() {
    const alignedData = await submit(
        "BATCHER_URL",
        "NETWORK.NAME",
        "VerificationData",
        "MAX_FEE",
        "WALLET_ACCOUNT",
        "NONCE"
    );
    console.log(alignedData);
}
```

### submitMultiple

Submits multiple proofs to the batcher to be verified and returns an aligned verification data array.

```js
import { submitMultiple, Network } from "aligned-js";

async function main() {
    const alignedData = await submitMultiple(
        "BATCHER_URL",
        "NETWORK.NAME",
        "VerificationData",
        "MAX_FEE",
        "WALLET_ACCOUNT",
        "NONCE"
    );
    console.log(alignedData);
}
```

### submitAndWaitVerification

Submits a proof to the batcher to be verified, waits for the verification on ethereum and returns an aligned verification data struct.

```js
import { submitAndWaitVerification, Network } from "aligned-js";

async function main() {
    const alignedData = await submitAndWaitVerification(
        "BATCHER_URL",
        "ETH_RPC_API",
        "NETWORK.NAME",
        "VerificationData",
        "MAX_FEE",
        "WALLET_ACCOUNT",
        "NONCE"
    );
    console.log(alignedData);
}
```

### isProofVerified

Checks if the proof has been verified with Aligned and is included in the batch on-chain.

```js
import { isProofVerified, Network } from "aligned-js";

async function main() {
    const verified = await isProofVerified(
        "alignedVerificationData",
        "NETWORK.NAME",
        "ETH_RPC_API"
    );
    console.log(verified);
}
```

### getNextNonce

Returns the nonce to use for a given address.

```js
import { getNextNonce, Network } from "aligned-js";

async function main() {
    const nonce = await getNextNonce(
        "ETH_RPC_API",
        "ADDRESS",
        "NETWORK.NAME",
    );
    console.log(nonce);
}
```

### getBalanceInAligned

Queries a User's balance that was deposited in Aligned

```js
import { getBalanceInAligned, Network } from "aligned-js";

async function main() {
    const balance = await getNextNonce(
        "ADDRESS",
        "ETH_RPC_API",
        "NETWORK.NAME",
    );
    console.log(balance);
}
```

## ✏️ Contributing

If you consider to contribute to this project please read [CONTRIBUTING.md](/docs/CONTRIBUTING.md) first.

## 📜 License

Copyright (c) 2024 Broly Labs

Licensed under the [MIT license](/LICENSE).
