import { MeshResourceVertexAttributes } from "./attributes";
import { GL } from "./glEnum";
import { getProgramFactory } from "./programs";
import type { RenderState } from "./state";
import { createTextureResource } from "./texture";
import type { AsyncReturnType, IndexBufferType, } from "./types";
import { createCameraUniforms, createInstanceUniforms, createMaterialUniforms } from "./uniforms";
import { BufferTarget, createBuffer, PrimitiveType, createVertexArrayBuffer, identityMatrix, makeProjectionMatrix } from "./util";

function isBufferBinary(resource: RenderState.BufferResource): resource is RenderState.BufferResourceBinary {
    return "blobIndex" in resource;
}

function isBufferArray(resource: RenderState.BufferResource): resource is RenderState.BufferResourceArray {
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

function createBufferResource(bufferParams: RenderState.BufferResource, viewAspect: number, blobs: readonly ArrayBuffer[]) {
    let data: BufferSource | undefined;
    if (isBufferBinary(bufferParams)) {
        data = new Uint8Array(blobs[bufferParams.blobIndex], bufferParams.byteOffset, bufferParams.byteLength);
    } else if (isBufferArray(bufferParams)) {
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

// function isImageResourceBinary(resource: RenderState.ImageResource): resource is RenderState.ImageResourceBinary {
//     return "byteLength" in resource;
// }

// function isImageResourceUrl(resource: RenderState.ImageResource): resource is RenderState.ImageResourceImage {
//     return "url" in resource;
// }

// async function createImageResource(imageParams: RenderState.ImageResource, binary?: ArrayBuffer) {
//     if (isImageResourceBinary(imageParams)) {
//         if (binary) {
//             const { arrayType, byteOffset, byteLength } = imageParams;
//             const arrayCtor = self[arrayType];
//             return new arrayCtor(binary, byteOffset, byteLength ? byteLength / arrayCtor.BYTES_PER_ELEMENT : undefined);
//         } else {
//             throw new Error("No resource binary specified!");
//         }
//     } else if (isImageResourceUrl(imageParams)) {
//         // This is a bad hack and should be removed!
//         const { url } = imageParams;
//         const response = await fetch(url);
//         if (!response.ok)
//             throw new Error(`Resource not found: "${url}"!`);
//         const blob = await response.blob();
//         const image = await createImageBitmap(blob);
//         return image;
//     }
// }
// type ImageInfo = AsyncReturnType<typeof createImageResource>;

function createSampler(gl: WebGL2RenderingContext, samplerParams: RenderState.SamplerResource) {
    const sampler = gl.createSampler();
    if (sampler) {
        const { minificationFilter, magnificationFilter, minLOD, maxLOD, wrap, compareFunction, compareMode } = samplerParams;
        if (minificationFilter)
            gl.samplerParameteri(sampler, GL.TEXTURE_MIN_FILTER, gl[minificationFilter]); // default: NEAREST_MIPMAP_LINEAR
        if (magnificationFilter)
            gl.samplerParameteri(sampler, GL.TEXTURE_MAG_FILTER, gl[magnificationFilter]); // default: LINEAR
        if (wrap) {
            const [s, t, r] = wrap;
            gl.samplerParameteri(sampler, GL.TEXTURE_WRAP_S, gl[s]); // default: REPEAT
            gl.samplerParameteri(sampler, GL.TEXTURE_WRAP_T, gl[t]); // default: REPEAT
            if (r)
                gl.samplerParameteri(sampler, GL.TEXTURE_WRAP_R, gl[r]); // default: REPEAT
        }
        if (minLOD)
            gl.samplerParameterf(sampler, GL.TEXTURE_MIN_LOD, minLOD); // default: -1000
        if (maxLOD)
            gl.samplerParameterf(sampler, GL.TEXTURE_MAX_LOD, maxLOD); // default: 1000
        if (compareFunction)
            gl.samplerParameteri(sampler, GL.TEXTURE_COMPARE_FUNC, gl[compareFunction]);
        if (compareMode)
            gl.samplerParameteri(sampler, GL.TEXTURE_COMPARE_MODE, gl[compareMode]);
    }
    return sampler;
}


export async function createFrameStateResources(gl: WebGL2RenderingContext, viewAspect: number, resources: RenderState.Resources | undefined, blobs: readonly ArrayBuffer[]) {
    const programFactory = getProgramFactory(gl);
    const programs = ((resources?.programs) ?? []).map(programParams => {
        const { shader, flags } = programParams;
        const program = programFactory[shader](flags);
        return program;
    });

    const buffers = ((resources?.buffers) ?? []).map(bufferParams => {
        const data = createBufferResource(bufferParams, viewAspect, blobs);
        if (!data)
            return null;
        const type = gl[bufferParams.type] as BufferTarget;
        const buffer = data ? createBuffer(gl, type, data, GL.STATIC_DRAW) : null;
        return buffer;
    });

    const samplers = ((resources?.samplers) ?? []).map(samplerParams => {
        const sampler = createSampler(gl, samplerParams);
        return sampler;
    });

    const textures = ((resources?.textures) ?? []).map(textureParams => {
        const texture = createTextureResource(gl, textureParams, blobs);
        return texture;
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

    return { programs, buffers, samplers, textures, meshes } as const;
}

export type FrameContextResources = AsyncReturnType<typeof createFrameStateResources>;

