export class NonceError extends Error {
  constructor(
    public type: 'EthereumProviderError' | 'EthereumCallError',
    public details: string
  ) {
    super(`NonceError(${type}): ${details}`);
    this.name = 'NonceError';
  }
}

export class ChainIdError extends Error {
  constructor(
    public type: 'EthereumProviderError' | 'EthereumCallError',
    public details: string
  ) {
    super(`ChainIdError(${type}): ${details}`);
    this.name = 'ChainIdError';
  }
}

export class BalanceError extends Error {
  constructor(
    public type: 'EthereumProviderError' | 'EthereumCallError',
    public details: string
  ) {
    super(`BalanceError(${type}): ${details}`);
    this.name = 'BalanceError';
  }
}

export class MaxFeeEstimateError extends Error {
  constructor(
    public type: 'EthereumProviderError' | 'EthereumGasPriceError',
    public details: string
  ) {
    super(`MaxFeeEstimateError(${type}): ${details}`);
    this.name = 'MaxFeeEstimateError';
  }
}

export class PaymentError extends Error {
  constructor(
    public type: 'SendError' | 'SubmitError' | 'PaymentFailed',
    public details?: string
  ) {
    super(`PaymentError(${type})${details ? ': ' + details : ''}`);
    this.name = 'PaymentError';
  }
}

export class FileError extends Error {
  constructor(
    public type: 'WriteError' | 'ReadError',
    public details: string
  ) {
    super(`FileError(${type}): ${details}`);
    this.name = 'FileError';
  }
}


export class SubmitError extends Error {
  constructor(
    public type: SubmitErrorType,
    public details?: string | Record<string, unknown>
  ) {
    super(`SubmitError(${type})${details ? ': ' + (typeof details === 'string' ? details : JSON.stringify(details)) : ''}`);
    this.name = 'SubmitError';
  }
}

export type SubmitErrorType = 
  | 'MissingRequiredParameter'
  | 'ProtocolVersionMismatch'
  | 'UnexpectedBatcherResponse'
  | 'SerializationError'
  | 'WebSocketConnectionError'
  | 'WebSocketClosedUnexpectedlyError'
  | 'InvalidSignature'
  | 'InvalidNonce'
  | 'InvalidMaxFee'
  | 'InvalidProof'
  | 'ProofTooLarge'
  | 'InsufficientBalance'
  | 'ProofQueueFlushed'
  | 'GenericError'
  | 'BatchVerificationTimeout'
  | 'InvalidChainId'
  | 'InvalidReplacementMessage'
  | 'AddToBatchError'
  | 'EthereumProviderError'
  | 'InvalidPaymentServiceAddress';

export interface ResponseStreamError {
  code: number;
  reason?: string;
}

