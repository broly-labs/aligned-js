/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ethers from "ethers";
import { Keccak } from "sha3";

const NONCED_VERIFICATION_DATA_TYPE = "NoncedVerificationData(bytes32 verification_data_hash,uint256 nonce,uint256 max_fee)";

export enum PriceEstimate {
	Min,
	Default,
	Instant,
}

export enum ValidityResponseMessage {
	Valid = 'Valid',
	InvalidNonce = 'InvalidNonce',
	InvalidSignature = 'InvalidSignature',
	InvalidChainId = 'InvalidChainId',
	InvalidProof = 'InvalidProof',
	InvalidMaxFee = 'InvalidMaxFee',
	InvalidReplacementMessage = 'InvalidReplacementMessage',
	AddToBatchError = 'AddToBatchError',
	ProofTooLarge = 'ProofTooLarge',
	InsufficientBalance = 'InsufficientBalance',
	EthRpcError = 'EthRpcError',
	InvalidPaymentServiceAddress = 'InvalidPaymentServiceAddress',
}

export enum ProofInvalidReason {
	RejectedProof = 'RejectedProof',
	VerifierNotSupported = 'VerifierNotSupported',
	DisabledVerifier = 'DisabledVerifier',
}

export enum Network {
	Devnet = 'devnet',
	Holesky = 'holesky',
	HoleskyStage = 'holesky-stage',
}

export type ResponseMessage = 
	| { type: 'BatchInclusionData'; data: BatchInclusionData }
	| { type: 'ProtocolVersion'; version: number }
	| { type: 'CreateNewTaskError'; error: string }
	| { type: 'InvalidProof'; reason: ProofInvalidReason }
	| { type: 'BatchReset' }
	| { type: 'Error'; message: string };

export class ResponseMessageFactory {
	static batchInclusionData(data: BatchInclusionData): ResponseMessage {
		return { type: 'BatchInclusionData', data };
	}
	
	static protocolVersion(version: number): ResponseMessage {
		return { type: 'ProtocolVersion', version };
	}
	
	static createNewTaskError(error: string): ResponseMessage {
		return { type: 'CreateNewTaskError', error };
	}
	
	static invalidProof(reason: ProofInvalidReason): ResponseMessage {
		return { type: 'InvalidProof', reason };
	}
	
	static batchReset(): ResponseMessage {
		return { type: 'BatchReset' };
	}
	
	static error(message: string): ResponseMessage {
		return { type: 'Error', message };
	}
}

export class ProvingSystemId {
	static readonly GnarkPlonkBls12_381 = 0;
	static readonly GnarkPlonkBn254 = 1;
	static readonly Groth16Bn254 = 2;
	static readonly SP1 = 3;
	static readonly Risc0 = 4;

	static toString(id: number): string {
		switch (id) {
			case this.GnarkPlonkBls12_381:
				return "GnarkPlonkBls12_381";
			case this.GnarkPlonkBn254:
				return "GnarkPlonkBn254";
			case this.Groth16Bn254:
				return "Groth16Bn254";
			case this.SP1:
				return "SP1";
			case this.Risc0:
				return "Risc0";
			default:
				throw Error("Unsupported proof system ID");
		}
	}
}

export class VerificationData {
	constructor(
		public readonly provingSystem: number,
		public readonly proof: Uint8Array | Buffer,
		public readonly publicInput: (Uint8Array | Buffer) | null | undefined,
		public readonly verificationKey: (Uint8Array | Buffer) | null | undefined,
		public readonly vmProgramCode: (Uint8Array | Buffer) | null | undefined,
		public readonly proofGeneratorAddress: string
	) {}

	static new(rawData: {
		provingSystem: number,
		proof: Uint8Array | Buffer,
		publicInput: Uint8Array | Buffer,
		verificationKey: Uint8Array | Buffer,
		vmProgramCode: Uint8Array | Buffer,
		proofGeneratorAddress: string
	}): VerificationData {
		return new VerificationData(
			rawData.provingSystem,
			rawData.proof,
			rawData.publicInput ?? null,
			rawData.verificationKey ?? null,
			rawData.vmProgramCode ?? null,
			rawData.proofGeneratorAddress
		);
	}
}

export class VerificationDataCommitment {
	constructor(
		public readonly proofCommitment: Uint8Array,
		public readonly publicInputCommitment: Uint8Array,
		public readonly provingSystemAuxDataCommitment: Uint8Array,
		public readonly proofGeneratorAddr: Uint8Array
	) {}

