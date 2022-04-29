import { View } from "./view";
import { createGLContext, stripJsonComments } from "./util";
import type { RenderState } from "./state";

export function createView(canvas: HTMLCanvasElement) {
    const gl = createGLContext(canvas);
    if (!gl)
        throw new Error("Unable to create webgl2 context!");

    canvas.addEventListener("webglcontextlost", function (event) {
        // event.preventDefault();
        // TODO: Handle!
        console.error("WebGL Context lost");
    }, false);

    canvas.addEventListener(
        "webglcontextrestored", function (event) {
            // event.preventDefault();
            // TODO: Handle!
            console.info("WebGL Context restored");
        }, false);

    return new View(canvas, gl);
}

export async function downloadRenderState(url: URL) {
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}: ${response.statusText} (${url})`);
    }
    const jsonc = await response.text();
    const renderState = parseRenderState(jsonc);
    const blobPromises = (renderState?.resources?.blobs ?? []).map(async blobParams => {
        const response = await fetch(new URL(blobParams.url, url).toString());
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}: ${response.statusText} (${url})`);
        }
        return await response.arrayBuffer();
    });
    const blobs = await Promise.all(blobPromises);

    return { renderState, blobs } as const;
}

export function parseRenderState(jsonc: string): RenderState.Scene {
    const json = stripJsonComments(jsonc);
    const renderState = JSON.parse(json);
    return validateRenderState(renderState);
}

export function validateRenderState(renderState: any): RenderState.Scene {
    // TODO: add validation!
    // use json schema? https://github.com/YousefED/typescript-json-schema
    return renderState as RenderState.Scene;
}
