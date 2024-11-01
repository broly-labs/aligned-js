import { ethers } from 'ethers';
import { 
  Network, 
  PriceEstimate, 
} from './core/types';
import { 
  ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF,
  CONSTANT_GAS_COST,
  MAX_FEE_BATCH_PROOF_NUMBER,
  MAX_FEE_DEFAULT_PROOF_NUMBER,
} from './core/constants';
import { batcherPaymentService } from './eth/batcherPaymentService';
import { 
  NonceError,
  ChainIdError,
  BalanceError,
  MaxFeeEstimateError,
  PaymentError,
} from './core/errors';

export function getPaymentServiceAddress(network: Network): string {
  switch (network) {
    case Network.Devnet:
      return '0x7969c5eD335650692Bc04293B07F5BF2e7A673C0';
    case Network.Holesky:
      return '0x815aeCA64a974297942D2Bbf034ABEe22a38A003';
    case Network.HoleskyStage:
      return '0x7577Ec4ccC1E6C529162ec8019A49C13F6DAd98b';
  }
}

export function getAlignedServiceManagerAddress(network: Network): string {
  switch (network) {
    case Network.Devnet:
      return '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8';
    case Network.Holesky:
      return '0x58F280BeBE9B34c9939C3C39e0890C81f163B623';
    case Network.HoleskyStage:
      return '0x9C5231FC88059C086Ea95712d105A2026048c39B';
  }
}

export async function getNextNonce(
  ethRpcUrl: string,
  submitterAddr: string,
  network: Network
): Promise<bigint> {
  try {
    const provider = new ethers.JsonRpcProvider(ethRpcUrl);
    const paymentServiceAddress = getPaymentServiceAddress(network);

    const contract = await batcherPaymentService(provider, paymentServiceAddress);
    const result = await contract.user_nonces(submitterAddr);
    return result;
  } catch (e) {
    if (e instanceof Error) {
      throw new NonceError('EthereumCallError', e.message);
    }
    throw new NonceError('EthereumProviderError', 'Unknown error');
  }
}

export async function getChainId(ethRpcUrl: string): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(ethRpcUrl);
    const chainId = await provider.getNetwork()
      .then(network => network.chainId);
    return Number(chainId);
  } catch (e) {
    if (e instanceof Error) {
      throw new ChainIdError('EthereumCallError', e.message);
    }
    throw new ChainIdError('EthereumProviderError', 'Unknown error');
  }
}

export async function getBalanceInAligned(
  user: string,
  ethRpcUrl: string,
  network: Network
): Promise<bigint> {
  try {
    const provider = new ethers.JsonRpcProvider(ethRpcUrl);
    const paymentServiceAddress = getPaymentServiceAddress(network);

    const contract = await batcherPaymentService(provider, paymentServiceAddress);
    const result = await contract.user_balances(user);
    return result;
  } catch (e) {
    if (e instanceof Error) {
      throw new BalanceError('EthereumCallError', e.message);
    }
    throw new BalanceError('EthereumProviderError', 'Unknown error');
  }
}

export function getVkCommitment(
  verificationKeyBytes: Uint8Array,
  provingSystem: number
): Uint8Array {
  // Create a new array with proving system byte
  const dataToHash = new Uint8Array(verificationKeyBytes.length + 1);
  dataToHash.set(verificationKeyBytes);
  dataToHash.set([provingSystem], verificationKeyBytes.length);
  
  // Use ethers to hash the data
  const hash = ethers.keccak256(dataToHash);
  return ethers.getBytes(hash);
}

async function fetchGasPrice(
  ethRpcProvider: ethers.Provider
): Promise<bigint> {
  try {
    const feeData = await ethRpcProvider.getFeeData();
    if (!feeData.gasPrice) {
      throw new Error('Failed to get gas price');
    }
    return feeData.gasPrice;
  } catch (e) {
    if (e instanceof Error) {
      throw new MaxFeeEstimateError('EthereumGasPriceError', e.message);
    }
    throw new MaxFeeEstimateError('EthereumGasPriceError', 'Unknown error');
  }
}

export async function feePerProof(
  ethRpcUrl: string,
  numProofsPerBatch: number
): Promise<bigint> {
  try {
    // Create provider from URL
    const ethRpcProvider = new ethers.JsonRpcProvider(ethRpcUrl);

    // Get gas price
    const gasPrice = await fetchGasPrice(ethRpcProvider);

    // Cost for estimate numProofsPerBatch proofs
    const estimatedGasPerProof = (
      BigInt(CONSTANT_GAS_COST) + 
      BigInt(ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF) * BigInt(numProofsPerBatch)
    ) / BigInt(numProofsPerBatch);

    // Price of 1 proof in batch
    const feePerProof = estimatedGasPerProof * gasPrice;

    return feePerProof;
  } catch (e) {
    if (e instanceof MaxFeeEstimateError) {
      throw e;
    }
    if (e instanceof Error) {
      throw new MaxFeeEstimateError('EthereumProviderError', e.message);
    }
    throw new MaxFeeEstimateError('EthereumProviderError', 'Unknown error');
  }
}

