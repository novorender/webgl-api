import { RGBA } from "./types";
import { View } from "./view";
import vs from "./shaders/fillRect.vert";
import fs from "./shaders/fillRect.frag";
import { createShaderProgram } from "./shader";
import { ActionBase } from "./actionBase";
import { GL } from "./glEnum";
import { FrameContext } from "./frameContext";
import { createVertexArrayBuffer, createUniformBlockBuffer, getUniformsInfo } from "./util";

class Action extends ActionBase {
    readonly #program;
    readonly #vao;
    readonly #rectUniforms;

    constructor(readonly view: View) {
        super(view);
        const { gl } = view;
        const program = this.#program = createShaderProgram(gl, { vertex: vs, fragment: fs });
        const uniformsInfo = getUniformsInfo(gl, program);
        this.#rectUniforms = createUniformBlockBuffer(gl, program, "RectUniforms", uniformsInfo);
        this.#vao = createVertexArrayBuffer(gl, program, {
            buffers: [
                { data: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]) }
            ],
            attributes: {
                position: { numComponents: 2 }
            }
        });
    }

    override dispose() {
        const { gl } = this.view;
        this.#vao.dispose();
        this.#rectUniforms.dispose();
        gl.deleteProgram(this.#program);
    }

    override execute(frameContext: FrameContext, params: FillRectAction.Params) {
        const { gl, view } = frameContext;
        const { rect } = params;
        const color = params.color ?? [1, 1, 1, 1];
        const scale = [rect.width / view.width, rect.height / view.height];
        const offset = [rect.x / view.width, rect.y / view.height];
        gl.useProgram(this.#program);
        const uniforms = this.#rectUniforms;
        const { blockIndex } = uniforms;
        uniforms.set({ scale, offset, color });
        gl.bindBufferBase(GL.UNIFORM_BUFFER, blockIndex, uniforms.buffer);
        gl.bindVertexArray(this.#vao.array);
        gl.drawArrays(GL.TRIANGLE_STRIP, 0, 4);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, blockIndex, null);
    }
}

export namespace FillRectAction {
    export function create(view: View): ActionBase {
        return new Action(view);
    }
    export interface Params {
        readonly color?: RGBA;
        // coordinates are defined in screen space, i.e. pixels
        readonly rect: {
            readonly x: number;
            readonly y: number;
            readonly width: number;
            readonly height: number;
        }
    }
    export interface Data extends Params {
        readonly kind: "fill_rect";
    }
    export declare const data: Data;
}
