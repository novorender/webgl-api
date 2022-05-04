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

    const vbBlob = 0;
    renderer.addBlob(new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]));
    const vb = 0;
    renderer.createBuffer(vb, { target: "ARRAY_BUFFER", srcData: vbBlob });

    const vao = 0;
    renderer.createVertexArray(vao, { attributes: [{ buffer: vb, numComponents: 2 }] });

    renderer.state({
        viewport: { width, height },
        // scissorTest: true,
        // scissorBox: { width: width / 2, height },
        program: basicProgram,
        uniforms: [
            { type: "4f", name: "color", value: [1, 1, 0, 1] }
        ],
        vertexArrayObject: vao
    });

    renderer.clear({ color: [1, 0, 1, 1] });

    renderer.draw({ count: 4, mode: "TRIANGLE_STRIP" });

    // const url = new URL("./test.jsonc", location.origin);
    // const { renderState, blobs } = await downloadRenderState(url);
    // const view = createView(canvas);
    // view.render(renderState, blobs);
}

main(document.getElementById("container") as HTMLCanvasElement);