import { RenderState } from "./state";

export class FrameContext {
    readonly view;

    constructor(
        readonly canvas: HTMLCanvasElement,
        readonly gl: WebGL2RenderingContext,
        state: RenderState,
    ) {
        this.view = state.view ?? { width: canvas.clientWidth, height: canvas.clientHeight };
    }
}