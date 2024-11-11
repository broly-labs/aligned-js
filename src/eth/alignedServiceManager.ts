import { ethers } from 'ethers';
import { VerificationError } from "../core/errors";
import AlignedLayerServiceManagerABI from '../abi/AlignedLayerServiceManager.json';

export async function alignedServiceManager(
	provider: ethers.Provider,
	contractAddress: string
): Promise<ethers.Contract> {
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      	throw VerificationError.ethereumNotAContract(contractAddress);
    }
  
    return new ethers.Contract(
		contractAddress,
		AlignedLayerServiceManagerABI.abi,
		provider
    );
}