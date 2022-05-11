import type { RendererContext } from "./context";
import { getBufferViewType } from "./util.js";

export type AttachmentType = "BACK" | `COLOR_ATTACHMENT${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;
export type PixelFormat = "ALPHA" | "RGB" | "RGBA" | "RED" | "RG" | "RED_INTEGER" | "RG_INTEGER" | "RGB_INTEGER" | "RGBA_INTEGER";
export type PixelType = "UNSIGNED_BYTE" | "UNSIGNED_SHORT_5_6_5" | "UNSIGNED_SHORT_4_4_4_4" | "UNSIGNED_SHORT_5_5_5_1" | "FLOAT" | "BYTE" | "UNSIGNED_INT_2_10_10_10_REV" | "HALF_FLOAT" | "SHORT" | "UNSIGNED_SHORT" | "INT" | "UNSIGNED_INT" | "UNSIGNED_INT_10F_11F_11F_REV" | "UNSIGNED_INT_10F_11F_11F_REV";

export interface ReadPixelsParams {
    readonly x: number;
    readonly y: number;
    readonly width?: number; // default: 1
    readonly height?: number; // default: 1
    readonly buffer?: AttachmentType; // default: COLOR_ATTACHMENT0
    readonly format?: PixelFormat; // default: RGBA
    readonly type: PixelType; // default: UNSIGNED_BYTE
}

export function readPixels(context: RendererContext, params: ReadPixelsParams) {
    const { gl } = context;
    const { x, y } = params;
    const width = params.width ?? 1;
    const height = params.height ?? 1;
    const buffer = params.buffer ?? "COLOR_ATTACHMENT0";
    const format = params.format ?? "RGBA";
    const type = params.type ?? "UNSIGNED_BYTE";
    const ctor = getBufferViewType(gl[type]);
    const buf = new ctor(width * height);
    gl.readBuffer(gl[buffer]);
    gl.readPixels(x, y, width, height, gl[format], gl[type], buf);
    return buf;
}