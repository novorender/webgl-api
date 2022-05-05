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
    readonly type: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
    readonly offset?: number; // default: 0
}

export type DrawParams = DrawParamsArrays | DrawParamsElements;

function isElements(params: DrawParams): params is DrawParamsElements {
    return "type" in params;
}

export function draw(context: RendererContext, params: DrawParams) {
    const { gl } = context;
    const { count } = params;
    const mode = params.mode ?? "TRIANGLES";
    if (isElements(params)) {
        gl.drawElements(gl[mode], count, gl[params.type], params.offset ?? 0)
    } else {
        gl.drawArrays(gl[mode], params.first ?? 0, count);
    }
}