import { GL } from "./glEnum";
import type { RenderState } from "./state";
import { getActionTypes } from "./actions";
import { FrameContext } from "./frameContext";
import { createFrameStateResources } from "./resource";


export class View {
    readonly #actionTypes;
    readonly #activeTextureUnits;

    constructor(readonly canvas: HTMLCanvasElement, readonly gl: WebGL2RenderingContext) {
        this.#actionTypes = getActionTypes({ gl });
        this.#activeTextureUnits = gl.getParameter(GL.MAX_TEXTURE_IMAGE_UNITS) as number;
    }

    dispose() {
    }

    // TODO: make async?
    render(state: RenderState.Scene, binary?: ArrayBuffer) {
        const frameContext = this.#createFrameContext(state, binary);
        return frameContext.render(state.actions);
    }

    #createFrameContext(state: RenderState.Scene, binary?: ArrayBuffer) {
        const { gl } = this;
        const view = state.view ?? { width: this.canvas.clientWidth * devicePixelRatio, height: this.canvas.clientHeight * devicePixelRatio };
        const resources = createFrameStateResources(gl, state.resources, binary);
        return new FrameContext(this.canvas, this.gl, view, this.#activeTextureUnits, this.#actionTypes, resources);
    }
} 
