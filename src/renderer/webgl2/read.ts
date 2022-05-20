import type { RendererContext } from ".";
import type { Pixels } from "..";
import { getPixelFormatChannels, getBufferViewType } from "./util.js";

export type AttachmentType = "BACK" | `COLOR_ATTACHMENT${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;
export type PixelFormat = "ALPHA" | "RGB" | "RGBA" | "RED" | "RG" | "RED_INTEGER" | "RG_INTEGER" | "RGB_INTEGER" | "RGBA_INTEGER";
export type PixelType = "UNSIGNED_BYTE" | "UNSIGNED_SHORT_5_6_5" | "UNSIGNED_SHORT_4_4_4_4" | "UNSIGNED_SHORT_5_5_5_1" | "FLOAT" | "BYTE" | "UNSIGNED_INT_2_10_10_10_REV" | "HALF_FLOAT" | "SHORT" | "UNSIGNED_SHORT" | "INT" | "UNSIGNED_INT" | "UNSIGNED_INT_10F_11F_11F_REV" | "UNSIGNED_INT_10F_11F_11F_REV";

export interface ReadPixelsParams {
    readonly x: number;
    readonly y: number;
    readonly width?: number; // default: 1
    readonly height?: number; // default: 1
    readonly buffer?: AttachmentType; // default: BACK
    readonly format?: PixelFormat; // default: RGBA
    readonly type?: PixelType; // default: UNSIGNED_BYTE
}

interface PolledPromise<T> {
    readonly promise: Promise<T>;
    poll(): boolean;
}

export function readPixelsAsync(context: RendererContext, params: ReadPixelsParams): PolledPromise<Pixels> {
    const { gl } = context;
    const { x, y } = params;
    const width = params.width ?? 1;
    const height = params.height ?? 1;
    const buffer = params.buffer ?? "BACK";
    const format = params.format ?? "RGBA";
    const type = params.type ?? "UNSIGNED_BYTE";
    const srcByteOffset = 0;
    const dstOffset = 0;
    const channels = getPixelFormatChannels(gl[format]);
    const ctor = getBufferViewType(gl[type]);
    const pixels = new ctor(width * height * channels);
    const target = gl.PIXEL_PACK_BUFFER;

    const buf = gl.createBuffer();
    if (!buf)
        throw new Error("Could not create buffer!");

    gl.bindBuffer(target, buf);
    gl.bufferData(target, pixels.byteLength, gl.STREAM_READ);
    gl.readBuffer(gl[buffer]);
    gl.readPixels(x, y, width, height, gl[format], gl[type], 0);
    gl.bindBuffer(target, null);

    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!;
    if (!sync)
        throw new Error("Could not create fence sync!");

    gl.flush();

    let poll: (() => boolean) = undefined!;

    const waitPromise = new Promise<void>((resolve, reject) => {
        poll = () => {
            const res = gl.clientWaitSync(sync, 0, 0);
            if (res == gl.WAIT_FAILED) {
                reject();
                return true;
            }
            if (res == gl.TIMEOUT_EXPIRED) {
                return false;
            }
            resolve();
            return true;
        }
    });

    const promise = waitPromise.then(() => {
        gl.deleteSync(sync);
        gl.bindBuffer(target, buf);
        gl.getBufferSubData(target, srcByteOffset, pixels, dstOffset, length);
        gl.bindBuffer(target, null);
        gl.deleteBuffer(buf);
        return pixels;
    });

    return { promise, poll };
}


// async function getBufferSubDataAsync(gl: WebGL2RenderingContext, target: number, buffer: WebGLBuffer, srcByteOffset: number, dstBuffer: ArrayBufferView, dstOffset?: number, length?: number): PolledPromise<Pixels> {
//     const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
//     if (!sync)
//         throw new Error("Could not create fence sync!");

//     gl.flush();
//     let poll: (() => boolean) = undefined!;

//     const waitPromise = new Promise<void>((resolve, reject) => {
//         poll = () => {
//             const res = gl.clientWaitSync(sync, 0, 0);
//             if (res == gl.WAIT_FAILED) {
//                 reject();
//                 return true;
//             }
//             if (res == gl.TIMEOUT_EXPIRED) {
//                 return false;
//             }
//             resolve();
//             return true;
//         }
//     });

//     const promise = waitPromise.then(() => {
//         gl.deleteSync(sync);
//         gl.bindBuffer(target, buffer);
//         gl.getBufferSubData(target, srcByteOffset, dstBuffer, dstOffset, length);
//         gl.bindBuffer(target, null);
//         gl.deleteBuffer(buffer);
//     });

//     return { promise, poll! } as const;
// }

// function clientWaitAsync(gl: WebGL2RenderingContext, sync: WebGLSync, flags: number, interval_ms: number): Promise<void> {
//     return new Promise((resolve, reject) => {
//         resolve
//         function test() {
//             const res = gl.clientWaitSync(sync, flags, 0);
//             if (res == gl.WAIT_FAILED) {
//                 reject();
//                 return;
//             }
//             if (res == gl.TIMEOUT_EXPIRED) {
//                 setTimeout(test, interval_ms);
//                 return;
//             }
//             resolve();
//         }
//         test()
//     });
// }