	static fromData(data: VerificationData): VerificationDataCommitment {
		const Hash = new Keccak(256);

		Hash.update(Buffer.from(data.proof));
		const proofCommitment = Hash.digest();
		Hash.reset();

		let publicInputCommitment = Buffer.alloc(32, 0);
		if (data.publicInput) {
			Hash.update(Buffer.from(data.publicInput));
			publicInputCommitment = Hash.digest();
			Hash.reset();
		}

		let provingSystemAuxDataCommitment = Buffer.alloc(32, 0);
		const provingSystemByte = Buffer.from([data.provingSystem]);

		if (data.vmProgramCode) {
			Hash.update(Buffer.from(data.vmProgramCode));
			Hash.update(provingSystemByte);
			provingSystemAuxDataCommitment = Hash.digest();
			Hash.reset();
		} else if (data.verificationKey) {
			Hash.update(Buffer.from(data.verificationKey));
			Hash.update(provingSystemByte);
			provingSystemAuxDataCommitment = Hash.digest();
			Hash.reset();
		}

		const proofGeneratorAddr = ethers.getBytes(data.proofGeneratorAddress);

		return new VerificationDataCommitment(
			new Uint8Array(proofCommitment),
			new Uint8Array(publicInputCommitment),
			new Uint8Array(provingSystemAuxDataCommitment),
			new Uint8Array(proofGeneratorAddr)
		);
	}

	hash(): Uint8Array {
		const Hash = new Keccak(256);
		Hash.update(Buffer.from(this.proofCommitment));
		Hash.update(Buffer.from(this.publicInputCommitment));
		Hash.update(Buffer.from(this.provingSystemAuxDataCommitment));
		Hash.update(Buffer.from(this.proofGeneratorAddr));
		return Hash.digest();
	}
}

export class VerificationCommitmentBatch {
	static hash(data: VerificationDataCommitment): Uint8Array {
		const Hash = new Keccak(256);
		Hash.update(Buffer.from(data.proofCommitment));
		Hash.update(Buffer.from(data.publicInputCommitment));
		Hash.update(Buffer.from(data.provingSystemAuxDataCommitment));
		Hash.update(Buffer.from(data.proofGeneratorAddr));
		return Hash.digest();
	}

	static hashParent(child1: Uint8Array, child2: Uint8Array): Uint8Array {
		const hasher = new Keccak(256);
		hasher.update(Buffer.from(child1));
		hasher.update(Buffer.from(child2));
		return new Uint8Array(hasher.digest());
	}
}

export class NoncedVerificationData {
	constructor(
		public readonly verificationData: VerificationData,
		public readonly nonce: bigint,
		public readonly maxFee: bigint,
		public readonly chainId: bigint,
		public readonly paymentServiceAddr: string
	) {}

	getDomain(): ethers.TypedDataDomain {
		return {
			name: "Aligned",
			version: "1",
			chainId: this.chainId,
			verifyingContract: this.paymentServiceAddr,
			salt: null
		};
	}

	static getTypeHash(): Uint8Array {
		const Hash = new Keccak(256);
		Hash.update(NONCED_VERIFICATION_DATA_TYPE);
		return Hash.digest();
	}

	getStructHash(): Uint8Array {
		const Hash = new Keccak(256);
		
		const verificationDataHash = VerificationCommitmentBatch.hash(
			VerificationDataCommitment.fromData(this.verificationData)
		);

		const typeHash = NoncedVerificationData.getTypeHash();

		const nonceBytes = new Uint8Array(32);
		const maxFeeBytes = new Uint8Array(32);
		
		for (let i = 0; i < 32; i++) {
			nonceBytes[31 - i] = Number((this.nonce >> BigInt(i * 8)) & BigInt(0xff));
			maxFeeBytes[31 - i] = Number((this.maxFee >> BigInt(i * 8)) & BigInt(0xff));
		}

		Hash.update(Buffer.from(typeHash));
		Hash.update(Buffer.from(verificationDataHash));
		Hash.update(Buffer.from(nonceBytes));
		Hash.update(Buffer.from(maxFeeBytes));

		return Hash.digest();
	}
}

export class ClientMessage {
	constructor(
		public readonly verificationData: NoncedVerificationData,
		public readonly signature: ethers.Signature
	) {}

	static async create(
		verificationData: NoncedVerificationData,
		wallet: ethers.Wallet
	): Promise<ClientMessage> {
		const domain = verificationData.getDomain();

		const types = {
			NoncedVerificationData: [
				{ name: "verification_data_hash", type: "bytes32" },
				{ name: "nonce", type: "uint256" },
				{ name: "max_fee", type: "uint256" }
			]
		};

		const verificationDataHash = VerificationCommitmentBatch.hash(
			VerificationDataCommitment.fromData(verificationData.verificationData)
		);

		const value = {
			verification_data_hash: verificationDataHash,
			nonce: verificationData.nonce,
			max_fee: verificationData.maxFee
		};

		const signature = await wallet.signTypedData(domain, types, value);

		return new ClientMessage(verificationData, ethers.Signature.from(signature));
	}

