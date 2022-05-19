import type { Renderer } from "../renderer";
import { shaders } from "./shaders.js";

export async function shuffle(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects } = renderer.allocators;

    const numPoints = 100000;
    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.basic });

    const positions = new Float32Array(numPoints * 2);
    for (let i = 0; i < positions.length; i++) {
        positions[i] = Math.random() * 2 - 1;
    }
    const pos = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: positions.buffer });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), {
        attributes: [
            { buffer: pos, numComponents: 2 },
        ],
    });

    renderer.clear({ color: [0, 0, 0, 1] });

    renderer.state({
        viewport: { width, height },
        vertexArrayObject: vao,
        program: program,
        uniforms: [
            { type: "4f", name: "color", value: [1, 1, 1, 1] },
        ]
    });

    renderer.draw({ count: numPoints / 2, "mode": "POINTS" });

    renderer.measureBegin();
    renderer.copy({
        readBuffer: pos,
        writeBuffer: pos,
        readOffset: positions.byteLength / 2,
        size: positions.byteLength / 2,
    });
    renderer.measureEnd();
    // renderer.waitFrames(60);
    renderer.draw({ count: numPoints / 2, "mode": "POINTS" });
    renderer.flush();
}