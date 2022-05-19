import type { DrawParams, DrawParamsArraysInstanced, DrawParamsArraysMultiDraw, DrawParamsElements, DrawParamsElementsInstanced } from "..";
import type { RendererContext } from "./";
import { getBufferSource } from "../binary.js";

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

function isInstanced(params: DrawParams): params is DrawParamsArraysInstanced | DrawParamsElementsInstanced {
    return "instanceCount" in params;
}

function isElements(params: DrawParams): params is DrawParamsElements {
    return "indexType" in params;
}

function isMultiDraw(params: DrawParams): params is DrawParamsArraysMultiDraw {
    return "drawCount" in params;
}

