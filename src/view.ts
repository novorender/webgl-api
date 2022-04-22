import { ActionBase } from "./actionBase";
import { ActionKind, getActionTypes } from "./actions";
import { FrameContext } from "./frameContext";
import { GL } from "./glEnum";
import { RenderState } from "./state";

export class View {
    readonly #actionTypes;
    readonly #activeTextureUnits;

    constructor(readonly canvas: HTMLCanvasElement, readonly gl: WebGL2RenderingContext) {
        this.#actionTypes = getActionTypes(this);
        this.#activeTextureUnits = gl.getParameter(GL.MAX_TEXTURE_IMAGE_UNITS) as number;
    }

    // TODO: make async?
    render(state: RenderState) {
        const frameContext = new FrameContext(this.canvas, this.gl, state);
        this.#setViewport(frameContext);
        this.#runActions(frameContext, state);
        this.#clearGLState();
        // TODO: return states and output state/images
    }

    #setViewport(frameContext: FrameContext) {
        const { gl, canvas } = this;
        const { width, height } = frameContext.view;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
    }

    #runActions(frameContext: FrameContext, state: RenderState) {
        const actions = this.#actionTypes;
        for (const actionParams of state.actions) {
            const action = actions[actionParams.kind];
            action.execute(frameContext, actionParams);
        }
    }

    #clearGLState() {
        const { gl } = this;
        gl.useProgram(null);
        gl.bindBuffer(GL.ARRAY_BUFFER, null);
        gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
        // gl.bindBuffer(GL.READ_BUFFER, null);
        // gl.bindBuffer(GL.DRAW_BUFFER0, null);
        // gl.bindBuffer(GL.DRAW_BUFFER1, null);
        // gl.bindBuffer(GL.DRAW_BUFFER2, null);
        // gl.bindBuffer(GL.DRAW_BUFFER3, null);
        // gl.bindBuffer(GL.DRAW_BUFFER4, null);
        // gl.bindBuffer(GL.DRAW_BUFFER5, null);
        // gl.bindBuffer(GL.DRAW_BUFFER6, null);
        // gl.bindBuffer(GL.DRAW_BUFFER7, null);
        gl.bindVertexArray(null);
        const n = this.#activeTextureUnits;
        for (let i = 0; i < n; i++) {
            gl.activeTexture(GL.TEXTURE0 + i);
            gl.bindTexture(GL.TEXTURE_2D, null);
            gl.bindTexture(GL.TEXTURE_CUBE_MAP, null);
        }
        gl.activeTexture(GL.TEXTURE0);
        gl.bindRenderbuffer(GL.RENDERBUFFER, null);
        gl.bindFramebuffer(GL.FRAMEBUFFER, null);
        const err = gl.getError();
        return err;
    }
} 
