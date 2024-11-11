import { ethers } from 'ethers';
import { VerificationError } from "../core/errors";
import BatcherPaymentServiceABI from '../abi/BatcherPaymentService.json';

export async function batcherPaymentService(
	provider: ethers.Provider,
	contractAddress: string
): Promise<ethers.Contract> {
	const code = await provider.getCode(contractAddress);
	if (code === '0x') {
		throw VerificationError.ethereumNotAContract(contractAddress);
	}

	return new ethers.Contract(
		contractAddress,
		BatcherPaymentServiceABI.abi,
		provider
	);
}