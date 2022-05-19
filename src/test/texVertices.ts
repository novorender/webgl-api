import type { Renderer, StateParams } from "../renderer";
import { shaders } from "./shaders.js";


export function texVertices(renderer: Renderer, useTextures = true) {
    const { width, height } = renderer;
    const { programs, blobs, buffers, vertexArrayObjects, textures, samplers } = renderer.allocators;
    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.texVertices, flags: useTextures ? ["USE_TEX"] : undefined });

    const ext = 512;
    const n = ext * ext;

    const positions = new Float32Array(n * 2);
    for (let y = 0; y < ext; y++) {
        for (let x = 0; x < ext; x++) {
            positions[(x + y * ext) * 2 + 0] = (x + 0.5) / ext * 2 - 1;
            positions[(x + y * ext) * 2 + 1] = (y + 0.5) / ext * 2 - 1;
        }
    }
    // for (let i = 0; i < positions.length; i++) {
    //     positions[i] = Math.random() * 2 - 1;
    // }
    const posBlob = renderer.createBlob(blobs.alloc(), { data: positions.buffer });
    const posBuf = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: { blob: posBlob } });

    const colors = new Uint8Array(n * 4);
    for (let i = 0; i < colors.length;) {
        colors[i++] = Math.random() * 256;
        colors[i++] = Math.random() * 256;
        colors[i++] = Math.random() * 256;
        colors[i++] = 255;
    }
    const colBlob = renderer.createBlob(blobs.alloc(), { data: colors.buffer });
    const colBuf = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: { blob: colBlob } });

    // const indices = new Uint32Array(n);
    // for (let i = 0; i < indices.length; i++) {
    //     indices[i] = i;
    // }
    // const idxBlob = renderer.createBlob(blobs.alloc(), indices.buffer);
    // const idx = renderer.createBuffer(buffers.alloc(), { target: "ELEMENT_ARRAY_BUFFER", srcData: { blob: idxBlob } });

    const posTex = renderer.createTexture(textures.alloc(), { target: "TEXTURE_2D", width: ext, height: ext, internalFormat: "RG32F", type: "FLOAT", image: { blob: posBlob } });
    const colTex = renderer.createTexture(textures.alloc(), { target: "TEXTURE_2D", width: ext, height: ext, internalFormat: "RGBA8", type: "UNSIGNED_BYTE", image: { blob: colBlob } });
    const sampler = renderer.createSampler(samplers.alloc(), { magnificationFilter: "NEAREST", minificationFilter: "NEAREST" });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), {
        attributes: [
            { buffer: posBuf, numComponents: 2, componentType: "FLOAT", normalized: false },
            { buffer: colBuf, numComponents: 4, componentType: "UNSIGNED_BYTE", normalized: true },
        ],
        // indices: idx,
    });

    const conditionalState: StateParams = useTextures ? {
        textures: [
            { target: "TEXTURE_2D", texture: posTex, sampler },
            { target: "TEXTURE_2D", texture: colTex, sampler },
        ],
        uniforms: [
            { name: "posTex", type: "1i", value: 0 },
            { name: "colTex", type: "1i", value: 1 },
        ]
    } : {
        vertexArrayObject: vao,
    };

    renderer.state({
        viewport: { width, height },
        program,
        ...conditionalState
    });

    renderer.clear({ color: [0, 0, 0.25, 1] });

    // renderer.commit();
    renderer.measureBegin();
    // renderer.draw({ count: n, indexType: "UNSIGNED_INT", mode: "POINTS" });
    renderer.draw({ count: n, mode: "POINTS" });
    // renderer.commit();
    renderer.measureEnd();

    // renderer.commit();
}