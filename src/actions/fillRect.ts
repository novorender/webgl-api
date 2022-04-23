import { GL } from "../glEnum";
import type { RGBA } from "../types";
import type { FrameContext } from "../frameContext";
import { createBuffer, createShaderProgram, createVertexArrayBuffer, createUniformBlockBuffer, getUniformsInfo } from "../util";
import { ActionBase, ActionCtorArgs } from "./actionBase";
import vs from "./shaders/fillRect.vert";
import fs from "./shaders/fillRect.frag";

class Action extends ActionBase {
    readonly #program;
    readonly #vao;
    readonly #positionBuffer;
    readonly #rectUniforms;

    constructor(args: ActionCtorArgs) {
        super(args);
        const { gl } = args;
        const program = this.#program = createShaderProgram(gl, { vertex: vs, fragment: fs });
        const uniformsInfo = getUniformsInfo(gl, program);
        this.#rectUniforms = createUniformBlockBuffer(gl, program, "RectUniforms", uniformsInfo);
        this.#positionBuffer = createBuffer(gl, GL.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), GL.STATIC_DRAW);
        this.#vao = createVertexArrayBuffer(gl, [
            { index: gl.getAttribLocation(program, "position"), numComponents: 2, buffer: this.#positionBuffer }
        ]);
    }

    override dispose() {
        const { gl } = this.args;
        this.#rectUniforms.dispose();
        gl.deleteVertexArray(this.#vao);
        gl.deleteBuffer(this.#positionBuffer);
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
        gl.bindVertexArray(this.#vao);
        gl.drawArrays(GL.TRIANGLE_STRIP, 0, 4);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, blockIndex, null);
    }
}

export namespace FillRectAction {
    export function create(args: ActionCtorArgs): ActionBase {
        return new Action(args);
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
