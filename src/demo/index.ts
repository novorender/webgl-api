// import { createView, downloadRenderState } from "@novorender/webgl-api";
// import { createJsonRenderer, createWebGL2Renderer, resizeCanvasToDisplaySize } from "@novorender/webgl2-renderer/";
// import { run } from "./run";
// import vertex from "../shaders/basic.vert";
// import fragment from "../shaders/basic.frag";
import { createWebGL2Renderer } from "@novorender/webgl2-renderer";
import { Command, replay } from "./replay";
import { discs } from "./discs";

async function waitClick(canvas: HTMLCanvasElement) {
    return new Promise<void>(resolve => {
        canvas.addEventListener("click", function cb(e: any) {
            canvas.removeEventListener("click", cb);
            resolve();
        });
    });
}

async function waitFrame(element: HTMLElement): Promise<number | undefined> {
    return new Promise<number | undefined>(resolve => {
        function cb(e: KeyboardEvent) {
            if (e.key == "Escape") {
                element.removeEventListener("keydown", cb);
                cancelAnimationFrame(handle);
                resolve(undefined);
            }
        }
        const handle = requestAnimationFrame(time => {
            element.removeEventListener("keydown", cb);
            resolve(time);
        })
        element.addEventListener("keydown", cb);
    });
}


async function main(canvas: HTMLCanvasElement) {
    // resizeCanvasToDisplaySize(canvas);
    // const { width, height } = canvas;
    // const renderer = createWebGL2Renderer(canvas);
    // run(renderer, width, height, vertex, fragment);

    canvas.width = 1024;
    canvas.height = 1024;
    // const response = await fetch(new URL("./test.json", location.origin).toString());
    // if (!response.ok)
    //     throw new Error("test.json not found!");
    // const commands = await response.json() as readonly Command[];
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
        const render = discs(renderer);
        let time: number | undefined = 0;
        while (time !== undefined && render(time)) {
            time = await waitFrame(document.body);
        }
    } catch (error) {
        alert(error);
    }
    renderer.dispose();

    // const url = new URL("./test.jsonc", location.origin);
    // const { renderState, blobs } = await downloadRenderState(url);
    // const view = createView(canvas);
    // view.render(renderState, blobs);
}

main(document.getElementById("container") as HTMLCanvasElement);