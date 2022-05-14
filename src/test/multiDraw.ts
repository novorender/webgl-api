import type { Renderer } from "../webgl2-renderer/index.js";
import { shaders } from "./shaders.js";

export function multiDraw(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects } = renderer.allocators;

    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.basic });

    const numPoints = 1000000;
    const array = new Float32Array(numPoints * 2);
    for (let i = 0; i < array.length; i++) {
        array[i] = Math.random() * 2 - 1;
    }
    const vb = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: array });

    const drawCount = 100000;
    const countsList = new Int32Array(drawCount);
    const firstsList = new Int32Array(drawCount);
    const batchSize = numPoints / drawCount;
    for (let i = 0; i < drawCount; i++) {
        countsList[i] = batchSize;
        firstsList[i] = i * batchSize;
    }

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), { attributes: [{ buffer: vb, numComponents: 2 }] });

    renderer.clear({ color: [0, 0, 0, 1] });

    renderer.state({
        viewport: { width, height },
        program,
        uniforms: [
            { type: "4f", name: "color", value: [1, 1, 1, 1] },
        ],
        vertexArrayObject: vao,
    });

    // renderer.commit();
    renderer.measureBegin();
    // renderer.draw({ mode: "POINTS", count: numPoints });
    renderer.draw({ mode: "POINTS", drawCount, countsList, firstsList });
    // renderer.commit();
    renderer.measureEnd();

    renderer.commit();
}