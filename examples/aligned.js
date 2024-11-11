import { 
    Network, depositToAligned, getNextNonce,
    estimateFee, PriceEstimate,
} from "aligned-js";
import { ethers } from 'ethers';

const RPC_API = 'https://ethereum-holesky-rpc.publicnode.com';
// Anvil
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; 

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_API);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const nonce = await getNextNonce(RPC_API, wallet.getAddress(), Network.Holesky);
    const maxFee = await estimateFee(RPC_API, PriceEstimate.Instant);

    console.log(`Nonce: ${nonce}`);
    console.log(`MaxFee: ${maxFee}`);

    const tx = await depositToAligned(
        10000000000,
        wallet,
        Network.Holesky
    );
    console.log(`Transaction Hash: ${tx.hash}`);
}

main().catch((error) => {
    console.error('Error:', error);
});
