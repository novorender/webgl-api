import type { BlobIndex, RendererContext } from "./renderer";

export type BufferIndex = number;
export type BufferTargetString = "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER" | "COPY_READ_BUFFER" | "COPY_WRITE_BUFFER" | "TRANSFORM_FEEDBACK_BUFFER" | "UNIFORM_BUFFER" | "PIXEL_PACK_BUFFER" | "PIXEL_UNPACK_BUFFER";
export type BufferUsageString = "STATIC_DRAW" | "DYNAMIC_DRAW" | "STREAM_DRAW" | "STATIC_READ" | "DYNAMIC_READ" | "STREAM_READ" | "STATIC_COPY" | "DYNAMIC_COPY" | "STREAM_COPY";

export interface BufferParamsSize {
    target: BufferTargetString;
    usage: BufferUsageString;
    size: GLsizeiptr;
}

export interface BufferParamsData {
    target: BufferTargetString;
    usage: BufferUsageString;
    srcData: BlobIndex;
}

export type BufferParams = BufferParamsSize | BufferParamsData;

export function createBuffer(context: RendererContext, params: BufferParams): WebGLBuffer {
    const { gl, blobs } = context;
    const target = gl[params.target];
    const usage = gl[params.usage];
    const buffer = gl.createBuffer();
    if (!buffer)
        throw new Error("Could not create buffer!");
    gl.bindBuffer(target, buffer);
    if ("size" in params) {
        gl.bufferData(target, params.size, usage);
    } else {
        gl.bufferData(target, blobs[params.srcData], usage);
    }
    gl.bindBuffer(target, null);
    return buffer;
}
