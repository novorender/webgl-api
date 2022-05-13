import { getBufferSource } from "./binary.js";
import type { RendererContext } from "./renderer.js";

export type DrawMode = "POINTS" | "LINE_STRIP" | "LINE_LOOP" | "LINES" | "TRIANGLE_STRIP" | "TRIANGLE_FAN" | "TRIANGLES";

export interface DrawParamsBase {
    readonly mode?: DrawMode; // default: TRIANGLES
}

export interface DrawParamsArrays extends DrawParamsBase {
    readonly count: number;
    readonly first?: number; // default: 0
}

export interface DrawParamsArraysMultiDraw extends DrawParamsBase {
    readonly drawCount: number;
    readonly firstsList: Int32Array;
    readonly firstsOffset?: number; // default: 0
    readonly countsList: Int32Array;
    readonly countsOffset?: number; // default: 0
}

export interface DrawParamsElements extends DrawParamsBase {
    readonly count: number;
    readonly indexType: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
    readonly offset?: number; // default: 0
}

export interface DrawParamsElements extends DrawParamsBase {
    readonly count: number;
    readonly indexType: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
    readonly offset?: number; // default: 0
}

export interface DrawParamsArraysInstanced extends DrawParamsBase {
    readonly count: number;
    readonly instanceCount: number;
    readonly first?: number; // default: 0
}

export interface DrawParamsElementsInstanced extends DrawParamsBase {
    readonly count: number;
    readonly instanceCount: number;
    readonly indexType: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
    readonly offset?: number; // default: 0
}
export type DrawParams =
    DrawParamsArrays | DrawParamsArraysMultiDraw | DrawParamsArraysInstanced |
    DrawParamsElements | DrawParamsElementsInstanced;

function isInstanced(params: DrawParams): params is DrawParamsArraysInstanced | DrawParamsElementsInstanced {
    return "instanceCount" in params;
}

function isElements(params: DrawParams): params is DrawParamsElements {
    return "indexType" in params;
}

function isMultiDraw(params: DrawParams): params is DrawParamsArraysMultiDraw {
    return "drawCount" in params;
}

export function draw(context: RendererContext, params: DrawParams) {
    const { gl } = context;
    const mode = params.mode ?? "TRIANGLES";
    if (isMultiDraw(params)) {
        const { multiDraw } = context.extensions;
        const { drawCount } = params;
        const firstsList = getBufferSource(context, params.firstsList) as Int32Array;
        const firstsOffset = params.firstsOffset ?? 0;
        const countsList = getBufferSource(context, params.countsList) as Int32Array;
        const countsOffset = params.countsOffset ?? 0;
        multiDraw.multiDrawArraysWEBGL(gl[mode], firstsList, firstsOffset, countsList, countsOffset, drawCount);
    } else {
        const { count } = params;
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
}