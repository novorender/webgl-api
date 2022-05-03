import { GL } from "./glEnum";
import type { ActionTypes, RenderActionData } from "./actions";
import type { RenderState } from "./state";
import type { FrameContextResources } from "./resource";
import type { LimitsGL } from "./util";

export class FrameContext {
    constructor(
        readonly canvas: HTMLCanvasElement,
        readonly gl: WebGL2RenderingContext,
        readonly view: RenderState.View,
        readonly limits: LimitsGL,
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
        const { MAX_TEXTURE_IMAGE_UNITS, MAX_UNIFORM_BUFFER_BINDINGS, MAX_DRAW_BUFFERS, MAX_COLOR_ATTACHMENTS } = this.limits;

        gl.useProgram(null);
        gl.bindBuffer(GL.ARRAY_BUFFER, null);
        gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
        gl.bindVertexArray(null);

        // for (let i = 0; i < MAX_DRAW_BUFFERS; i++) {
        //     gl.bindBuffer(GL.DRAW_BUFFER0 + i, null);
        // }
        // gl.bindBuffer(GL.READ_BUFFER, null);

        // gl.bindBuffer(GL.COLOR_ATTACHMENT0, null);
        // for (let i = 1; i < MAX_COLOR_ATTACHMENTS; i++) {
        //     gl.bindBuffer(GL.COLOR_ATTACHMENT1 + i, null);
        // }

        for (let i = 0; i < MAX_TEXTURE_IMAGE_UNITS; i++) {
            gl.activeTexture(GL.TEXTURE0 + i);
            gl.bindTexture(GL.TEXTURE_2D, null);
            gl.bindTexture(GL.TEXTURE_CUBE_MAP, null);
        }
        gl.activeTexture(GL.TEXTURE0);

        for (let i = 0; i < MAX_UNIFORM_BUFFER_BINDINGS; i++) {
            gl.bindBufferBase(GL.UNIFORM_BUFFER, i, null);
        }

        gl.bindRenderbuffer(GL.RENDERBUFFER, null);
        gl.bindFramebuffer(GL.FRAMEBUFFER, null);

        const err = gl.getError();
        return err;
    }
}