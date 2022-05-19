import type { VertexArrayParams } from "..";
import type { RendererContext } from ".";

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
