import type { JsonRendererData } from "@novorender/renderer/json.js";
import { createWebGL2Renderer } from "@novorender/renderer";
import { replay } from "./replay.js";

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
        alpha: true,
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
        const { measurement, pixels } = render(0);
        if (pixels) {
            pixels.then(value => {
                showOutput(`[${[...value].join(", ")}]`);
            })
        } else if (measurement) {
            measurement.then(value => {
                measurements.push(value)
            });
        }
        while (!quit) {
            const time = await renderer.nextFrame(); // resolve promises for timers and readPixels that are ready/valid
            // renderer.pollPromises();
            if (run) {
                if (lastMeasureTime === undefined) {
                    lastMeasureTime = time;
                    frameCount = 0;
                }
                if (lastMeasureTime !== undefined && time > lastMeasureTime + 1000) {
                    const interval = (time - lastMeasureTime) / 1000;
                    const avgMeasureTime = (measurements.length == 0 ? 0 : measurements.reduce((a, b) => a + b) / measurements.length);
                    measurements.length = 0;
                    const fps = (frameCount / interval);
                    showStats(`fps: ${fps.toFixed(1)}, measure: ${avgMeasureTime.toFixed(2)}ms`);
                    lastMeasureTime = time;
                    frameCount = 0;
                }
                const { measurement, pixels } = render(time);
                if (measurement) {
                    measurement.then(value => {
                        measurements.push(value)
                    });
                } else if (pixels) {
                    pixels.then(value => {
                        showOutput(`[${[...value].join(", ")}]`);
                    })
                }
                frameCount++;
            }
        }
        statsElement.innerText = "stopped";
    } catch (exception: any) {
        showError(exception.toString());
    }
    renderer.dispose();
}

main(document.getElementById("container") as HTMLCanvasElement);