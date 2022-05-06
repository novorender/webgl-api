export type ArrayType = "Float32" | "Uint8" | "Uint16" | "Int16" | "Int32";

export interface BinaryArray {
    readonly type: ArrayType;
    readonly array: readonly number[];
}

export interface BinaryBase64 {
    readonly type: ArrayType;
    readonly base64: string;
}

export type BinarySource = BinaryArray | BinaryBase64 | ArrayBufferView;

function isArray(data: any): data is BinaryArray {
    return data && typeof data == "object" && "array" in data;
}

function isBase64(data: any): data is BinaryBase64 {
    return data && typeof data == "object" && "base64" in data;
}

export function isBinarySource(data: unknown): data is BinarySource {
    return ArrayBuffer.isView(data) || isArray(data) || isBase64(data);
}

export function encodeArrayBufferViewAsBase64(data: ArrayBufferView): BinaryBase64 {
    const type = data.constructor.name.slice(0, -5) as ArrayType;
    const base64 = encode(data.buffer);
    return { type, base64 } as const;
}

export function getArrayBufferView(data: BinarySource): ArrayBufferView {
    if (ArrayBuffer.isView(data)) {
        return data;
    } else if (isArray(data)) {
        return new self[`${data.type}Array`](data.array);
    } else if (isBase64(data)) {
        const buffer = decode(data.base64);
        return new self[`${data.type}Array`](buffer);
    } else {
        throw new Error(`Unknown binary source: ${data}!`);
    }
}

// from: https://github.com/niklasvh/base64-arraybuffer
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

function encode(arraybuffer: ArrayBuffer): string {
    let bytes = new Uint8Array(arraybuffer),
        i,
        len = bytes.length,
        base64 = '';

    for (i = 0; i < len; i += 3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }

    if (len % 3 === 2) {
        base64 = base64.substring(0, base64.length - 1) + '=';
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }

    return base64;
};

function decode(base64: string): ArrayBuffer {
    let bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;

    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    const arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
};