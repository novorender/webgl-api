import type { FrameBufferIndex, Renderer } from "../renderer";
import { shaders } from "./shaders.js";

function createFrameBuffer(renderer: Renderer, internalFormat: "RGBA8" | "SRGB8_ALPHA8"): FrameBufferIndex {
    const { width, height } = renderer;
    const { renderBuffers, frameBuffers } = renderer.allocators;
    const renderBuffer = renderer.createRenderBuffer(renderBuffers.alloc(), { internalFormat, width, height });
    const frameBuffer = renderer.createFrameBuffer(frameBuffers.alloc(), { color: [{ renderBuffer }] });
    return frameBuffer;
}

export function srgb(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs } = renderer.allocators;

    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.gradient });
    const fbLinear = createFrameBuffer(renderer, "RGBA8");
    const fbSrgb = createFrameBuffer(renderer, "SRGB8_ALPHA8");

    renderer.state({
        viewport: { width, height },
        program,
        uniforms: [
            { name: "windowSize", type: "2f", value: [width, height] },
        ],
    });

    renderer.state({
        // program,
        uniforms: [
            { name: "gamma", type: "1f", value: 1.0 }
        ],
        frameBuffer: fbLinear,
    })
    renderer.draw({ count: 4, mode: "TRIANGLE_STRIP" });

    renderer.state({
        // program,
        uniforms: [
            { name: "gamma", type: "1f", value: 2.2 }
        ],
        frameBuffer: fbSrgb,
    })
    renderer.draw({ count: 4, mode: "TRIANGLE_STRIP" });

    renderer.state({
        frameBuffer: null,
    })
    renderer.clear({ color: [0.0, 0.0, 0.0, 1] });
    renderer.blit({ color: true, source: fbLinear, destination: null, srcX1: width / 2 - 1, dstX1: width / 2 - 1 });
    renderer.blit({ color: true, source: fbSrgb, destination: null, srcX0: width / 2 + 1, dstX0: width / 2 + 1 });
}