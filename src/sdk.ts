import { ethers, toBigInt } from 'ethers';
import { 
	AlignedVerificationData,
	Network,
	PriceEstimate,
	VerificationData,
	VerificationDataCommitment
} from "./core/types";
import { 
	ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF,
	CONSTANT_GAS_COST,
	MAX_FEE_BATCH_PROOF_NUMBER,
	MAX_FEE_DEFAULT_PROOF_NUMBER,
} from './core/constants';
import { batcherPaymentService } from './eth/batcherPaymentService';
import { alignedServiceManager } from './eth/alignedServiceManager';
import { 
	NonceError,
	ChainIdError,
	BalanceError,
	MaxFeeEstimateError,
	PaymentError,
	VerificationError,
	FileError
} from './core/errors';
import { cborSerialize } from "./communication/serialization";
import { sendMessages, receive } from "./communication/messaging";
import { checkProtocolVersion } from "./communication/protocol";
import { awaitBatchVerification } from "./communication/batch";
import { debug } from "./core/debug";
import fs from 'fs/promises';
import path from 'path';
import WebSocket from 'ws';

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
		const ethRpcProvider = new ethers.JsonRpcProvider(ethRpcUrl);
		const gasPrice = await fetchGasPrice(ethRpcProvider);

		const estimatedGasPerProof = (
			BigInt(CONSTANT_GAS_COST) + 
			BigInt(ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF) * BigInt(numProofsPerBatch)
		) / BigInt(numProofsPerBatch);

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

export async function isProofVerified(
	alignedVerificationData: AlignedVerificationData,
	network: Network,
	rpcUrl: string
): Promise<boolean> {
	try {
		const provider = new ethers.JsonRpcProvider(rpcUrl);
		const contractAddress = getAlignedServiceManagerAddress(network);
		const paymentServiceAddr = getPaymentServiceAddress(network);
		const serviceManager = await alignedServiceManager(provider, contractAddress);

		const verificationDataCommitment = alignedVerificationData.verificationDataCommitment;
		const batchMerkleRoot = Buffer.from(alignedVerificationData.batchMerkleRoot);
		const merkleProof = Buffer.concat(
			alignedVerificationData.batchInclusionProof.merklePath.map(proof => Buffer.from(proof))
		);

		const result = await serviceManager.verifyBatchInclusion(
			verificationDataCommitment.proofCommitment,
			verificationDataCommitment.publicInputCommitment,
			verificationDataCommitment.provingSystemAuxDataCommitment,
			verificationDataCommitment.proofGeneratorAddr,
			batchMerkleRoot,
			merkleProof,
			alignedVerificationData.indexInBatch,
			paymentServiceAddr
		);
		return result;
	} catch (error) {
		throw VerificationError.ethereumCallError(
			`Error during Ethereum call: ${(error as Error).message}`
		);
	}
}

/////////////////////////////////
/////////////////////////////////

export async function submitMultiple(
	batcherUrl: string,
	network: Network,
	verificationData: VerificationData[],
	maxFee: bigint[],
	wallet: ethers.Wallet,
	nonce: number
): Promise<AlignedVerificationData[]> {
	return await _submitMultiple(
		batcherUrl, network, verificationData, maxFee, wallet, nonce
	);
}

async function _submitMultiple(
	batcherUrl: string,
	network: Network,
	verificationData: VerificationData[],
	maxFee: bigint[],
	wallet: ethers.Wallet,
	nonce: number
): Promise<AlignedVerificationData[]> {
	await checkProtocolVersion(batcherUrl);

	const socket = new WebSocket(batcherUrl);
	const paymentServiceAddr = getPaymentServiceAddress(network);

	const sentVerificationData = await sendMessages(
		socket, paymentServiceAddr, verificationData, maxFee, wallet, toBigInt(nonce)
	);

	let numResponses = 0;
	let verificationDataCommitmentsRev: VerificationDataCommitment[] = 
		[...sentVerificationData]
		.reverse()
		.map(vd => VerificationDataCommitment.fromData(vd.verificationData));

	return await receive(
		socket, verificationDataCommitmentsRev.length,
		numResponses, verificationDataCommitmentsRev
	);
}

export async function submit(
	batcherUrl: string,
	network: Network,
	verificationData: VerificationData,
	maxFee: bigint,
	wallet: ethers.Wallet,
	nonce: number
): Promise<AlignedVerificationData> {
	const alignedVerificationData = await submitMultiple(
		batcherUrl, network, [verificationData], [maxFee], wallet, nonce
	);

	return alignedVerificationData[0];
}

