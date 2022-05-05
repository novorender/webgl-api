import type { WebGL2Renderer } from "./renderer.js";
export interface Renderer extends Omit<WebGL2Renderer, "#context"> { }
export { createWebGL2Renderer } from "./renderer.js";
export { createJsonRenderer } from "./json.js";


export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, scale: number = window.devicePixelRatio) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const { width, height } = canvas.getBoundingClientRect();
    const displayWidth = Math.round(width * scale);
    const displayHeight = Math.round(height * scale);

    // Check if the canvas is not the same size.
    const needResize = canvas.width != displayWidth || canvas.height != displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}