	toString(): string {
		const formatBigInt = (value: bigint) => `0x${value.toString(16)}`;

		const payload = {
			verification_data: {
				verification_data: {
					proving_system: ProvingSystemId.toString(
						this.verificationData.verificationData.provingSystem
					),
					proof: [...this.verificationData.verificationData.proof],
					pub_input: this.verificationData.verificationData.publicInput 
						? [...this.verificationData.verificationData.publicInput]
						: null,
					verification_key: this.verificationData.verificationData.verificationKey
						? [...this.verificationData.verificationData.verificationKey]
						: null,
					vm_program_code: this.verificationData.verificationData.vmProgramCode
						? [...this.verificationData.verificationData.vmProgramCode]
						: null,
					proof_generator_addr: this.verificationData.verificationData.proofGeneratorAddress,
				},
				nonce: formatBigInt(this.verificationData.nonce),
				max_fee: formatBigInt(this.verificationData.maxFee),
				chain_id: formatBigInt(this.verificationData.chainId),
				payment_service_addr: this.verificationData.paymentServiceAddr,
			},
			signature: {
				r: this.signature.r,
				s: this.signature.s,
				v: this.signature.v,
			},
		};

		return JSON.stringify(payload);
	}
}

export class Proof {
	constructor(
		public readonly merklePath: Uint8Array[]
	) {}
}

export interface MerkleTree {
	readonly root: Uint8Array;
	getProofByPos(index: number): Proof;
}

export class BatchInclusionData {
	constructor(
		public readonly batchMerkleRoot: Uint8Array,
		public readonly batchInclusionProof: Proof,
		public readonly indexInBatch: number
	) {}

	static create(
		verificationDataBatchIndex: number,
		batchMerkleTree: MerkleTree
	): BatchInclusionData {
		const batchInclusionProof = batchMerkleTree.getProofByPos(verificationDataBatchIndex);
		
		if (!batchInclusionProof) {
			throw new Error("Failed to get proof from merkle tree");
		}

		return new BatchInclusionData(
			batchMerkleTree.root,
			batchInclusionProof,
			verificationDataBatchIndex
		);
	}

	toJSON(): object {
		return {
			batchMerkleRoot: Array.from(this.batchMerkleRoot),
			batchInclusionProof: {
				merklePath: this.batchInclusionProof.merklePath.map(p => Array.from(p))
			},
			indexInBatch: this.indexInBatch
		};
	}

	static fromJSON(json: any): BatchInclusionData {
		return new BatchInclusionData(
			new Uint8Array(json.batchMerkleRoot),
			new Proof(json.batchInclusionProof.merklePath.map(
				(p: number[]) => new Uint8Array(p)
			)),
			json.indexInBatch
		);
	}

	static isInstance(data: any): data is BatchInclusionData {
		return (
			data instanceof BatchInclusionData &&
			data.batchMerkleRoot instanceof Uint8Array &&
			typeof data.indexInBatch === 'number' &&
			data.batchInclusionProof instanceof Proof &&
			Array.isArray(data.batchInclusionProof.merklePath)
		);
	}
}

export class AlignedVerificationData {
	constructor(
		public readonly verificationDataCommitment: VerificationDataCommitment,
		public readonly batchMerkleRoot: Uint8Array,
		public readonly batchInclusionProof: Proof,
		public readonly indexInBatch: number
	) {}

	static create(
		verificationDataCommitment: VerificationDataCommitment,
		inclusionData: BatchInclusionData
	): AlignedVerificationData {
		return new AlignedVerificationData(
			verificationDataCommitment,
			inclusionData.batchMerkleRoot,
			inclusionData.batchInclusionProof,
			inclusionData.indexInBatch
		);
	}

	toJSON(): string {
		return JSON.stringify({
			verification_data_commitment: {
				proof_commitment: this.verificationDataCommitment.proofCommitment,
				public_input_commitment: this.verificationDataCommitment.publicInputCommitment,
				proving_system_aux_data_commitment: this.verificationDataCommitment.provingSystemAuxDataCommitment,
				proof_generator_addr: this.verificationDataCommitment.proofGeneratorAddr
			},
			batch_merkle_root: this.batchMerkleRoot,
			batch_inclusion_proof: {
				merkle_path: this.batchInclusionProof?.merklePath?.map(p => Array.from(p)) || []
			},
			index_in_batch: this.indexInBatch
		});
	}
}

export class ProtocolVersion {
	static fromBytesBuffer(bytes: Buffer): number {
		return bytes.readInt16BE();
	}
}
