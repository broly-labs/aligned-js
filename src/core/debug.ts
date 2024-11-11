import debugs from 'debug';

const _debug = debugs('DEBUG');

export function debug(message: string) {
    const timestamp = new Date().toISOString();
    _debug(`${timestamp} - ${message}`);
}
