import type { BufferParams } from "..";
import type { RendererContext } from ".";
import { getBufferSource } from "../binary.js";

// TODO: make overload interface?
export function createBuffer(context: RendererContext, params: BufferParams): WebGLBuffer {
    const { gl } = context;
    const target = gl[params.target];
    const usage = gl[params.usage ?? "STATIC_DRAW"];
    const buffer = gl.createBuffer();
    if (!buffer)
        throw new Error("Could not create buffer!");
    gl.bindBuffer(target, buffer);
    if ("size" in params) {
        gl.bufferData(target, params.size, usage);
    } else {
        gl.bufferData(target, getBufferSource(context, params.srcData), usage);
    }
    gl.bindBuffer(target, null);
    return buffer;
}
