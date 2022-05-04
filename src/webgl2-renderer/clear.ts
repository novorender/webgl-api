import type { RendererContext } from "./renderer";

export interface ClearParamsColor {
    readonly buffer?: "COLOR";
    readonly drawBuffer?: number; // 0 - MAX_DRAW_BUFFERS
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
            gl.clearBufferfi(gl[buffer], 0, depth, stencil);
            break;
        }
        default: {
            const type = params.type ?? "Float";
            const target = gl.COLOR;
            switch (type) {
                case "Float": gl.clearBufferfv(target, drawBuffer ?? 0, params.color); break;
                case "Int": gl.clearBufferiv(target, drawBuffer ?? 0, new Int32Array(params.color)); break;
                case "Uint": gl.clearBufferuiv(target, drawBuffer ?? 0, new Uint32Array(params.color)); break;
                default: exhaustiveColorCheck(type);
            }
            break;
        }
        // default: exhaustiveBufferCheck(buffer);
    }
}