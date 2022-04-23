import { GL } from "./glEnum";
import { getActionTypes } from "./actions";
import { FrameContext } from "./frameContext";
import { RenderState } from "./state";
import { createBuffer } from "./util";


export class View {
    readonly #actionTypes;
    readonly #activeTextureUnits;

    constructor(readonly canvas: HTMLCanvasElement, readonly gl: WebGL2RenderingContext) {
        this.#actionTypes = getActionTypes(this);
        this.#activeTextureUnits = gl.getParameter(GL.MAX_TEXTURE_IMAGE_UNITS) as number;
    }

    dispose() {
    }

    // TODO: make async?
    render(state: RenderState) {
        const frameContext = this.#createFrameContext(state);
        return frameContext.render(state.actions);
    }

    #createFrameContext(state: RenderState) {
        const view = state.view ?? { width: this.canvas.clientWidth * devicePixelRatio, height: this.canvas.clientHeight * devicePixelRatio };
        return new FrameContext(this.canvas, this.gl, view, this.#activeTextureUnits, this.#actionTypes);
    }
} 
