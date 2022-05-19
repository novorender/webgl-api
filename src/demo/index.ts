import type { JsonRendererData } from "@novorender/renderer/json.js";
import { createWebGL2Renderer } from "@novorender/renderer";
import { replay } from "./replay.js";

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
    const statsElement = document.getElementById("stats")!;
    function showStats(text: string) {
        statsElement.style.color = "yellow";
        statsElement.innerText = text;
    }
    function showOutput(text: string) {
        statsElement.style.color = "lime";
        statsElement.innerText = text;
    }
    function showError(text: string) {
        statsElement.style.color = "red";
        statsElement.innerText = text;
    }

    let run = false;
    canvas.addEventListener("click", function cb(e: any) {
        run = !run;
        lastMeasureTime = undefined;
        showStats(run ? "resumed" : "paused");
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
    const json = await response.json() as JsonRendererData;
    const { version, width, height, commands } = json;
    console.assert(version == "0.0.1");
    canvas.width = width;
    canvas.height = height;
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
                    showStats(`fps: ${fps.toFixed(1)}, measure: ${avgMeasureTime.toFixed(2)}ms`);
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
            showOutput(`[${[...exception].join(", ")}]`);
        } else {
            showError(exception.toString());
        }
    }
    renderer.dispose();
}

main(document.getElementById("container") as HTMLCanvasElement);