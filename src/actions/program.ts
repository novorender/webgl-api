import { GL } from "../glEnum";
import type { RGBA } from "../types";
import type { FrameContext } from "../frameContext";
import { createBuffer, createShaderProgram, createVertexArrayBuffer, createUniformBlockBuffer, getUniformsInfo } from "../util";
import { ActionBase, ActionCtorArgs } from "./actionBase";
import vs from "./shaders/fillRect.vert";
import fs from "./shaders/fillRect.frag";

class Action extends ActionBase {
    readonly #program;
    readonly #defaultUniforms;

    constructor(args: ActionCtorArgs) {
        super(args);
        const { gl } = args;
        const program = this.#program = createShaderProgram(gl, { vertex: vs, fragment: fs });
        const uniformsInfo = getUniformsInfo(gl, program);
        this.#defaultUniforms = createUniformBlockBuffer(gl, program, "MaterialUniforms", uniformsInfo);
    }

    override dispose() {
        const { gl } = this.args;
        gl.deleteProgram(this.#program);
    }

    override execute(frameContext: FrameContext, params: ProgramAction.Params) {
        const { gl, view } = frameContext;
        gl.useProgram(this.#program);
        const uniforms = this.#defaultUniforms;
        const { blockIndex } = uniforms;
        uniforms.set({});
        gl.bindBufferBase(GL.UNIFORM_BUFFER, blockIndex, uniforms.buffer);
    }
}

export namespace ProgramAction {
    export function create(args: ActionCtorArgs): ActionBase {
        return new Action(args);
    }
    export interface Params {
        readonly shader?: string;
        readonly defaultUniforms?: Object;
        readonly defaultAttributes: readonly Object[];
    }
    export interface Data extends Params {
        readonly kind: "program";
    }
    export declare const data: Data;
}
