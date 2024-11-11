import { 
  AlignedVerificationData,
  Network,
} from '../core/types';
import { SubmitError } from '../core/errors';
import { isProofVerified } from '../sdk';
import { debug } from "../core/debug";

const RETRIES = 10;
const TIME_BETWEEN_RETRIES = 10;

export async function awaitBatchVerification(
    alignedVerificationData: AlignedVerificationData,
    rpcUrl: string,
    network: Network
): Promise<void> {
    for (let i = 0; i < RETRIES; i++) {
        const verified = await isProofVerified(alignedVerificationData, network, rpcUrl);
        if (verified) {
            return;
        }

        debug(
            `Proof not verified yet. Waiting ${TIME_BETWEEN_RETRIES} seconds before checking again...`
        );
        
        await new Promise(resolve => setTimeout(resolve, TIME_BETWEEN_RETRIES * 1000));
    }

    throw SubmitError.batchVerificationTimeout(TIME_BETWEEN_RETRIES * RETRIES);
}
