import { GL } from "./glEnum";
import { createProgram } from "./programs";
import type { RenderState } from "./state";
import { BufferTarget, createBuffer, PrimitiveType, IndexBufferType, createVertexArrayBuffer, createShaderProgram } from "./util";

// fixed vertex attribute layout of all mesh resources
export enum MeshResourceVertexAttributes {
    position,
    normal,
    color0,
    tex0,
};

export const meshResourceVertexAttributeBindings = (function () {
    const n = Object.keys(MeshResourceVertexAttributes).length / 2;
    const attributes: string[] = [];
    for (let i = 0; i < n; i++) {
        attributes[i] = MeshResourceVertexAttributes[i];
    }
    return attributes as readonly string[];
}());

function isRenderStateBufferResourceURL(resource: RenderState.BufferResource): resource is RenderState.BufferResourceBinary {
    return "byteLength" in resource;
}

function isRenderStateBufferResourceArray(resource: RenderState.BufferResource): resource is RenderState.BufferResourceArray {
    return "array" in resource;
}

export function createFrameStateResources(gl: WebGL2RenderingContext, resources?: RenderState.Resources, binary?: ArrayBuffer) {
    const buffers = ((resources?.buffers) ?? []).map(bufferParams => {
        let data: BufferSource | undefined;
        if (isRenderStateBufferResourceURL(bufferParams)) {
            if (binary) {
                data = new Uint8Array(binary, bufferParams.byteOffset, bufferParams.byteLength);
            } else {
                throw new Error("No resource binary specified!");
            }
        } else if (isRenderStateBufferResourceArray(bufferParams)) {
            const arrayCtor = self[bufferParams.arrayType ?? "Float32Array"];
            data = new arrayCtor(bufferParams.array);
        }
        const type = gl[bufferParams.type] as BufferTarget;
        const buffer = data ? createBuffer(gl, type, data, GL.STATIC_DRAW) : null;
        return buffer;
    });

    const meshes = ((resources?.meshes) ?? []).map(meshParams => {
        const { count } = meshParams;
        const primitiveType = gl[meshParams.primitiveType ?? "TRIANGLES"] as PrimitiveType;
        const indices = meshParams.indices ? {
            buffer: buffers[meshParams.indices.buffer],
            type: gl[meshParams.indices.type] as IndexBufferType,
        } : undefined;
        const attributes = Object.entries(meshParams.attributes).map(([name, attrib]) => {
            const { buffer, componentType, ...remaining } = attrib;
            return {
                index: MeshResourceVertexAttributes[name as keyof typeof MeshResourceVertexAttributes],
                componentType: gl[componentType ?? "FLOAT"],
                buffer: buffers[buffer],
                ...remaining
            } as const;
        });
        const vao = createVertexArrayBuffer(gl, attributes);
        return { vao, count, primitiveType, indices } as const;
    });

    const programs = ((resources?.programs) ?? []).map(programParams => {
        const { shader, flags } = programParams;
        const program = createProgram(gl, shader, flags);
        return program;
    });

    return { buffers, meshes, programs } as const;
}

export type FrameContextResources = ReturnType<typeof createFrameStateResources>;

