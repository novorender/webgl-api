import { GL } from "./glEnum";
import type { RenderState } from "./state";
import { getActionTypes } from "./actions";
import { FrameContext } from "./frameContext";
import { createFrameStateResources } from "./resource";
import { getLimits } from "./util";

export class View {
    readonly #actionTypes;
    readonly #limits;

    constructor(readonly canvas: HTMLCanvasElement, readonly gl: WebGL2RenderingContext) {
        this.#actionTypes = getActionTypes({ gl });
        this.#limits = getLimits(gl);
    }

    dispose() {
    }

    // TODO: make async?
    async render(state: RenderState.Scene, blobs: readonly ArrayBuffer[]) {
        const frameContext = await this.#createFrameContext(state, blobs);
        return frameContext.render(state.actions);
    }

    async #createFrameContext(state: RenderState.Scene, blobs: readonly ArrayBuffer[]) {
        const { gl } = this;
        const view = state.view ?? { width: this.canvas.clientWidth * devicePixelRatio, height: this.canvas.clientHeight * devicePixelRatio };
        const viewAspect = view.width / view.height;
        const resources = await createFrameStateResources(gl, viewAspect, state.resources, blobs);
        return new FrameContext(this.canvas, this.gl, view, this.#limits, this.#actionTypes, resources);
    }
} 
