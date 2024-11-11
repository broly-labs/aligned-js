import WebSocket from 'ws';
import { SubmitError } from '../core/errors';
import { cborDeserialize } from './serialization';

const EXPECTED_PROTOCOL_VERSION = 4;

export async function checkProtocolVersion(batcherUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const socket = new WebSocket(batcherUrl);

            socket.on('message', async (response: Buffer) => {
                try {
                    const msg = await cborDeserialize(response);

                    if (typeof msg === 'object' && msg !== null && 'ProtocolVersion' in msg) {
                        const protocolVersion = msg['ProtocolVersion'];

                        if (Number(protocolVersion) > EXPECTED_PROTOCOL_VERSION) {
                            socket.close();
                            reject(new ProtocolVersionMismatch(Number(protocolVersion), EXPECTED_PROTOCOL_VERSION));
                            return;
                        }
                        socket.close();
                        resolve();
                    } else {
                        socket.close();
                        reject(new UnexpectedBatcherResponse());
                    }
                } catch (error) {
                    socket.close();
                    reject(SubmitError.genericError(`Error processing message: ${(error as Error).message}`));
                }
            });

            socket.on('error', (error) => {
                socket.close();
                reject(SubmitError.webSocketConnectionError(error.message));
            });

            socket.on('close', (code, reason) => {
                if (!socket.CLOSED) {
                    reject(SubmitError.genericError(
                        `WebSocket connection closed unexpectedly: ${code} ${reason}`
                    ));
                }
            });

        } catch (error) {
            reject(SubmitError.genericError(`Unexpected error: ${(error as Error).message}`));
        }
    });
}

class ProtocolVersionMismatch extends SubmitError {
    constructor(current: number, expected: number) {
        super(
            "ProtocolVersionMismatch",
            { current, expected }
        );
    }
}

class UnexpectedBatcherResponse extends SubmitError {
    constructor(message: string = "Batcher did not respond with the protocol version") {
        super("UnexpectedBatcherResponse", message);
    }
}
