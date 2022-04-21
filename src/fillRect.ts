import { RGBA } from "./types";
import { View } from "./view";
import vs from "./shaders/fillRect.vert";
import fs from "./shaders/fillRect.frag";
import { createShaderProgram } from "./shader";
import { ActionBase } from "./actionBase";
import { GL } from "./glEnum";
import { FrameContext } from "./frameContext";

class Action extends ActionBase {
    readonly #program;
    readonly #vb;
    readonly #vao;
    readonly #scaleUniform;
    readonly #offsetUniform;
    readonly #colorUniform;

    constructor(readonly view: View) {
        super(view);
        const { gl } = view;

        const program = this.#program = createShaderProgram(gl, { vertex: vs, fragment: fs });
        const posAttrib = gl.getAttribLocation(program, "position");
        console.assert(posAttrib >= 0);
        this.#scaleUniform = gl.getUniformLocation(program, "scale");
        this.#offsetUniform = gl.getUniformLocation(program, "offset");
        this.#colorUniform = gl.getUniformLocation(program, "color");

        this.#vb = gl.createBuffer()!;
        gl.bindBuffer(GL.ARRAY_BUFFER, this.#vb);
        gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), GL.STATIC_DRAW);
        gl.bindBuffer(GL.ARRAY_BUFFER, null);

        this.#vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.#vao);
        gl.bindBuffer(GL.ARRAY_BUFFER, this.#vb);
        gl.vertexAttribPointer(posAttrib, 2, GL.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posAttrib);
        gl.bindBuffer(GL.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    override dispose() {
        const { gl } = this.view;
        gl.deleteVertexArray(this.#vao);
        gl.deleteBuffer(this.#vb);
        gl.deleteProgram(this.#program);
    }

    override execute(frameContext: FrameContext, params: FillRectAction.Params) {
        const { gl, view } = frameContext;
        const { color, rect } = params;
        const sx = rect.width / view.width * 2;
        const sy = rect.height / view.height * 2;
        const ox = rect.x / view.width;
        const oy = rect.y / view.height;
        gl.useProgram(this.#program);
        gl.uniform2f(this.#scaleUniform, sx, sy);
        gl.uniform2f(this.#offsetUniform, ox, oy);
        gl.uniform4fv(this.#colorUniform, color ?? [1, 1, 1, 1]);
        gl.bindVertexArray(this.#vao);
        gl.drawArrays(GL.TRIANGLE_STRIP, 0, 4);
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
}
