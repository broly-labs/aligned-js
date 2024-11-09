import { computeMaxFee, estimateFee, PriceEstimate } from '../src/index';

const HOLESKY_PUBLIC_RPC_URL = "https://ethereum-holesky-rpc.publicnode.com";

test('computed max fee for a larger batch is smaller', async () => {
    const smallFee = await computeMaxFee(HOLESKY_PUBLIC_RPC_URL, 2, 10);
    const largeFee = await computeMaxFee(HOLESKY_PUBLIC_RPC_URL, 5, 10);

    expect(smallFee).toBeLessThan(largeFee);
});

test('computed max fee for more proofs is larger than for fewer proofs', async () => {
    const smallFee = await computeMaxFee(HOLESKY_PUBLIC_RPC_URL, 5, 20);
    const largeFee = await computeMaxFee(HOLESKY_PUBLIC_RPC_URL, 5, 10);

    expect(smallFee).toBeLessThan(largeFee);
});

test('estimated fees increase from minimum to default to instant', async () => {
    const minFee = await estimateFee(HOLESKY_PUBLIC_RPC_URL, PriceEstimate.Min);
    const defaultFee = await estimateFee(HOLESKY_PUBLIC_RPC_URL, PriceEstimate.Default);
    const instantFee = await estimateFee(HOLESKY_PUBLIC_RPC_URL, PriceEstimate.Instant);

    expect(minFee).toBeLessThan(defaultFee);
    expect(defaultFee).toBeLessThan(instantFee);
});
