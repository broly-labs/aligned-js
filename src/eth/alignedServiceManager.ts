import { ethers } from 'ethers';
import AlignedLayerServiceManagerABI from '../abi/AlignedLayerServiceManager.json';

export async function alignedServiceManager(
    provider: ethers.Provider,
    contractAddress: string
  ): Promise<ethers.Contract> {
    // Verify that the contract has code at the given address
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      //
    }
  
    return new ethers.Contract(
      contractAddress,
      AlignedLayerServiceManagerABI.abi,
      provider
    );
}