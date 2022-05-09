import type { Renderer } from "../webgl2-renderer/index.js";
import { allocators } from "./allocator.js";
import { shaders } from "./shaders.js";
import jimp from "jimp";

export async function packed(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects, textures, renderBuffers, frameBuffers } = allocators;

    const w = 512;
    const h = 512;
    let i = 0;
    const vtx = new Int16Array(w * h * 2);
    const ext = 32768;
    // const vtx = new Float32Array(w * h * 2);
    // const ext = 1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            vtx[i++] = ((x + 0.5) / w * 2 - 1) * ext;
            vtx[i++] = (1 - (y + 0.5) / h * 2) * ext;
        }
    }

    const indices = new Uint32Array((w - 1) * (h - 1) * 6);
    i = 0;
    for (let y = 0; y < h - 1; y++) {
        for (let x = 0; x < w - 1; x++) {
            indices[i++] = x + y * w;
            indices[i++] = x + 1 + y * w;
            indices[i++] = x + (y + 1) * w;
            indices[i++] = x + (y + 1) * w;
            indices[i++] = x + 1 + y * w;
            indices[i++] = x + 1 + (y + 1) * w;
        }
    }


    let img = await jimp.read("img/lena.jpg");
    img = img.resize(w, h);
    const { buffer } = img.bitmap.data;
    const pixels = new Uint8Array(buffer);
    // const pixels = new Float32Array([...new Uint8Array(buffer)].map(v => v / 255.0));

    // TODO: check performance on android and IOS. 
    // TODO: check out es build: https://esbuild.github.io/
    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.packed });

    const pos = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: vtx });
    const col = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: pixels });
    const idx = renderer.createBuffer(buffers.alloc(), { target: "ELEMENT_ARRAY_BUFFER", srcData: indices });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), {
        attributes: [
            { buffer: pos, numComponents: 2, componentType: "SHORT", normalized: true },
            { buffer: col, numComponents: 4, componentType: "UNSIGNED_BYTE", normalized: true },
            // { buffer: pos, numComponents: 2, componentType: "FLOAT" },
            // { buffer: col, numComponents: 4, componentType: "FLOAT" },
        ],
        indices: idx
    });

    renderer.state({
        viewport: { width, height },
        program,
        vertexArrayObject: vao,
    });

    renderer.clear({ color: [0, 0, 0, 1] });
    renderer.draw({ count: indices.length, indexType: "UNSIGNED_INT" });
    renderer.clear({ color: [0, 1, 0, 1] });
    renderer.measureBegin();
    for (let i = 0; i < 100; i++)
        renderer.draw({ count: indices.length, indexType: "UNSIGNED_INT", instanceCount: 1 });
    renderer.measureEnd();
    renderer.measurePrint();
}