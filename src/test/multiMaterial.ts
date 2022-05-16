import type { Renderer } from "../webgl2-renderer/index.js";
import { shaders } from "./shaders.js";

export function multiMaterial(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects } = renderer.allocators;

    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.multiMaterial });

    const quadExt = 128;
    const numQuads = quadExt * quadExt;

    const positions = new Float32Array(quadExt * quadExt * 4 * 2);
    let i = 0;
    for (let y = 0; y < quadExt; y++) {
        for (let x = 0; x < quadExt; x++) {
            const x0 = (x + 0.25) / quadExt * 2 - 1;
            const y0 = (y + 0.25) / quadExt * 2 - 1;
            const x1 = (x + 0.75) / quadExt * 2 - 1;
            const y1 = (y + 0.75) / quadExt * 2 - 1;
            positions.set([x0, y0, x1, y0, x0, y1, x1, y1], i);
            i += 8;
        }
    }
    console.assert(i == positions.length);
    const vb = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: positions })

    const indices = new Uint32Array(numQuads * 6);
    i = 0;
    for (let y = 0; y < quadExt; y++) {
        for (let x = 0; x < quadExt; x++) {
            const i0 = (x + y * quadExt) * 4;
            indices[i++] = i0 + 0;
            indices[i++] = i0 + 1;
            indices[i++] = i0 + 2;
            indices[i++] = i0 + 3;
            indices[i++] = i0 + 2;
            indices[i++] = i0 + 1;
        }
    }
    console.assert(i == indices.length);
    const ib = renderer.createBuffer(buffers.alloc(), { target: "ELEMENT_ARRAY_BUFFER", srcData: indices });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), { attributes: [{ buffer: vb, numComponents: 2 }], indices: ib });

    const numMaterials = quadExt * quadExt;
    const materialColors = new Uint32Array(numMaterials);
    for (let i = 0; i < numMaterials; i++) {
        materialColors[i] = Math.random() * 255 << 0 | Math.random() * 255 << 8 | Math.random() * 255 << 16 | 255 << 24;
    }
    const ub = renderer.createBuffer(buffers.alloc(), { target: "UNIFORM_BUFFER", srcData: materialColors.buffer });

    renderer.clear({ color: [0, 0, 0, 1] });

    renderer.state({
        viewport: { width, height },
        program,
        vertexArrayObject: vao,
        uniforms: [
            { type: "1i", name: "numVerticesPerObject", value: 4 },
        ],
        uniformBlocks: [
            { buffer: ub },
        ]
    });

    renderer.measureBegin();
    renderer.draw({ mode: "TRIANGLES", "indexType": "UNSIGNED_INT", count: numQuads * 6 });
    renderer.measureEnd();

    renderer.commit();
}