import { Signature } from 'ethers';

export enum ProvingSystemId {
  GnarkPlonkBls12_381,
  GnarkPlonkBn254,
  Groth16Bn254,
  SP1,
  Risc0,
}

export interface VerificationDatas {
  provingSystem: ProvingSystemId;
  proof: Uint8Array;
  publicInput?: Uint8Array;
  verificationKey?: Uint8Array;
  vmProgramCode?: Uint8Array;
  proofGeneratorAddress: string;
}


export interface NoncedVerificationDatas {
  verificationData: VerificationDatas;
  nonce: bigint;
  maxFee: bigint;
  chainId: bigint;
  paymentServiceAddr: string;
}


export enum PriceEstimate {
  Min,
  Default,
  Instant,
}

export interface VerificationDataCommitment {
  proofCommitment: Uint8Array;
  pubInputCommitment: Uint8Array;
  provingSystemAuxDataCommitment: Uint8Array;
  proofGeneratorAddr: Uint8Array;
}

export interface BatchInclusionData {
  batchMerkleRoot: Uint8Array;
  batchInclusionProof: MerkleProof;
  indexInBatch: number;
}

export interface ClientMessage {
  verificationData: NoncedVerificationDatas;
  signature: Signature;
}

export interface AlignedVerificationData {
  verificationDataCommitment: VerificationDataCommitment;
  batchMerkleRoot: Uint8Array;
  batchInclusionProof: MerkleProof;
  indexInBatch: number;
}

export interface MerkleProof {
  path: Uint8Array[];
  indices: number[];
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

export type ResponseMessage = {
  type: 'ProtocolVersion';
  version: number;
} | {
  type: 'BatchInclusionData';
  data: BatchInclusionData;
} | {
  type: 'Error';
  message: string;
};