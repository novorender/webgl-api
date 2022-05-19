import type { FrameBufferIndex, Renderer } from "../renderer";
import { shaders } from "./shaders.js";

function createFrameBuffer(renderer: Renderer, target: "texture" | "renderBuffer"): FrameBufferIndex {
    const { width, height } = renderer;
    const { textures, renderBuffers, frameBuffers } = renderer.allocators;
    if (target == "texture") {
        const texParams = { target: "TEXTURE_2D", internalFormat: "R32UI", type: "UNSIGNED_INT", width, height, image: null } as const;
        const texture = renderer.createTexture(textures.alloc(), texParams);
        const frameBuffer = renderer.createFrameBuffer(frameBuffers.alloc(), { color: [{ texture }] });
        return frameBuffer;
    } else if (target == "renderBuffer") {
        const renderBuffer = renderer.createRenderBuffer(renderBuffers.alloc(), { internalFormat: "R32UI", width, height });
        const frameBuffer = renderer.createFrameBuffer(frameBuffers.alloc(), { color: [{ renderBuffer }] });
        return frameBuffer;
    }
    throw new Error(`Unknown render target ${target}!`);
}

export function renderTarget(renderer: Renderer, target: "texture" | "renderBuffer") {
    const { width, height } = renderer;
    const { programs, buffers, vertexArrayObjects } = renderer.allocators;

    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.ui32 });
    const vb = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]) });
    const vertexArrayObject = renderer.createVertexArray(vertexArrayObjects.alloc(), { attributes: [{ buffer: vb, numComponents: 2 }] });

    const frameBuffer = createFrameBuffer(renderer, target);

    renderer.state({
        viewport: { width, height },
        program,
        uniforms: [
            { type: "1ui", name: "color", value: 42 }
        ],
        vertexArrayObject,
        frameBuffer,
        drawBuffers: ["COLOR_ATTACHMENT0"]
    });

    renderer.clear({ buffer: "COLOR", type: "Uint", color: [41, 0, 0, 0] });

    renderer.draw({ count: 4, mode: "TRIANGLE_STRIP" });

    renderer.commit();

    renderer.checkStatus();

    renderer.readPixels({ buffer: "COLOR_ATTACHMENT0", x: 0, y: 0, format: "RED_INTEGER", type: "UNSIGNED_INT" });
}