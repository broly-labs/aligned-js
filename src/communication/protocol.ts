import WebSocket from 'ws';
import { ResponseMessage } from '../core/types';
import { cborDeserialize } from './serialization';

export const EXPECTED_PROTOCOL_VERSION = 4;

export async function checkProtocolVersion(wsRead: string): Promise<void> {
  return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsRead);

      ws.on('message', async (data: Buffer) => {
          try {
              // Deserialize CBOR data
              const msg = cborDeserialize<ResponseMessage>(new Uint8Array(data));

              // Check if the deserialized data is an object and has the correct key
              if (typeof msg === 'object' && msg !== null && 'ProtocolVersion' in msg) {
                  const protocolVersion = (msg).ProtocolVersion;

                  if (protocolVersion === EXPECTED_PROTOCOL_VERSION) {
                      resolve();
                  } else {
                      reject(`Protocol version mismatch: received ${protocolVersion}, expected ${EXPECTED_PROTOCOL_VERSION}`);
                  }
              } else {
                  reject("Unexpected message format or missing 'ProtocolVersion' key");
              }
          } catch (e) {
              reject(e);
          } finally {
              ws.close();
          }
      });

      ws.on('error', (error) => {
          reject(`WebSocket error: ${error.message}`);
          ws.close();
      });

      // Set a timeout for response
      setTimeout(() => {
          reject("No response received within timeout");
          ws.close();
      }, 5000); // 5 second timeout
  });
}
