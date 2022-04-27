import { MeshResourceVertexAttributes } from "./attributes";
import { GL } from "./glEnum";
import { getProgramFactory } from "./programs";
import type { RenderState } from "./state";
import type { Mat4 } from "./types";
import { createCameraUniforms, createInstanceUniforms, createMaterialUniforms } from "./uniforms";
import { BufferTarget, createBuffer, PrimitiveType, IndexBufferType, createVertexArrayBuffer, identityMatrix, makeProjectionMatrix } from "./util";

function isRenderStateBufferResourceURL(resource: RenderState.BufferResource): resource is RenderState.BufferResourceBinary {
    return "byteLength" in resource;
}

function isRenderStateBufferResourceArray(resource: RenderState.BufferResource): resource is RenderState.BufferResourceArray {
    return "array" in resource;
}

function isBufferUniformBlockCamera(resource: RenderState.BufferResource): resource is RenderState.BufferResourceUniformBlockCamera {
    return "camera" in resource;
}

function isBufferUniformBlockMaterial(resource: RenderState.BufferResource): resource is RenderState.BufferResourceUniformBlockMaterial {
    return "material" in resource;
}

function isBufferUniformBlockInstance(resource: RenderState.BufferResource): resource is RenderState.BufferResourceUniformBlockInstance {
    return "instance" in resource;
}

function createBufferResource(bufferParams: RenderState.BufferResource, viewAspect: number, binary?: ArrayBuffer) {
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
    } else if (isBufferUniformBlockCamera(bufferParams)) {
        const { camera } = bufferParams;
        const viewMatrix = camera.viewMatrix ?? identityMatrix;
        const fov = camera.projectionMatrix?.fov ?? 30;
        const near = camera.projectionMatrix?.near ?? 0.1;
        const far = camera.projectionMatrix?.far ?? 1000;
        const projectionMatrix = makeProjectionMatrix(fov, viewAspect, near, far);
        data = createCameraUniforms(viewMatrix, projectionMatrix);
    } else if (isBufferUniformBlockMaterial(bufferParams)) {
        const baseColor = bufferParams.material.baseColor ?? [1, 1, 1, 1];
        data = createMaterialUniforms(baseColor);
    } else if (isBufferUniformBlockInstance(bufferParams)) {
        const modelMatrix = bufferParams.instance.modelMatrix ?? identityMatrix;
        data = createInstanceUniforms(modelMatrix);
    }
    return data;
}

export function createFrameStateResources(gl: WebGL2RenderingContext, viewAspect: number, resources?: RenderState.Resources, binary?: ArrayBuffer) {
    const programFactory = getProgramFactory(gl);
    const programs = ((resources?.programs) ?? []).map(programParams => {
        const { shader, flags } = programParams;
        const program = programFactory[shader](flags);
        return program;
    });

    const buffers = ((resources?.buffers) ?? []).map(bufferParams => {
        const data = createBufferResource(bufferParams, viewAspect, binary);
        if (!data)
            return null;
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

    return { buffers, meshes, programs } as const;
}

export type FrameContextResources = ReturnType<typeof createFrameStateResources>;
