import type { RendererContext } from "./renderer";
import { BufferIndex } from "./buffer";

export type VertexArrayIndex = number;

export interface VertexArrayParams {
    readonly attributes: readonly (VertexAttribute | null)[];
}

export type ComponentTypeString = "BYTE" | "UNSIGNED_BYTE" | "SHORT" | "UNSIGNED_SHORT" | "FLOAT" | "HALF_FLOAT";

export interface VertexAttribute {
    readonly buffer: BufferIndex;
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    readonly numComponents: 1 | 2 | 3 | 4;
    readonly componentType?: ComponentTypeString; // default: FLOAT
    readonly normalized?: boolean; // default: false
    readonly stride?: number; // default: 0
    readonly offset?: number; // default: 0
}

export function createVertexArray(context: RendererContext, params: VertexArrayParams): WebGLVertexArrayObject {
    const { gl, buffers } = context;
    const vao = gl.createVertexArray();
    if (!vao)
        throw new Error("Could not create vao!");
    gl.bindVertexArray(vao);
    let attribIndex = 0;
    const { attributes } = params;
    for (const attribParams of attributes) {
        if (attribParams) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers[attribParams.buffer]);
            gl.vertexAttribPointer(attribIndex, attribParams.numComponents, gl[attribParams.componentType ?? "FLOAT"], attribParams.normalized ?? false, attribParams.stride ?? 0, attribParams.offset ?? 0);
            gl.enableVertexAttribArray(attribIndex);
        }
        attribIndex++;
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    return vao;
}
