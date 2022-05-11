import type { Renderer } from "../webgl2-renderer/index.js";
import { shaders } from "./shaders.js";

export function multiSample(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects, textures, renderBuffers, frameBuffers } = renderer.allocators;
    const scale = 10;
    const w = width / scale;
    const h = height / scale;

    // TODO: can we wrap the allocator and renderer. into a single createProgram() function?
    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.basic });

    const vb = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: new Float32Array([-1, -1, 0.8453, .97354, -1, 1]) });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), { attributes: [{ buffer: vb, numComponents: 2 }] });

    const rb = renderer.createRenderBuffer(renderBuffers.alloc(), { internalFormat: "RGBA8", width: w, height: h, samples: 4 });

    const texParams = { target: "TEXTURE_2D", internalFormat: "RGBA", type: "UNSIGNED_BYTE", width: w, height: h, image: null } as const;
    const tex = renderer.createTexture(textures.alloc(), texParams);

    const fbMultisample = renderer.createFrameBuffer(frameBuffers.alloc(), { color: [{ renderBuffer: rb }] });

    const fb = renderer.createFrameBuffer(frameBuffers.alloc(), { color: [{ texture: tex }] });

    renderer.state({
        viewport: { width: w, height: h },
        program,
        uniforms: [
            { type: "4f", name: "color", value: [1, 1, 1, 1] },
        ],
        vertexArrayObject: vao,
        frameBuffer: fbMultisample
    });

    renderer.clear({ buffer: "BACK", color: [0, 0, 0, 1] });

    renderer.draw({ count: 3, mode: "TRIANGLES" });
    renderer.blit({ source: fbMultisample, destination: fb, color: true, srcX1: w, srcY1: h, dstX1: w, dstY1: h });
    renderer.blit({ source: fb, destination: null, color: true, srcX1: w, srcY1: h });
    renderer.commit();
}