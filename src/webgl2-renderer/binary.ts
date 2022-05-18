import type { BlobIndex } from "./renderer.js";

export type ArrayType = "Float32" | "Uint8" | "Uint16" | "Int16" | "Int32";

export interface BinaryArray {
    readonly type?: ArrayType;
    readonly array: readonly number[];
}

export interface BinaryBase64 {
    readonly type?: ArrayType;
    readonly base64: string;
}

export interface BinaryBlob {
    readonly blob: BlobIndex;
}

export type BinaryData = BinaryArray | BinaryBase64 | BufferSource;
export type BinarySource = BinaryData | BinaryBlob;

function isArrayBuffer(data: any): data is ArrayBuffer {
    return data && typeof data == "object" && data instanceof ArrayBuffer;
}

function isBufferSource(data: any): data is BufferSource {
    return isArrayBuffer(data) || ArrayBuffer.isView(data);
}

function isArray(data: any): data is BinaryArray {
    return data && typeof data == "object" && "array" in data;
}

function isBase64(data: any): data is BinaryBase64 {
    return data && typeof data == "object" && "base64" in data;
}

function isBlob(data: any): data is BinaryBlob {
    return data && typeof data == "object" && "blob" in data;
}

export function isBinaryData(data: unknown): data is BinaryData {
    return isBufferSource(data) || isArray(data) || isBase64(data);
}

export function isBinarySource(data: unknown): data is BinarySource {
    return isBufferSource(data) || isArray(data) || isBase64(data) || isBlob(data);
}

export function encodeArrayBufferViewAsBase64(data: BufferSource): BinaryBase64 {
    const type = isArrayBuffer(data) ? undefined : data.constructor.name.slice(0, -5) as ArrayType;
    const base64 = encode(ArrayBuffer.isView(data) ? data.buffer : data);
    return type ? { type, base64 } as const : { base64 } as const;
}

export function getBufferData(data: BinaryData): ArrayBuffer {
    if (isBufferSource(data)) {
        return ArrayBuffer.isView(data) ? data.buffer : data;
    } else if (isArray(data)) {
        const type = data.type ?? "Uint8";
        const view = new self[`${type}Array`](data.array);
        return data.type ? view : view.buffer;
    } else if (isBase64(data)) {
        const buffer = decode(data.base64);
        const type = data.type ?? "Uint8";
        const view = new self[`${type}Array`](buffer);
        return data.type ? view : view.buffer;
    } else {
        throw new Error(`Unknown binary data: ${data}!`);
    }
}


export function getBufferSource(context: { readonly blobs: readonly (ArrayBuffer | null)[] }, data: BinarySource): BufferSource {
    if (isBufferSource(data)) {
        return data;
    } else if (isArray(data)) {
        const type = data.type ?? "Uint8";
        const view = new self[`${type}Array`](data.array);
        return data.type ? view : view.buffer;
    } else if (isBase64(data)) {
        const buffer = decode(data.base64);
        const type = data.type ?? "Uint8";
        const view = new self[`${type}Array`](buffer);
        return data.type ? view : view.buffer;
    } else if (isBlob(data)) {
        const buffer = context.blobs[data.blob]!;
        console.assert(buffer);
        return buffer;
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