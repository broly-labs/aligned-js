/// Batcher ///
export const AGGREGATOR_GAS_COST: bigint = BigInt(400_000);
export const BATCHER_SUBMISSION_BASE_GAS_COST: bigint = BigInt(125_000);
export const ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF: bigint = BigInt(13_000);

// % modifiers: (100% is x1, 10% is x0.1, 1000% is x10)
export const RESPOND_TO_TASK_FEE_LIMIT_PERCENTAGE_MULTIPLIER: bigint = BigInt(250); // fee_for_aggregator -> respondToTaskFeeLimit modifier
export const DEFAULT_AGGREGATOR_FEE_PERCENTAGE_MULTIPLIER: bigint = BigInt(150); // feeForAggregator modifier
export const GAS_PRICE_PERCENTAGE_MULTIPLIER: bigint = BigInt(110); // gasPrice modifier
export const PERCENTAGE_DIVIDER: bigint = BigInt(100);

export const CONSTANT_GAS_COST: bigint =
	(AGGREGATOR_GAS_COST * DEFAULT_AGGREGATOR_FEE_PERCENTAGE_MULTIPLIER) /
		PERCENTAGE_DIVIDER +
	BATCHER_SUBMISSION_BASE_GAS_COST;
export const DEFAULT_MAX_FEE_PER_PROOF: bigint =
  	ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF * BigInt(100_000_000_000); // gas_price = 100 Gwei = 0.0000001 ether (high gas price)
export const MIN_FEE_PER_PROOF: bigint =
  	ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF * BigInt(100_000_000); // gas_price = 0.1 Gwei = 0.0000000001 ether (low gas price)

/// SDK ///
/// Number of proofs we a batch for estimation.
/// This is the number of proofs in a batch of size n, where we set n = 32.
/// i.e. the user pays for the entire batch and his proof is instantly submitted.
export const MAX_FEE_BATCH_PROOF_NUMBER: number = 32;
/// Estimated number of proofs for batch submission.
/// This corresponds to the number of proofs to compute for a default max_fee.
export const MAX_FEE_DEFAULT_PROOF_NUMBER: number = 10;
