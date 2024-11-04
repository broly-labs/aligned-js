// import { 
//   AlignedVerificationData,
//   BatchInclusionData,
//   Network,
//   VerificationDataCommitment,
//   VerificationCommitmentBatch 
// } from '../core/types';
// import { SubmitError } from '../core/errors';
// import { isProofVerified } from '../sdk';

// const RETRIES = 10;
// const TIME_BETWEEN_RETRIES = 10;

// /**
//  * Handles batch inclusion data and updates aligned verification data
//  */
// export function handleBatchInclusionData(
//   batchInclusionData: BatchInclusionData,
//   alignedVerificationData: AlignedVerificationData[],
//   verificationDataCommitmentsRev: VerificationDataCommitment[]
// ): void {
//   Logger.debug('Received response from batcher');
//   Logger.debug(
//     `Batch merkle root: ${Buffer.from(batchInclusionData.batchMerkleRoot).toString('hex')}`
//   );
//   Logger.debug(`Index in batch: ${batchInclusionData.indexInBatch}`);

//   const verificationDataCommitment = verificationDataCommitmentsRev.pop();
//   if (!verificationDataCommitment) {
//     throw new SubmitError('EmptyVerificationDataCommitments');
//   }

//   if (verifyResponse(verificationDataCommitment, batchInclusionData)) {
//     alignedVerificationData.push(
//       AlignedVerificationData.new(
//         verificationDataCommitment,
//         batchInclusionData
//       )
//     );
//   }
// }

// /**
//  * Waits for batch verification with retries
//  */
// export async function awaitBatchVerification(
//   alignedVerificationData: AlignedVerificationData,
//   rpcUrl: string,
//   network: Network
// ): Promise<void> {
//   for (let i = 0; i < RETRIES; i++) {
//     try {
//       const isVerified = await isProofVerified(
//         alignedVerificationData,
//         network,
//         rpcUrl
//       );

//       if (isVerified) {
//         return;
//       }
//     } catch (error) {
//       // Continue with retries even if verification fails
//     }

//     Logger.debug(
//       `Proof not verified yet. Waiting ${TIME_BETWEEN_RETRIES} seconds before checking again...`
//     );
    
//     await new Promise(resolve => 
//       setTimeout(resolve, TIME_BETWEEN_RETRIES * 1000)
//     );
//   }

//   throw new SubmitError('BatchVerificationTimeout', {
//     timeoutSeconds: TIME_BETWEEN_RETRIES * RETRIES
//   });
// }

// /**
//  * Verifies that response data matches sent proof data
//  */
// function verifyResponse(
//   verificationDataCommitment: VerificationDataCommitment,
//   batchInclusionData: BatchInclusionData
// ): boolean {
//   Logger.debug('Verifying response data matches sent proof data ...');
  
//   const batchInclusionProof = { ...batchInclusionData.batchInclusionProof };

//   const isValid = verifyMerkleProof(
//     batchInclusionProof,
//     batchInclusionData.batchMerkleRoot,
//     batchInclusionData.indexInBatch,
//     verificationDataCommitment
//   );

//   if (isValid) {
//     Logger.debug('Done. Data sent matches batcher answer');
//     return true;
//   }

//   Logger.debug(
//     `Verification data commitments and batcher response with merkle root ${
//       Buffer.from(batchInclusionData.batchMerkleRoot).toString('hex')
//     } and index in batch ${
//       batchInclusionData.indexInBatch
//     } don't match`
//   );
  
//   return false;
// }

// /**
//  * Verifies a merkle proof
//  * This is a placeholder - you'll need to implement the actual merkle proof verification
//  * based on your VerificationCommitmentBatch implementation
//  */
// function verifyMerkleProof(
//   proof: any,
//   root: Uint8Array,
//   index: number,
//   leaf: VerificationDataCommitment
// ): boolean {
//   // Implement merkle proof verification logic here
//   // This should match the verification logic from your Rust implementation
//   // You might want to use the VerificationCommitmentBatch methods
//   return VerificationCommitmentBatch.verifyProof(proof, root, index, leaf);
// }

// // Logger interface - implement this based on your logging needs
// interface Logger {
//   debug(message: string): void;
// }

// // Example logger implementation
// const Logger = {
//   debug: (message: string) => {
//     console.debug(`[DEBUG] ${message}`);
//   }
// };