/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProofInvalidReason } from "./types"

// Types
type Address = string;
type Details = string | Record<string, any>;

class AlignedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AlignedError';
	}
}

class SubmitError extends AlignedError {
	public readonly errorType: string;
	public readonly details?: Details;

	constructor(errorType: string, details?: Details) {
		const message = `SubmitError(${errorType})${details ? `: ${typeof details === 'string' ? details : JSON.stringify(details)}` : ''}`;
		super(message);
		this.name = 'SubmitError';
		this.errorType = errorType;
		this.details = details;
	}

	// Static factory methods
	static webSocketConnectionError(error: string): SubmitError {
		return new SubmitError("WebSocketConnectionError", error);
	}

	static webSocketClosedUnexpectedly(closeFrame: string): SubmitError {
		return new SubmitError("WebSocketClosedUnexpectedlyError", closeFrame);
	}

	static ioError(path: string, error: string): SubmitError {
		return new SubmitError("IoError", { path, error });
	}

	static serializationError(error: string): SubmitError {
		return new SubmitError("SerializationError", error);
	}

	static ethereumProviderError(error: string): SubmitError {
		return new SubmitError("EthereumProviderError", error);
	}

	static hexDecodingError(error: string): SubmitError {
		return new SubmitError("HexDecodingError", error);
	}

	static walletSignerError(error: string): SubmitError {
		return new SubmitError("WalletSignerError", error);
	}

	static missingRequiredParameter(param: string): SubmitError {
		return new SubmitError("MissingRequiredParameter", param);
	}

	static unsupportedProvingSystem(system: string): SubmitError {
		return new SubmitError("UnsupportedProvingSystem", system);
	}

	static invalidEthereumAddress(address: string): SubmitError {
		return new SubmitError("InvalidEthereumAddress", address);
	}

	static protocolVersionMismatch(current: number, expected: number): SubmitError {
		return new SubmitError("ProtocolVersionMismatch", { current, expected });
	}

	static batchVerifiedEventStreamError(error: string): SubmitError {
		return new SubmitError("BatchVerifiedEventStreamError", error);
	}

	static batchVerificationTimeout(timeoutSeconds: number): SubmitError {
		return new SubmitError("BatchVerificationTimeout", { timeout_seconds: timeoutSeconds });
	}

	static noResponseFromBatcher(): SubmitError {
		return new SubmitError("NoResponseFromBatcher");
	}

	static unexpectedBatcherResponse(response: string): SubmitError {
		return new SubmitError("UnexpectedBatcherResponse", response);
	}

	static emptyVerificationDataCommitments(): SubmitError {
		return new SubmitError("EmptyVerificationDataCommitments");
	}

	static emptyVerificationDataList(): SubmitError {
		return new SubmitError("EmptyVerificationDataList");
	}

	static invalidNonce(): SubmitError {
		return new SubmitError("InvalidNonce");
	}

	static invalidMaxFee(): SubmitError {
		return new SubmitError("InvalidMaxFee");
	}

	static proofQueueFlushed(): SubmitError {
		return new SubmitError("ProofQueueFlushed");
	}

	static invalidSignature(): SubmitError {
		return new SubmitError("InvalidSignature");
	}

	static invalidChainId(): SubmitError {
		return new SubmitError("InvalidChainId");
	}

	static invalidProof(reason: ProofInvalidReason): SubmitError {
		return new SubmitError("InvalidProof", reason.toString());
	}

	static proofTooLarge(): SubmitError {
		return new SubmitError("ProofTooLarge");
	}

	static invalidReplacementMessage(): SubmitError {
		return new SubmitError("InvalidReplacementMessage");
	}

	static insufficientBalance(): SubmitError {
		return new SubmitError("InsufficientBalance");
	}

	static invalidPaymentServiceAddress(receivedAddr: Address, expectedAddr: Address): SubmitError {
		return new SubmitError("InvalidPaymentServiceAddress", { received: receivedAddr, expected: expectedAddr });
	}

	static batchSubmissionFailed(merkleRoot: string): SubmitError {
		return new SubmitError("BatchSubmissionFailed", merkleRoot);
	}

	static addToBatchError(): SubmitError {
		return new SubmitError("AddToBatchError");
	}

	static genericError(error: string): SubmitError {
		return new SubmitError("GenericError", error);
	}
}

// Verification Error class
class VerificationError extends AlignedError {
	public readonly errorType: string;
	public readonly details: any;

	constructor(errorType: string, details: any) {
		super(`VerificationError(${errorType}): ${details}`);
		this.name = 'VerificationError';
		this.errorType = errorType;
		this.details = details;
	}

