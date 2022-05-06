import type { Renderer } from "../webgl2-renderer/index.js";
import { shaders } from "./shaders.js";

export function lineAA(renderer: Renderer) {
    const { width, height } = renderer;
    const scale = 10;

    const program = 0;
    renderer.createProgram(program, { shaders: shaders.basic });

    // TODO: Check that multi sample rendering actually works. (Do we need to enable it in shader?)
    const vb = 0;
    renderer.createBuffer(vb, { target: "ARRAY_BUFFER", srcData: new Float32Array([-1, -1, 0.93252, 1, -1, 1]) });

    const vao = 0;
    renderer.createVertexArray(vao, { attributes: [{ buffer: vb, numComponents: 2 }] });

    const rb = 0;
    renderer.createRenderBuffer(rb, { internalFormat: "RGBA8", width: width / scale, height: height / scale, samples: 4 });

    const tex = 0;
    const texParams = { target: "TEXTURE_2D", internalFormat: "RGBA", type: "UNSIGNED_BYTE", width: width / scale, height: height / scale, image: null } as const;
    renderer.createTexture(tex, texParams);

    const fbms = 0;
    renderer.createFrameBuffer(fbms, { color: [{ renderBuffer: rb }] });

    const fb = 1;
    renderer.createFrameBuffer(fb, { color: [{ texture: tex }] });

    renderer.state({
        viewport: { width, height },
        program,
        uniforms: [
            { type: "4f", name: "color", value: [1, 1, 1, 1] },
        ],
        vertexArrayObject: vao,
        frameBuffer: fbms
    });

    renderer.clear({ color: [0, 0, 1, 1] });

    renderer.draw({ count: 3, mode: "TRIANGLES" });

    renderer.state({
        frameBuffer: fb
    });

    renderer.blit({ source: fbms, destination: fb, color: true, srcX1: width / scale, srcY1: height / scale, dstX1: width / scale, dstY1: height / scale });
    renderer.blit({ source: fb, destination: null, color: true, srcX1: width / scale, srcY1: height / scale });
}