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

async function nextFrame(): Promise<number> {
    return new Promise<number>(resolve => {
        const handle = requestAnimationFrame(time => {
            resolve(time);
        })
    });
}


async function main(canvas: HTMLCanvasElement) {
    // resizeCanvasToDisplaySize(canvas);
    // const { width, height } = canvas;
    // const renderer = createWebGL2Renderer(canvas);
    // run(renderer, width, height, vertex, fragment);

    const statsElement = document.getElementById("stats")!;

    let run = false;
    canvas.addEventListener("click", function cb(e: any) {
        run = !run;
        lastMeasureTime = undefined;
        statsElement.innerText = run ? "resumed" : "paused";
    });

    let quit = false;
    canvas.addEventListener("keydown", e => {
        if (e.key == "Escape")
            quit = true;
    });

    canvas.width = 512;
    canvas.height = 512;
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
    let lastMeasureTime: number | undefined = undefined;
    let measurements: number[] = [];
    let frameCount = 0;
    try {
        // const useFloat = true;
        // const interleaved = true;
        // const numTrianglesPerObject = 32768;
        // const render = discs(renderer, numTrianglesPerObject, useFloat, interleaved);
        const render = replay(renderer, commands);
        await render(0);
        while (!quit) {
            const time = await nextFrame();
            if (run) {
                if (lastMeasureTime === undefined) {
                    lastMeasureTime = time;
                    frameCount = 0;
                }
                measurements.push(...renderer.measurements);
                if (lastMeasureTime !== undefined && time > lastMeasureTime + 1000) {
                    const interval = (time - lastMeasureTime) / 1000;
                    const avgMeasureTime = (measurements.length == 0 ? 0 : measurements.reduce((a, b) => a + b) / measurements.length);
                    measurements.length = 0;
                    const fps = (frameCount / interval);
                    statsElement.innerText = `fps: ${fps.toFixed(1)}, measure: ${avgMeasureTime.toFixed(2)}ms`;
                    lastMeasureTime = time;
                    frameCount = 0;
                }
                await render(time);
                frameCount++;
            }
        }
        statsElement.innerText = "stopped";
    } catch (exception: any) {
        if (typeof exception == "object" && Symbol.iterator in exception) {
            statsElement.style.color = "lime";
            statsElement.innerText = `[${[...exception].join(", ")}]`;
        } else {
            statsElement.style.color = "red";
            statsElement.innerText = exception.toString();
        }
    }
    // for (let i = 0; i < 60; i++)
    //     await nextFrame();
    renderer.dispose();

    // const url = new URL("./test.jsonc", location.origin);
    // const { renderState, blobs } = await downloadRenderState(url);
    // const view = createView(canvas);
    // view.render(renderState, blobs);
}

main(document.getElementById("container") as HTMLCanvasElement);