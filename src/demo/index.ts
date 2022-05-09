// import { createView, downloadRenderState } from "@novorender/webgl-api";
// import { createJsonRenderer, createWebGL2Renderer, resizeCanvasToDisplaySize } from "@novorender/webgl2-renderer/";
// import { run } from "./run";
// import vertex from "../shaders/basic.vert";
// import fragment from "../shaders/basic.frag";
import { createWebGL2Renderer } from "@novorender/webgl2-renderer";
import { Command, replay } from "./replay";


async function main(canvas: HTMLCanvasElement) {
    // resizeCanvasToDisplaySize(canvas);
    // const { width, height } = canvas;
    // const renderer = createWebGL2Renderer(canvas);
    // run(renderer, width, height, vertex, fragment);

    canvas.width = 1024;
    canvas.height = 1024;
    const response = await fetch(new URL("./test.json", location.origin).toString());
    if (!response.ok)
        throw new Error("test.json not found!");
    const commands = await response.json() as readonly Command[];
    const renderer = createWebGL2Renderer(canvas, {
        alpha: false,
        antialias: false,
        depth: false,
        desynchronized: false,
        failIfMajorPerformanceCaveat: true,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        stencil: false,
    });
    try {
        replay(renderer, commands);
    } catch (error) {
        alert(error);
    }

    // const url = new URL("./test.jsonc", location.origin);
    // const { renderState, blobs } = await downloadRenderState(url);
    // const view = createView(canvas);
    // view.render(renderState, blobs);
}

main(document.getElementById("container") as HTMLCanvasElement);