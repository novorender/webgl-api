import { GL } from "./glEnum";
import type { ActionTypes, RenderActionData } from "./actions";
import type { RenderStateView } from "./state";
import type { FrameContextResources } from "./resource";

export class FrameContext {
    cameraUniformsBuffer: WebGLBuffer | null = null; // can change multiple times during the course of rendering a frame

    constructor(
        readonly canvas: HTMLCanvasElement,
        readonly gl: WebGL2RenderingContext,
        readonly view: RenderStateView,
        readonly activeTextureUnits: number,
        readonly actionTypes: ActionTypes,
        readonly resources: FrameContextResources,
    ) {
    }

    render(actions: readonly RenderActionData[]) {
        this.#setViewport();
        this.#runActions(actions);
        this.#clearGLState();
        // TODO: return states and output state/images
    }

    #setViewport() {
        const { gl, canvas, view } = this;
        const { width, height } = view;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
    }

    #runActions(actions: readonly RenderActionData[]) {
        const { actionTypes } = this;
        for (const actionParams of actions) {
            const actionType = actionTypes[actionParams.kind];
            actionType.execute(this, actionParams);
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
        const n = this.activeTextureUnits;
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