import type { Renderer } from "../webgl2-renderer/index.js";
import { shaders } from "./shaders.js";

export function renderTarget(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects, textures, renderBuffers, frameBuffers } = renderer.allocators;

    const texParams = { target: "TEXTURE_2D", internalFormat: "R32UI", type: "UNSIGNED_INT", width, height, image: null } as const;
    const texture = renderer.createTexture(textures.alloc(), texParams);

    // const fbMultisample = renderer.createFrameBuffer(frameBuffers.alloc(), { color: [{ renderBuffer: rb }] });

    const frameBuffer = renderer.createFrameBuffer(frameBuffers.alloc(), { color: [{ texture }] });

    renderer.state({
        viewport: { width, height },
        frameBuffer,
        drawBuffers: ["COLOR_ATTACHMENT0"]
    });

    renderer.clear({ type: "Uint", color: [42, 0, 0, 0] });
    renderer.commit();
    renderer.read();
}