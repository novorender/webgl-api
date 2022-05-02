import type { RendererContext } from "./renderer";

export interface ClearParamsColor {
    readonly buffer: "COLOR";
    readonly drawBuffer: number; // 0 - MAX_DRAW_BUFFERS
    readonly color: readonly [red: number, green: number, blue: number, alpha: number];
    readonly type?: "Int" | "Uint" | "Float"; // default: Float
}

export interface ClearDepth {
    readonly buffer: "DEPTH";
    readonly depth: number;
}
export interface ClearStencil {
    readonly buffer: "STENCIL";
    readonly stencil: number;
}

export interface ClearDepthStencil {
    readonly buffer: "DEPTH_STENCIL";
    readonly depth: number;
    readonly stencil: number;
}

export type ClearParams = ClearParamsColor | ClearDepth | ClearStencil | ClearDepthStencil;

function exhaustiveBufferCheck(value: never) {
    throw new Error(`Unknown buffer type: ${value}!`);
}

function exhaustiveColorCheck(value: never) {
    throw new Error(`Unknown clear color type: ${value}!`);
}

export function clear(context: RendererContext, params: ClearParams) {
    const { gl } = context;
    const { buffer } = params;
    const drawBuffer = "drawBuffer" in params ? params.drawBuffer : 0;
    switch (buffer) {
        case "DEPTH":
        case "STENCIL":
        case "DEPTH_STENCIL": {
            const depth = "depth" in params ? params.depth : 1.0;
            const stencil = "stencil" in params ? params.stencil : 0;
            gl.clearBufferfi(gl[buffer], drawBuffer, depth, stencil);
            break;
        }
        case "COLOR": {
            const type = params.type ?? "Float";
            switch (type) {
                case "Float": gl.clearBufferfv(gl[buffer], drawBuffer, params.color); break;
                case "Int": gl.clearBufferiv(gl[buffer], drawBuffer, new Int32Array(params.color)); break;
                case "Uint": gl.clearBufferuiv(gl[buffer], drawBuffer, new Uint32Array(params.color)); break;
                default: exhaustiveColorCheck(type);
            }
            break;
        }
        default: exhaustiveBufferCheck(buffer);
    }
}