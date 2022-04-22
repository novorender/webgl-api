import { RGBA } from "./types";
import { View } from "./view";
import vs from "./shaders/drawCube.vert";
import fs from "./shaders/drawCube.frag";
import { createShaderProgram } from "./shader";
import { ActionBase } from "./actionBase";
import { GL } from "./glEnum";
import { FrameContext } from "./frameContext";
import { createUniformBlockBuffer, createVertexArrayBuffer, getUniformsInfo } from "./util";

const vertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
    1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
    -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
    -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
];

const colors = [
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,
];

const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
];


class Action extends ActionBase {
    readonly #program;
    readonly #indices;
    readonly #vao;
    readonly #cameraUniforms; // Should really be in view or somewhere else.
    readonly #meshUniforms;

    constructor(readonly view: View) {
        super(view);
        const { gl } = view;
        const program = this.#program = createShaderProgram(gl, { vertex: vs, fragment: fs });
        const uniformsInfo = getUniformsInfo(gl, program);
        this.#cameraUniforms = createUniformBlockBuffer(gl, program, "CameraUniforms", uniformsInfo);
        this.#meshUniforms = createUniformBlockBuffer(gl, program, "MeshUniforms", uniformsInfo);
        this.#vao = createVertexArrayBuffer(gl, program, {
            buffers: [
                { data: new Float32Array(vertices) },
                { data: new Float32Array(colors) },
            ],
            attributes: {
                position: { numComponents: 3, buffer: 0 },
                color: { numComponents: 3, buffer: 1 },
            }
        });

        this.#indices = gl.createBuffer()!;
        gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.#indices);
        gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL.STATIC_DRAW);
        gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    }

    override dispose() {
        const { gl } = this.view;
        this.#vao.dispose();
        this.#cameraUniforms.dispose();
        this.#meshUniforms.dispose();
        gl.deleteBuffer(this.#indices);
        gl.deleteProgram(this.#program);
    }

    override execute(frameContext: FrameContext, params: DrawCubeAction.Params) {
        const { gl, view } = frameContext;

        function getProjection(angle: number, a: number, zMin: number, zMax: number) {
            const ang = Math.tan((angle * .5) * Math.PI / 180);//angle*.5
            return [
                0.5 / ang, 0, 0, 0,
                0, 0.5 * a / ang, 0, 0,
                0, 0, -(zMax + zMin) / (zMax - zMin), -1,
                0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
            ];
        }

        function rotateX(m: number[], angle: number) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv1 = m[1], mv5 = m[5], mv9 = m[9];

            m[1] = m[1] * c - m[2] * s;
            m[5] = m[5] * c - m[6] * s;
            m[9] = m[9] * c - m[10] * s;

            m[2] = m[2] * c + mv1 * s;
            m[6] = m[6] * c + mv5 * s;
            m[10] = m[10] * c + mv9 * s;
        }

        function rotateY(m: number[], angle: number) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv0 = m[0], mv4 = m[4], mv8 = m[8];

            m[0] = c * m[0] + s * m[2];
            m[4] = c * m[4] + s * m[6];
            m[8] = c * m[8] + s * m[10];

            m[2] = c * m[2] - s * mv0;
            m[6] = c * m[6] - s * mv4;
            m[10] = c * m[10] - s * mv8;
        }

        const projectionMatrix = getProjection(40, view.width / view.height, 1, 100);
        const modelMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const viewMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        viewMatrix[14] = viewMatrix[14] - 6;

        rotateY(modelMatrix, (params.rotationY ?? 0) * Math.PI / 180);
        rotateX(modelMatrix, (params.rotationX ?? 0) * Math.PI / 180);

        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(this.#program);

        const cameraUniforms = this.#cameraUniforms;
        cameraUniforms.set({ projectionMatrix, viewMatrix });

        const meshUniforms = this.#meshUniforms;
        meshUniforms.set({ modelMatrix });

        gl.bindBufferBase(GL.UNIFORM_BUFFER, cameraUniforms.blockIndex, cameraUniforms.buffer);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, meshUniforms.blockIndex, meshUniforms.buffer);

        gl.bindVertexArray(this.#vao.array);
        gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.#indices);
        gl.drawElements(GL.TRIANGLES, indices.length, GL.UNSIGNED_SHORT, 0);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, meshUniforms.blockIndex, null);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, cameraUniforms.blockIndex, null);

        gl.disable(gl.DEPTH_TEST);
    }
}

export namespace DrawCubeAction {
    export function create(view: View): ActionBase {
        return new Action(view);
    }
    export interface Params {
        readonly kind: "draw_cube";
        readonly rotationX?: number; // in degrees
        readonly rotationY?: number; // in degrees
    }
    export interface Data extends Params {
        readonly kind: "draw_cube";
    }
    export declare const data: Data;
}