export async function estimateFee(
  ethRpcUrl: string,
  estimate: PriceEstimate
): Promise<bigint> {
  // Price of 1 proof in 32 proof batch
  const feePer = await feePerProof(ethRpcUrl, MAX_FEE_BATCH_PROOF_NUMBER);

  const proofPrice = (() => {
    switch (estimate) {
      case PriceEstimate.Min:
        return feePer;
      case PriceEstimate.Default:
        return feePer * BigInt(MAX_FEE_DEFAULT_PROOF_NUMBER);
      case PriceEstimate.Instant:
        return feePer * BigInt(MAX_FEE_BATCH_PROOF_NUMBER);
    }
  })();

  return proofPrice;
}

export async function computeMaxFee(
  ethRpcUrl: string,
  numProofs: number,
  numProofsPerBatch: number
): Promise<bigint> {
  const feePerProofValue = await feePerProof(ethRpcUrl, numProofsPerBatch);
  return feePerProofValue * BigInt(numProofs);
}

export async function depositToAligned(
  amount: bigint,
  signer: ethers.Signer,
  network: Network
): Promise<ethers.TransactionReceipt> {
  try {
    const paymentServiceAddress = getPaymentServiceAddress(network);
    const tx = await signer.sendTransaction({
      to: paymentServiceAddress,
      value: amount
    });
    
    const receipt = await tx.wait();
    if (!receipt) {
      throw new PaymentError('PaymentFailed');
    }
    
    return receipt;
  } catch (e) {
    if (e instanceof PaymentError) {
      throw e;
    }
    if (e instanceof Error) {
      throw new PaymentError('SendError', e.message);
    }
    throw new PaymentError('SendError', 'Unknown error');
  }
}

// export async function saveResponse(
//   batchInclusionDataDirectoryPath: string,
//   alignedVerificationData: AlignedVerificationData
// ): Promise<void> {
//   await Promise.all([
//     saveResponseCbor(batchInclusionDataDirectoryPath, alignedVerificationData),
//     saveResponseJson(batchInclusionDataDirectoryPath, alignedVerificationData)
//   ]);
// }

// async function saveResponseCbor(
//   batchInclusionDataDirectoryPath: string,
//   alignedVerificationData: AlignedVerificationData
// ): Promise<void> {
//   try {
//     const batchMerkleRoot = Buffer.from(alignedVerificationData.batchMerkleRoot)
//       .toString('hex')
//       .slice(0, 8);
      
//     const fileName = `${batchMerkleRoot}_${alignedVerificationData.indexInBatch}.cbor`;
//     const filePath = path.join(batchInclusionDataDirectoryPath, fileName);

//     const data = await cborSerialize(alignedVerificationData);
//     await fs.writeFile(filePath, Buffer.from(data));
    
//     console.info(`Batch inclusion data written into ${filePath}`);
//   } catch (e) {
//     throw new FileError('WriteError', e instanceof Error ? e.message : 'Unknown error');
//   }
// }

// async function saveResponseJson(
//   batchInclusionDataDirectoryPath: string,
//   alignedVerificationData: AlignedVerificationData
// ): Promise<void> {
//   try {
//     const batchMerkleRoot = Buffer.from(alignedVerificationData.batchMerkleRoot)
//       .toString('hex')
//       .slice(0, 8);
      
//     const fileName = `${batchMerkleRoot}_${alignedVerificationData.indexInBatch}.json`;
//     const filePath = path.join(batchInclusionDataDirectoryPath, fileName);

//     const merkleProof = alignedVerificationData
//       .batchInclusionProof.merkle_path
//       .map(path => Buffer.from(path).toString('hex'))
//       .join('');

//     const data = {
//       proof_commitment: Buffer.from(alignedVerificationData.verificationDataCommitment.proofCommitment).toString('hex'),
//       pub_input_commitment: Buffer.from(alignedVerificationData.verificationDataCommitment.pubInputCommitment).toString('hex'),
//       program_id_commitment: Buffer.from(alignedVerificationData.verificationDataCommitment.provingSystemAuxDataCommitment).toString('hex'),
//       proof_generator_addr: Buffer.from(alignedVerificationData.verificationDataCommitment.proofGeneratorAddr).toString('hex'),
//       batch_merkle_root: Buffer.from(alignedVerificationData.batchMerkleRoot).toString('hex'),
//       verification_data_batch_index: alignedVerificationData.indexInBatch,
//       merkle_proof: merkleProof
//     };

//     await fs.writeFile(filePath, JSON.stringify(data, null, 2));
//     console.info(`Batch inclusion data written into ${filePath}`);
//   } catch (e) {
//     throw new FileError('WriteError', e instanceof Error ? e.message : 'Unknown error');
//   }
// }
