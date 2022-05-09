import type { RendererContext } from "./renderer.js";

export type DrawMode = "POINTS" | "LINE_STRIP" | "LINE_LOOP" | "LINES" | "TRIANGLE_STRIP" | "TRIANGLE_FAN" | "TRIANGLES";

export interface DrawParamsArrays {
    readonly mode?: DrawMode; // default: TRIANGLES
    readonly count: number;
    readonly first?: number; // default: 0
}

export interface DrawParamsElements {
    readonly mode?: DrawMode; // default: TRIANGLES
    readonly count: number;
    readonly indexType: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
    readonly offset?: number; // default: 0
}

export interface DrawParamsArraysInstanced {
    readonly mode?: DrawMode; // default: TRIANGLES
    readonly count: number;
    readonly instanceCount: number;
    readonly first?: number; // default: 0
}

export interface DrawParamsElementsInstanced {
    readonly mode?: DrawMode; // default: TRIANGLES
    readonly count: number;
    readonly instanceCount: number;
    readonly indexType: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
    readonly offset?: number; // default: 0
}




export type DrawParams = DrawParamsArrays | DrawParamsElements | DrawParamsArraysInstanced | DrawParamsElementsInstanced;

function isInstanced(params: DrawParams): params is DrawParamsArraysInstanced | DrawParamsElementsInstanced {
    return "instanceCount" in params;
}

function isElements(params: DrawParams): params is DrawParamsElements {
    return "indexType" in params;
}

export function draw(context: RendererContext, params: DrawParams) {
    const { gl } = context;
    const { count } = params;
    const mode = params.mode ?? "TRIANGLES";
    if (isInstanced(params)) {
        if (isElements(params)) {
            gl.drawElementsInstanced(gl[mode], count, gl[params.indexType], params.offset ?? 0, params.instanceCount)
        } else {
            gl.drawArraysInstanced(gl[mode], params.first ?? 0, count, params.instanceCount);
        }
    } else {
        if (isElements(params)) {
            gl.drawElements(gl[mode], count, gl[params.indexType], params.offset ?? 0)
        } else {
            gl.drawArrays(gl[mode], params.first ?? 0, count);
        }
    }
}