	static hexDecodingError(error: string): VerificationError {
		return new VerificationError("HexDecodingError", error);
	}

	static ethereumProviderError(error: string): VerificationError {
		return new VerificationError("EthereumProviderError", error);
	}

	static ethereumCallError(error: string): VerificationError {
		return new VerificationError("EthereumCallError", error);
	}

	static ethereumNotAContract(address: Address): VerificationError {
		return new VerificationError("EthereumNotAContract", address);
	}
}

// Nonce Error class
class NonceError extends AlignedError {
	public readonly errorType: string;
	public readonly details: string;

	constructor(errorType: string, details: string) {
		super(`NonceError(${errorType}): ${details}`);
		this.name = 'NonceError';
		this.errorType = errorType;
		this.details = details;
	}

	static ethereumProviderError(error: string): NonceError {
		return new NonceError("EthereumProviderError", error);
	}

	static ethereumCallError(error: string): NonceError {
		return new NonceError("EthereumCallError", error);
	}
}

class ChainIdError extends AlignedError {
	public readonly errorType: string;
	public readonly details: string;

	constructor(errorType: string, details: string) {
		super(`ChainIdError(${errorType}): ${details}`);
		this.name = 'ChainIdError';
		this.errorType = errorType;
		this.details = details;
	}

	static ethereumProviderError(error: string): ChainIdError {
		return new ChainIdError("EthereumProviderError", error);
	}

	static ethereumCallError(error: string): ChainIdError {
		return new ChainIdError("EthereumCallError", error);
	}
}

class MaxFeeEstimateError extends AlignedError {
	public readonly errorType: string;
	public readonly details: string;

	constructor(errorType: string, details: string) {
		super(`MaxFeeEstimateError(${errorType}): ${details}`);
		this.name = 'MaxFeeEstimateError';
		this.errorType = errorType;
		this.details = details;
	}

	static ethereumProviderError(error: string): MaxFeeEstimateError {
		return new MaxFeeEstimateError("EthereumProviderError", error);
	}

	static ethereumGasPriceError(error: string): MaxFeeEstimateError {
		return new MaxFeeEstimateError("EthereumGasPriceError", error);
	}
}

class VerifySignatureError extends AlignedError {
	public readonly errorType: string;
	public readonly details: string;

	constructor(errorType: string, details: string) {
		super(`VerifySignatureError(${errorType}): ${details}`);
		this.name = 'VerifySignatureError';
		this.errorType = errorType;
		this.details = details;
	}

	static recoverTypedDataError(error: string): VerifySignatureError {
		return new VerifySignatureError("RecoverTypedDataError", error);
	}

	static encodeError(error: string): VerifySignatureError {
		return new VerifySignatureError("EncodeError", error);
	}
}

class PaymentError extends AlignedError {
	public readonly errorType: string;
	public readonly details?: string;

	constructor(errorType: string, details?: string) {
		const message = `PaymentError(${errorType})${details ? `: ${details}` : ''}`;
		super(message);
		this.name = 'PaymentError';
		this.errorType = errorType;
		this.details = details;
	}

	static sendError(error: string): PaymentError {
		return new PaymentError("SendError", error);
	}

	static submitError(error: string): PaymentError {
		return new PaymentError("SubmitError", error);
	}

	static paymentFailed(): PaymentError {
		return new PaymentError("PaymentFailed");
	}
}

class BalanceError extends AlignedError {
	public readonly errorType: string;
	public readonly details: string;

	constructor(errorType: string, details: string) {
		super(`BalanceError(${errorType}): ${details}`);
		this.name = 'BalanceError';
		this.errorType = errorType;
		this.details = details;
	}

	static ethereumProviderError(error: string): BalanceError {
		return new BalanceError("EthereumProviderError", error);
	}

	static ethereumCallError(error: string): BalanceError {
		return new BalanceError("EthereumCallError", error);
	}
}

class FileError extends AlignedError {
	public readonly errorType: string;
	public readonly details: string | Record<string, any>;

	constructor(errorType: string, details: string | Record<string, any>) {
		super(`FileError(${errorType}): ${typeof details === 'string' ? details : JSON.stringify(details)}`);
		this.name = 'FileError';
		this.errorType = errorType;
		this.details = details;
	}

	static ioError(path: string, error: string): FileError {
		return new FileError("IoError", { path, error });
	}

	static serializationError(error: string): FileError {
		return new FileError("SerializationError", error);
	}
}

export {
	AlignedError,
	SubmitError,
	VerificationError,
	NonceError,
	ChainIdError,
	MaxFeeEstimateError,
	VerifySignatureError,
	PaymentError,
	BalanceError,
	FileError,
};