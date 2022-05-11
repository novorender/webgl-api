import type { Renderer } from "../webgl2-renderer/index.js";
import { shaders } from "./shaders.js";

export async function packed(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects } = renderer.allocators;
    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.packed });

    // const positions = [
    //     -1, -1, 1, -1, -1, 1,
    //     -1, 1, 1, -1, 1, 1,
    // ];
    const positions = [
        -1, -1, 1, -1, -1, 1, 0.9, 0.9, // triangle strip works too...
    ];

    const colors = [
        1, 1, 0,
        0, 1, 1,
    ];

    const pos = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: new Float32Array(positions) });
    const col = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: new Float32Array(colors) });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), {
        attributes: [
            { buffer: pos, numComponents: 2, offset: 0, stride: 8, divisor: 1 },
            { buffer: pos, numComponents: 2, offset: 8, stride: 8, divisor: 1 },
            { buffer: pos, numComponents: 2, offset: 16, stride: 8, divisor: 1 },
            { buffer: col, numComponents: 3, offset: 0, stride: 12, divisor: 1 },
        ],
        // indices: idx
    });

    renderer.state({
        cullEnable: true,
        viewport: { width, height },
        program,
        vertexArrayObject: vao,
    });

    renderer.clear({ color: [0, 0, 0, 1] });
    renderer.draw({ count: 3, instanceCount: 2 });
    renderer.commit();
}