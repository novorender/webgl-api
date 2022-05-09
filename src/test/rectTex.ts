import type { Renderer } from "../webgl2-renderer/index.js";
import { allocators } from "../webgl2-renderer/allocator.js";
import { shaders } from "./shaders.js";

export function quadTex(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects, textures, samplers } = allocators;
    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.tex });

    const vb = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]) });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), { attributes: [{ buffer: vb, numComponents: 2 }] });

    const image = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
    const texParams = { target: "TEXTURE_2D", internalFormat: "RGBA8", type: "UNSIGNED_BYTE", width: 2, height: 2, image, generateMipMaps: true } as const;
    const tex = renderer.createTexture(textures.alloc(), texParams);

    const sampler = renderer.createSampler(samplers.alloc(), { minificationFilter: "NEAREST", magnificationFilter: "NEAREST" });

    renderer.state({
        viewport: { width, height },
        // scissorTest: true,
        // scissorBox: { width: width / 2, height },
        program,
        uniforms: [
            { type: "1i", name: "tex", value: [0] }
        ],
        vertexArrayObject: vao,
        textures: [
            { target: "TEXTURE_2D", index: tex }
        ],
        samplers: [
            sampler
        ]
    });

    renderer.clear({ color: [1, 0, 1, 1] });

    renderer.draw({ count: 4, mode: "TRIANGLE_STRIP" });
    renderer.commit();
}