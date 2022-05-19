import type { Renderer } from ".";
import { createAllocators } from "./allocator.js";
import { encodeArrayBufferViewAsBase64, getBufferSource, isBinaryData } from "./binary.js";

export function createJsonRenderer(commands: string[], width: number, height: number): Renderer {
    const target = new JsonRenderer(commands, width, height);
    return new Proxy(target, handler) as unknown as Renderer;
}

const handler = {
    get: function (target: JsonRenderer, prop: keyof JsonRenderer, receiver: any) {
        if (prop in target)
            return target[prop];
        return function (...args: any[]) {
            target.serialize(prop, ...args);
            if (prop.startsWith("create")) {
                return args[0];
            }
        }
    },
}

function encodeBinariesAsBase64(context: { readonly blobs: readonly (ArrayBuffer | null)[] }, params: any) {
    if (typeof params == "object") {
        for (let key in params) {
            const value = params[key];
            if (isBinaryData(value)) {
                const dataView = getBufferSource(context, value);
                const base64Binary = encodeArrayBufferViewAsBase64(dataView);
                params[key] = base64Binary;
            } else {
                encodeBinariesAsBase64(context, value);
            }
        }
    }
}

export class JsonRenderer {
    readonly #context = {
        blobs: [] as (ArrayBuffer | null)[]
    }
    readonly allocators = createAllocators();

    constructor(readonly commands: string[], readonly width: number, readonly height: number) {
    }

    dispose() {
    }

    serialize(func: string, ...args: any[]) {
        encodeBinariesAsBase64(this.#context, args[args.length - 1]);
        const json = JSON.stringify([func, ...args]);
        this.commands.push(json);
    }
}