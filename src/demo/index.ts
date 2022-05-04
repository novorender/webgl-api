import { createView, downloadRenderState } from "@novorender/webgl-api";
import { create, resizeCanvasToDisplaySize } from "@novorender/webgl2-renderer/";
import vertex from "./shaders/basic.vert";
import fragment from "./shaders/basic.frag";


async function main(canvas: HTMLCanvasElement) {
    resizeCanvasToDisplaySize(canvas);
    const { width, height } = canvas;
    const renderer = create(canvas);

    const basicProgram = 0;
    renderer.createProgram(basicProgram, { shaders: { vertex, fragment } });

    const vb = 0;
    renderer.createBuffer(vb, { target: "ARRAY_BUFFER", srcData: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]) });

    const vao = 0;
    renderer.createVertexArray(vao, { attributes: [{ buffer: vb, numComponents: 2 }] });

    const tex = 0;
    const image = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
    const texParams = { target: "TEXTURE_2D", internalFormat: "RGBA8", type: "UNSIGNED_BYTE", width: 2, height: 2, image, generateMipMaps: true } as const;
    renderer.createTexture(tex, texParams);

    const sampler = 0;
    renderer.createSampler(sampler, { minificationFilter: "NEAREST", magnificationFilter: "NEAREST" });

    renderer.state({
        viewport: { width, height },
        // scissorTest: true,
        // scissorBox: { width: width / 2, height },
        program: basicProgram,
        uniforms: [
            { type: "4f", name: "color", value: [1, 1, 0, 1] },
            { type: "1i", name: "tex", value: [0] }
        ],
        vertexArrayObject: vao,
        textures: [
            { target: "TEXTURE_2D", index: 0 }
        ],
        samplers: [
            0
        ]
    });

    renderer.clear({ color: [1, 0, 1, 1] });

    renderer.draw({ count: 4, mode: "TRIANGLE_STRIP" });

    // const url = new URL("./test.jsonc", location.origin);
    // const { renderState, blobs } = await downloadRenderState(url);
    // const view = createView(canvas);
    // view.render(renderState, blobs);
}

main(document.getElementById("container") as HTMLCanvasElement);