import { mat3, mat4, vec3, vec4 } from "gl-matrix";
import type { Renderer } from "../renderer";
import { shaders } from "./shaders.js";

const vertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
    1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
    -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
    -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
];

const edgeMasks = [
    0b110, 0b011, 0b011, 0b110,
    0b110, 0b011, 0b011, 0b110,
    0b110, 0b011, 0b011, 0b110,
];

const colors = [
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0
];

const indices = [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7,
    8, 10, 9, 8, 11, 10, 12, 13, 14, 12, 14, 15,
    16, 18, 17, 16, 19, 18, 20, 21, 22, 20, 22, 23
];

export async function packed(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects } = renderer.allocators;
    const programTri = renderer.createProgram(programs.alloc(), { shaders: shaders.packedTri });
    const programEdges = renderer.createProgram(programs.alloc(), { shaders: shaders.packedEdges });
    const programOutline = renderer.createProgram(programs.alloc(), { shaders: shaders.packedOutline });

    const numTriangles = 6 * 2;
    const posBytes = 3 * 3 + 1;
    const colBytes = 3;
    const packedPos = new Int8Array(numTriangles * posBytes);
    const packedCol = new Uint8Array(numTriangles * colBytes);
    for (let i = 0; i < numTriangles; i++) {
        const ia = indices[i * 3 + 0];
        const ib = indices[i * 3 + 1];
        const ic = indices[i * 3 + 2];
        let j = i * posBytes;
        // store all 3 positions per vertex
        packedPos[j++] = vertices[ia * 3 + 0];
        packedPos[j++] = vertices[ia * 3 + 1];
        packedPos[j++] = vertices[ia * 3 + 2];
        packedPos[j++] = vertices[ib * 3 + 0];
        packedPos[j++] = vertices[ib * 3 + 1];
        packedPos[j++] = vertices[ib * 3 + 2];
        packedPos[j++] = vertices[ic * 3 + 0];
        packedPos[j++] = vertices[ic * 3 + 1];
        packedPos[j++] = vertices[ic * 3 + 2];
        packedPos[j++] = edgeMasks[i];

        // use vertex A color as triangle color
        j = i * colBytes;
        packedCol[j++] = colors[ia * 3 + 0] * 255;
        packedCol[j++] = colors[ia * 3 + 1] * 255;
        packedCol[j++] = colors[ia * 3 + 2] * 255;
    }

    const pos = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: packedPos.buffer });
    const col = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: packedCol.buffer });

    const divisor = 1;
    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), {
        attributes: [
            { buffer: pos, numComponents: 3, offset: 0, componentType: "BYTE", normalized: false, stride: posBytes, divisor }, // p1
            { buffer: pos, numComponents: 3, offset: 3, componentType: "BYTE", normalized: false, stride: posBytes, divisor }, // p2
            { buffer: pos, numComponents: 3, offset: 6, componentType: "BYTE", normalized: false, stride: posBytes, divisor }, // p3
            { buffer: col, numComponents: 3, offset: 0, componentType: "UNSIGNED_BYTE", normalized: true, stride: colBytes, divisor }, // color
            { buffer: pos, numComponents: 1, offset: 9, componentType: "BYTE", shaderInteger: true, stride: posBytes, divisor }, // edge mask
        ],
    });

    const center = vec3.create();
    const eye = vec3.fromValues(3, 4, 5);
    const up = vec3.fromValues(0, 1, 0);
    const fov = 30;
    const near = 0.1;
    const far = 1000;
    const worldViewMatrix = mat4.lookAt(mat4.create(), eye, center, up);
    const worldViewMatrixNormal = mat3.normalFromMat4(mat3.create(), worldViewMatrix);
    const viewClipMatrix = mat4.perspective(mat4.create(), fov * Math.PI / 180, width / height, near, far);
    const worldClipMatrix = mat4.multiply(mat4.create(), viewClipMatrix, worldViewMatrix);
    // const eyeDist = vec3.length(eye);
    const eyeDir = vec3.normalize(vec3.create(), eye);
    const outlinePlane = [eyeDir[0], eyeDir[1], eyeDir[2], 0];

    const uniforms = [
        { type: "Matrix4f", name: "worldClipMatrix", value: [...worldClipMatrix] },
        { type: "4f", name: "outlinePlane", value: outlinePlane },
    ] as const;

    renderer.clear({ color: [0, 0, 0, 1] });

    renderer.state({
        viewport: { width, height },
        vertexArrayObject: vao,
    });

    // render triangles
    renderer.state({
        cullEnable: true,
        vertexArrayObject: vao,
        program: programTri,
        uniforms
    });
    renderer.draw({ count: 3, "mode": "TRIANGLES", instanceCount: numTriangles });

    // render outline
    renderer.state({
        cullEnable: false,
        vertexArrayObject: vao,
        program: programEdges,
        uniforms
    });
    renderer.draw({ count: 6, "mode": "LINES", instanceCount: numTriangles });

    // render outline
    renderer.state({
        cullEnable: false,
        vertexArrayObject: vao,
        program: programOutline,
        uniforms
    });
    renderer.draw({ count: 2, "mode": "LINES", instanceCount: numTriangles });

    renderer.commit();
}