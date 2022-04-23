import { GL } from "../glEnum";
import type { Mat4, Vec3 } from "../types";
import type { FrameContext } from "../frameContext";
import { createBuffer, createShaderProgram, rotateX, rotateY } from "../util";
import { createUniformBlockBuffer, createVertexArrayBuffer, getUniformsInfo } from "../util";
import { ActionBase, ActionCtorArgs } from "./actionBase";
import vs from "./shaders/drawCube.vert";
import fs from "./shaders/drawCube.frag";

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
    readonly #positionBuffer;
    readonly #colorsBuffer;
    readonly #cameraBlockIndex;
    readonly #meshUniforms;

    constructor(args: ActionCtorArgs) {
        super(args);
        const { gl } = args;
        const program = this.#program = createShaderProgram(gl, { vertex: vs, fragment: fs });
        const uniformsInfo = getUniformsInfo(gl, program);
        this.#cameraBlockIndex = gl.getUniformBlockIndex(program, "CameraUniforms");
        gl.uniformBlockBinding(program, this.#cameraBlockIndex, this.#cameraBlockIndex);
        this.#meshUniforms = createUniformBlockBuffer(gl, program, "MeshUniforms", uniformsInfo);
        this.#positionBuffer = createBuffer(gl, GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
        this.#colorsBuffer = createBuffer(gl, GL.ARRAY_BUFFER, new Float32Array(colors), GL.STATIC_DRAW);
        this.#vao = createVertexArrayBuffer(gl, [
            { index: gl.getAttribLocation(program, "position"), numComponents: 3, buffer: this.#positionBuffer },
            { index: gl.getAttribLocation(program, "color"), numComponents: 3, buffer: this.#colorsBuffer },
        ]);
        this.#indices = createBuffer(gl, GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL.STATIC_DRAW);
    }

    override dispose() {
        const { gl } = this.args;
        this.#meshUniforms.dispose();
        gl.deleteVertexArray(this.#vao);
        gl.deleteBuffer(this.#positionBuffer);
        gl.deleteBuffer(this.#colorsBuffer);
        gl.deleteBuffer(this.#indices);
        gl.deleteProgram(this.#program);
    }

    override execute(frameContext: FrameContext, params: DrawCubeAction.Params) {
        const { gl } = frameContext;

        function getModelMatrix() {
            const modelMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            rotateY(modelMatrix, (params.rotationY ?? 0) * Math.PI / 180);
            rotateX(modelMatrix, (params.rotationX ?? 0) * Math.PI / 180);

            if (params.position) {
                const [x, y, z] = params.position;
                modelMatrix[12] = x;
                modelMatrix[13] = y;
                modelMatrix[14] = z;
            }
            return modelMatrix;
        }
        const modelMatrix = params.modelMatrix ?? getModelMatrix();


        const meshUniforms = this.#meshUniforms;
        meshUniforms.set({ modelMatrix });

        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(this.#program);

        gl.bindBufferBase(GL.UNIFORM_BUFFER, this.#cameraBlockIndex, frameContext.cameraUniformsBuffer);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, meshUniforms.blockIndex, meshUniforms.buffer);

        gl.bindVertexArray(this.#vao);
        gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.#indices);
        gl.drawElements(GL.TRIANGLES, indices.length, GL.UNSIGNED_SHORT, 0);

        gl.bindBufferBase(GL.UNIFORM_BUFFER, this.#cameraBlockIndex, null);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, meshUniforms.blockIndex, null);

        gl.disable(gl.DEPTH_TEST);
    }
}

export namespace DrawCubeAction {
    export function create(args: ActionCtorArgs): ActionBase {
        return new Action(args);
    }
    export interface Params {
        readonly modelMatrix?: Mat4;
        readonly position?: Vec3;
        readonly rotationX?: number; // in degrees
        readonly rotationY?: number; // in degrees
    }
    export interface Data extends Params {
        readonly kind: "draw_cube";
    }
    export declare const data: Data;
}