export async function submitMultipleAndWaitVerification(
	batcherUrl: string,
	ethRpcUrl: string,
	network: Network,
	verificationData: VerificationData[],
	maxFee: bigint[],
	wallet: ethers.Wallet,
	nonce: number
): Promise<AlignedVerificationData[]> {
	const alignedVerificationData = await submitMultiple(
		batcherUrl, network, verificationData, maxFee, wallet, nonce
	);

	for (const data of alignedVerificationData) {
		await awaitBatchVerification(data, ethRpcUrl, network);
	}

	return alignedVerificationData;
}

export async function submitAndWaitVerification(
	batcherUrl: string,
	ethRpcUrl: string,
	network: Network,
	verificationData: VerificationData,
	maxFee: bigint,
	wallet: ethers.Wallet,
	nonce: number
): Promise<AlignedVerificationData> {
	const alignedVerificationData = await submitMultipleAndWaitVerification(
		batcherUrl, ethRpcUrl, network, [verificationData], [maxFee], wallet, nonce
	);

	return alignedVerificationData[0];
}

/////////////////////////////////
/////////////////////////////////

/**
 * Save the aligned verification data in both CBOR and JSON formats.
 * 
 * @param batchInclusionDataDirectoryPath - The path of the directory where the data will be saved
 * @param alignedVerificationData - The aligned verification data to be saved
 * @throws FileError if there is an error writing the data to the file
 */
export async function saveResponse(
	batchInclusionDataDirectoryPath: string,
	alignedVerificationData: AlignedVerificationData
): Promise<void> {
	try {
		await saveResponseCbor(batchInclusionDataDirectoryPath, alignedVerificationData);
		await saveResponseJson(batchInclusionDataDirectoryPath, alignedVerificationData);
	} catch (error) {
		throw FileError.ioError(path.resolve(batchInclusionDataDirectoryPath), (error as Error).message);
	}
}

async function saveResponseCbor(
	batchInclusionDataDirectoryPath: string,
	alignedVerificationData: AlignedVerificationData
): Promise<void> {
	try {
		const batchMerkleRoot = Buffer.from(alignedVerificationData.batchMerkleRoot)
			.toString('hex')
			.slice(0, 8);

		const batchInclusionDataFileName = 
			`${batchMerkleRoot}_${alignedVerificationData.indexInBatch}.cbor`;

		const batchInclusionDataPath = path.join(
			batchInclusionDataDirectoryPath,
			batchInclusionDataFileName
		);

		const data = await cborSerialize(alignedVerificationData);
		await fs.writeFile(batchInclusionDataPath, Buffer.from(data));

		debug(`Batch inclusion data written into ${batchInclusionDataPath}`);
	} catch (error) {
		throw FileError.ioError(
			path.resolve(batchInclusionDataDirectoryPath),
			(error as Error).message
		);
	}
}

async function saveResponseJson(
	batchInclusionDataDirectoryPath: string,
	alignedVerificationData: AlignedVerificationData
): Promise<void> {
	try {
		const batchMerkleRoot = Buffer.from(alignedVerificationData.batchMerkleRoot)
			.toString('hex')
			.slice(0, 8);

		const batchInclusionDataFileName = 
			`${batchMerkleRoot}_${alignedVerificationData.indexInBatch}.json`;

		const batchInclusionDataPath = path.join(
			batchInclusionDataDirectoryPath,
			batchInclusionDataFileName
		);

		const merkleProof = alignedVerificationData.batchInclusionProof.merklePath
			.map(proof => Buffer.from(proof).toString('hex'))
			.join('');

		const data = {
			proof_commitment: Buffer.from(alignedVerificationData.verificationDataCommitment.proofCommitment).toString('hex'),
			pub_input_commitment: Buffer.from(alignedVerificationData.verificationDataCommitment.publicInputCommitment).toString('hex'),
			program_id_commitment: Buffer.from(alignedVerificationData.verificationDataCommitment.provingSystemAuxDataCommitment).toString('hex'),
			proof_generator_addr: Buffer.from(alignedVerificationData.verificationDataCommitment.proofGeneratorAddr).toString('hex'),
			batch_merkle_root: Buffer.from(alignedVerificationData.batchMerkleRoot).toString('hex'),
			verification_data_batch_index: alignedVerificationData.indexInBatch,
			merkle_proof: merkleProof
		};

		await fs.writeFile(
			batchInclusionDataPath, 
			JSON.stringify(data, null, 4)
		);

		debug(`Batch inclusion data written into ${batchInclusionDataPath}`);
	} catch (error) {
		throw FileError.ioError(
			path.resolve(batchInclusionDataDirectoryPath),
			(error as Error).message
		);
	}
}
