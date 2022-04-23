import { GL } from "./glEnum";
import type { RenderStateResources } from "./state";
import { BufferTarget, createBuffer, PrimitiveType, IndexBufferType, createVertexArrayBuffer } from "./util";

// fixed vertex attribute layout of all mesh resources
export enum MeshResourceVertexAttributes {
    position,
    normal,
    color0,
    tex0,
};

export const meshResourceVertexAttributeBindings = (function () {
    const n = Object.keys(MeshResourceVertexAttributes).length / 2;
    const attributes: any = {};
    for (let i = 0; i < n; i++) {
        attributes[MeshResourceVertexAttributes[i]] = i;
    }
    return attributes as { readonly [key: string]: number };
}());

function getArrayType(name: "Float32Array" | "Uint8Array" | "Uint16Array" | "Uint32Array") {
    switch (name) {
        case "Float32Array": return Float32Array;
        case "Uint8Array": return Uint8Array;
        case "Uint16Array": return Uint16Array;
        case "Uint32Array": return Uint32Array;
        default:
            const _exhaustiveCheck: never = name;
            return _exhaustiveCheck;
    }
}

export function createFrameStateResources(gl: WebGL2RenderingContext, resources?: RenderStateResources) {
    const buffers = ((resources?.buffers) ?? []).map(bufferParams => {
        const arrayCtor = getArrayType(bufferParams.arrayType ?? "Float32Array");
        const data = new arrayCtor(bufferParams.data);
        const type = gl[bufferParams.type] as BufferTarget;
        const buffer = createBuffer(gl, type, data, GL.STATIC_DRAW);
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

    return { buffers, meshes } as const;
}

export type FrameContextResources = ReturnType<typeof createFrameStateResources>;

