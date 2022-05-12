import type { RendererContext } from "./renderer.js";
import type { BufferIndex } from "./buffer.js";

export type VertexArrayIndex = number;

export interface VertexArrayParams {
    readonly attributes: readonly (VertexAttribute | null)[];
    readonly indices?: BufferIndex;
}

export type ComponentTypeString = "BYTE" | "UNSIGNED_BYTE" | "SHORT" | "UNSIGNED_SHORT" | "INT" | "UNSIGNED_INT" | "HALF_FLOAT" | "FLOAT";

export interface VertexAttributeCommon {
    readonly buffer: BufferIndex;
    readonly numComponents: 1 | 2 | 3 | 4;
    readonly stride?: number; // default: 0
    readonly offset?: number; // default: 0
    readonly divisor?: number; // default: 0
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
export interface VertexAttributeFloat extends VertexAttributeCommon {
    readonly componentType?: ComponentTypeString; // default: FLOAT
    readonly normalized?: boolean; // default: false
    readonly shaderInteger?: false;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribIPointer
export interface VertexAttributeInteger extends VertexAttributeCommon {
    readonly shaderInteger: true;
    readonly componentType: ComponentTypeString;
}

export type VertexAttribute = VertexAttributeFloat | VertexAttributeInteger;

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
            const { numComponents } = attribParams;
            const componentType = attribParams.componentType ?? "FLOAT";
            const divisor = attribParams.divisor ?? 0;
            const stride = attribParams.stride ?? 0;
            const offset = attribParams.offset ?? 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers[attribParams.buffer]);
            gl.enableVertexAttribArray(attribIndex);
            if (attribParams.shaderInteger) {
                gl.vertexAttribIPointer(attribIndex, numComponents, gl[componentType], stride, offset);
            } else {
                const normalized = attribParams.normalized ?? false;
                gl.vertexAttribPointer(attribIndex, numComponents, gl[componentType], normalized, stride, offset);
            }
            gl.vertexAttribDivisor(attribIndex, divisor);
        }
        attribIndex++;
    };
    if (params.indices) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[params.indices]);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return vao;
}
