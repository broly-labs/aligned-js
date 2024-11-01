// Batcher
export const AGGREGATOR_GAS_COST: bigint = BigInt(400_000);
export const BATCHER_SUBMISSION_BASE_GAS_COST: bigint = BigInt(125_000);
export const ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF: bigint = BigInt(13_000);

// Percentage modifiers (100% is x1, 10% is x0.1, 1000% is x10)
export const RESPOND_TO_TASK_FEE_LIMIT_PERCENTAGE_MULTIPLIER: bigint = BigInt(250);
export const DEFAULT_AGGREGATOR_FEE_PERCENTAGE_MULTIPLIER: bigint = BigInt(150);
export const GAS_PRICE_PERCENTAGE_MULTIPLIER: bigint = BigInt(110);
export const PERCENTAGE_DIVIDER: bigint = BigInt(100);

// Calculated constants
export const CONSTANT_GAS_COST: bigint =
  (AGGREGATOR_GAS_COST * DEFAULT_AGGREGATOR_FEE_PERCENTAGE_MULTIPLIER) /
    PERCENTAGE_DIVIDER +
  BATCHER_SUBMISSION_BASE_GAS_COST;

export const DEFAULT_MAX_FEE_PER_PROOF: bigint =
  ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF * BigInt(100_000_000_000); // gas_price = 100 Gwei
export const MIN_FEE_PER_PROOF: bigint =
  ADDITIONAL_SUBMISSION_GAS_COST_PER_PROOF * BigInt(100_000_000); // gas_price = 0.1 Gwei

// SDK
export const MAX_FEE_BATCH_PROOF_NUMBER: number = 32;
export const MAX_FEE_DEFAULT_PROOF_NUMBER: number = 10;
