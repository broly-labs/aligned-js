import * as cbor from 'cbor';

export async function cborSerialize(value: any): Promise<Buffer> {
	const serialized = await cbor.encodeAsync(value);
	return serialized;
}

export function cborDeserialize<T>(buf: Uint8Array): T {
	const buffer = Buffer.from(buf);
	
	const deserialized = cbor.decode(buffer);
	return deserialized as T;
}
