import { ethers } from 'ethers';
// import { VerificationError } from './errors';
import BatcherPaymentServiceABI from '../abi/BatcherPaymentService.json';

export async function batcherPaymentService(
  provider: ethers.Provider,
  contractAddress: string
): Promise<ethers.Contract> {
  // Verify that the contract has code at the given address
  const code = await provider.getCode(contractAddress);
  if (code === '0x') {
    // throw new VerificationError('EthereumNotAContract', { address: contractAddress });
  }

  return new ethers.Contract(
    contractAddress,
    BatcherPaymentServiceABI.abi,
    provider
  );
}