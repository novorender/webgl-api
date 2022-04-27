import type { Mat4, RGBA } from "./types";

/*
layout(std140) uniform CameraUniforms {
    mat4 dummyMatrix;
    mat4 projectionMatrix;
    mat4 viewMatrix;
};
*/
const cameraUniformBufferByteSize = 3 * 16 * 4;

export function createCameraUniforms(view: Mat4, projection: Mat4) {
    const buffer = new Float32Array(cameraUniformBufferByteSize / 4);
    buffer.set(projection, 16);
    buffer.set(view, 32);
    return buffer.buffer;
}


/*
layout(std140) uniform MaterialUniforms {
    vec4 baseColor;
};
*/
const materialUniformBufferByteSize = 4 * 4;

export function createMaterialUniforms(baseColor: RGBA) {
    const buffer = new Float32Array(materialUniformBufferByteSize / 4);
    buffer.set(baseColor, 0);
    return buffer.buffer;
}


/*
layout(std140) uniform InstanceUniforms {
    mat4 modelMatrix;
};
*/
const instanceUniformBufferByteSize = 4 * 4 * 4;

export function createInstanceUniforms(model: Mat4) {
    const buffer = new Float32Array(instanceUniformBufferByteSize / 4);
    buffer.set(model, 0);
    return buffer.buffer;
}


export const enum UniformBlocks { camera, material, instance };

export function bindUniformBlocks(gl: WebGL2RenderingContext, program: WebGLProgram) {
    console.assert(
        UniformBlocks.camera == gl.getUniformBlockIndex(program, "CameraUniforms") &&
        UniformBlocks.material == gl.getUniformBlockIndex(program, "MaterialUniforms") &&
        UniformBlocks.instance == gl.getUniformBlockIndex(program, "InstanceUniforms")
    );

    gl.uniformBlockBinding(program, UniformBlocks.camera, 0);
    gl.uniformBlockBinding(program, UniformBlocks.material, 1);
    gl.uniformBlockBinding(program, UniformBlocks.instance, 2);
}
