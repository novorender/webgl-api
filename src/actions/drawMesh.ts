import { GL } from "../glEnum";
import type { Mat4, Vec3 } from "../types";
import type { FrameContext } from "../frameContext";
import { createShaderProgram, rotateX, rotateY, createUniformBlockBuffer, getUniformsInfo } from "../util";
import { meshResourceVertexAttributeBindings, MeshResourceVertexAttributes } from "../resource";
import { ActionBase, ActionCtorArgs } from "./actionBase";
import vs from "../shaders/drawMesh.vert";
import fs from "../shaders/drawMesh.frag";

class Action extends ActionBase {
    readonly #program;
    readonly #cameraBlockIndex;
    readonly #meshUniforms;

    constructor(args: ActionCtorArgs) {
        super(args);
        const { gl } = args;
        const program = this.#program = createShaderProgram(gl, { vertex: vs, fragment: fs }, meshResourceVertexAttributeBindings);
        const uniformsInfo = getUniformsInfo(gl, program);
        this.#cameraBlockIndex = gl.getUniformBlockIndex(program, "CameraUniforms");
        gl.uniformBlockBinding(program, this.#cameraBlockIndex, this.#cameraBlockIndex);
        this.#meshUniforms = createUniformBlockBuffer(gl, program, "MeshUniforms", uniformsInfo);
    }

    override dispose() {
        const { gl } = this.args;
        this.#meshUniforms.dispose();
        gl.deleteProgram(this.#program);
    }

    override execute(frameContext: FrameContext, params: DrawMeshAction.Params) {
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

        const meshResource = frameContext.resources.meshes[params.mesh];

        gl.bindVertexArray(meshResource.vao);
        gl.vertexAttrib4f(MeshResourceVertexAttributes.color0, 1, 1, 1, 1); // default attribute value

        const { count, primitiveType, indices } = meshResource;

        if (indices) {
            gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indices.buffer);
            gl.drawElements(primitiveType, count, indices.type, 0);
        } else {
            gl.drawArrays(primitiveType, 0, count);
        }

        gl.bindBufferBase(GL.UNIFORM_BUFFER, this.#cameraBlockIndex, null);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, meshUniforms.blockIndex, null);

        gl.disable(gl.DEPTH_TEST);
    }
}

export namespace DrawMeshAction {
    export function create(args: ActionCtorArgs): ActionBase {
        return new Action(args);
    }
    export interface Params {
        readonly mesh: number; // index into resources/meshes
        // TODO: Add material?

        readonly modelMatrix?: Mat4;
        readonly position?: Vec3;
        readonly rotationX?: number; // in degrees
        readonly rotationY?: number; // in degrees
    }
    export interface Data extends Params {
        readonly kind: "draw_mesh";
    }
    export declare const data: Data;
}

