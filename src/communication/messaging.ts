/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import WebSocket from 'ws';
import {
    AlignedVerificationData,
    ClientMessage,
    NoncedVerificationData,
    BatchInclusionData,
    ValidityResponseMessage,
    VerificationData,
    VerificationDataCommitment,
    Proof,
    ProofInvalidReason
} from '../core/types';
import { cborDeserialize, cborSerialize } from "./serialization";
import { SubmitError } from "../core/errors";
import { debug } from "../core/debug";

export async function sendMessages(
    socket: WebSocket,
    paymentServiceAddr: string,
    verificationData: VerificationData[],
    maxFees: bigint[],
    wallet: ethers.Wallet,
    nonce: bigint
): Promise<NoncedVerificationData[]> {
    const sentVerificationData: NoncedVerificationData[] = [];

    const chainId = (await wallet.provider.getNetwork()).chainId;

    for (let idx = 0; idx < verificationData.length; idx++) {
        const data = verificationData[idx];
        const noncedData = new NoncedVerificationData(
            data,
            nonce,
            maxFees[idx],
            chainId,
            paymentServiceAddr
        );
        nonce++;

        const clientMsg = await ClientMessage.create(noncedData, wallet);
        const msgBin = await cborSerialize(JSON.parse(clientMsg.toString()));
        
        await new Promise<void>((resolve, reject) => {
            const isSocketOpen = socket.readyState === WebSocket.OPEN;

            if (!isSocketOpen) {
                socket.addEventListener('open', () => {
                    socket.send(msgBin);
                    debug('Message sent...');
                });
            } else {
                socket.send(msgBin);
                debug('Message sent...');
            }
            
            const messageHandler = async (message: Buffer | Uint8Array) => {
                try {
                    const responseMsg = await cborDeserialize(message);

                    if (responseMsg["ProtocolVersion"] !== undefined) {
                        return;
                    }

                    if (responseMsg == ValidityResponseMessage.Valid) {
                        socket.removeListener('message', messageHandler);
                        resolve();
                        return;
                    } else if (responseMsg["InvalidProof"] === ProofInvalidReason.RejectedProof) {
                        reject(SubmitError.invalidProof(ProofInvalidReason.RejectedProof));
                    } else if (responseMsg["InvalidProof"] === ProofInvalidReason.VerifierNotSupported) {
                        reject(SubmitError.invalidProof(ProofInvalidReason.VerifierNotSupported));
                    } else if (responseMsg["InvalidProof"] === ProofInvalidReason.DisabledVerifier) {
                        reject(SubmitError.invalidProof(ProofInvalidReason.DisabledVerifier));
                    } else {
                        handleResponseError(responseMsg);
                    }
                } catch (error) {
                    reject(SubmitError.webSocketClosedUnexpectedly(error));
                }
            };

            socket.on('message', messageHandler);
            socket.on('error', (error) => {
                reject(SubmitError.webSocketConnectionError(error.message));
            });
        });

        sentVerificationData.push(noncedData);
    }

    return sentVerificationData;
}

export async function receive(
    socket: WebSocket,
    totalMessages: number,
    numResponses: number,
    verificationDataCommitmentsRev: VerificationDataCommitment[]
): Promise<AlignedVerificationData[]> {
    const alignedVerificationData: AlignedVerificationData[] = [];

    try {
        await new Promise<void>((resolve, reject) => {
            socket.on('message', async (message: Buffer | Uint8Array) => {
                try {
                    numResponses++;
                    const responseMsg = await cborDeserialize(message);

                    if (responseMsg["BatchInclusionData"]) {
                        const merklePpath = new Proof(
                            responseMsg["BatchInclusionData"]["batch_inclusion_proof"]["merkle_path"]
                        )
                        const inclusionData = new BatchInclusionData(
                            responseMsg["BatchInclusionData"]["batch_merkle_root"],
                            merklePpath,
                            responseMsg["BatchInclusionData"]["index_in_batch"]
                        );

                        alignedVerificationData.push(
                            AlignedVerificationData.create(
                                verificationDataCommitmentsRev[0],
                                inclusionData,
                            )
                        );

                        if (numResponses >= totalMessages) {
                            socket.close();
                            resolve();
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            });

            socket.on('error', reject);
            socket.on('close', () => {
                debug("WebSocket connection closed.");
                resolve();
            });
        });
    } catch (error) {
        socket.close();
        throw SubmitError.webSocketConnectionError(error);
    }

    return alignedVerificationData;
}

function handleResponseError(responseMsg: any): never {
    if (responseMsg === ValidityResponseMessage.InvalidSignature) {
        throw SubmitError.invalidSignature();
    } else if (responseMsg === ValidityResponseMessage.InvalidNonce) {
        throw SubmitError.invalidNonce();
    } else if (responseMsg === ValidityResponseMessage.ProofTooLarge) {
        throw SubmitError.proofTooLarge();
    } else if (responseMsg === ValidityResponseMessage.InvalidProof) {
        throw SubmitError.invalidProof(responseMsg.reason);
    } else if (responseMsg === ValidityResponseMessage.InvalidMaxFee) {
        throw SubmitError.invalidMaxFee();
    } else if (responseMsg === ValidityResponseMessage.InsufficientBalance) {
        throw SubmitError.insufficientBalance();
    } else if (responseMsg === ValidityResponseMessage.InvalidChainId) {
        throw SubmitError.invalidChainId();
    } else if (responseMsg === ValidityResponseMessage.InvalidReplacementMessage) {
        throw SubmitError.invalidReplacementMessage();
    } else if (responseMsg === ValidityResponseMessage.AddToBatchError) {
        throw SubmitError.addToBatchError();
    } else if (responseMsg === ValidityResponseMessage.EthRpcError) {
        throw SubmitError.ethereumProviderError("Batcher experienced Eth RPC connection error");
    } else if (responseMsg === ValidityResponseMessage.InvalidPaymentServiceAddress) {
        throw SubmitError.invalidPaymentServiceAddress(
            responseMsg.received_addr,
            responseMsg.expected_addr
        );
    }

    throw SubmitError.genericError(`Unknown error response: ${JSON.stringify(responseMsg)}`);
}
