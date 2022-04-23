import { GL } from "./glEnum";
import { View } from "./view";
import { ActionBase } from "./actionBase";
import { FrameContext } from "./frameContext";
import { createBuffer, getProjectionMatrix } from "./util";
import { Mat4, Quat, Vec3 } from "./types";


/*
GLSL struct:
layout(std140) uniform CameraUniforms {
    mat4 dummyMatrix;
    mat4 projectionMatrix;
    mat4 viewMatrix;
};
*/

const cameraUniformBufferByteSize = 3 * 16 * 4;

function setCameraUniforms(cameraUniforms: Float32Array, projectionMatrix: Mat4, viewMatrix: Mat4) {
    cameraUniforms.set(projectionMatrix, 16);
    cameraUniforms.set(viewMatrix, 32);
}


export namespace CameraPerspectiveAction {
    class Action extends ActionBase {
        readonly #cameraUniforms;
        readonly #cameraUniformsBuffer;

        constructor(readonly view: View) {
            super();
            const { gl } = view;
            const data = new ArrayBuffer(cameraUniformBufferByteSize);
            this.#cameraUniforms = new Float32Array(data);
            this.#cameraUniformsBuffer = createBuffer(gl, GL.UNIFORM_BUFFER, cameraUniformBufferByteSize, GL.DYNAMIC_DRAW);;
        }

        override dispose(): void {
            const { gl } = this.view;
            gl.deleteBuffer(this.#cameraUniformsBuffer);
        }

        override execute(frameContext: FrameContext, params: CameraPerspectiveAction.Params) {
            const { gl, view } = frameContext;
            const { fov, position } = params;
            const [px, py, pz] = position ?? [0, 0, 0];

            const projectionMatrix = params.projectionMatrix ?? getProjectionMatrix(fov ?? 30, view.width / view.height, 1, 100);
            const viewMatrix = params.viewMatrix ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -px, -py, -pz, 1];
            const uniforms = this.#cameraUniforms;
            const buffer = this.#cameraUniformsBuffer;
            setCameraUniforms(uniforms, projectionMatrix, viewMatrix);
            gl.bindBuffer(GL.UNIFORM_BUFFER, buffer);
            gl.bufferSubData(GL.UNIFORM_BUFFER, 0, uniforms);
            gl.bindBuffer(GL.UNIFORM_BUFFER, null);
            frameContext.cameraUniformsBuffer = buffer; // not sure we should mutate frame context like this...
        }
    }

    export function create(view: View): ActionBase {
        return new Action(view);
    }
    export interface Params {
        readonly fov?: number; // vertical field of view in degrees. default = 30
        readonly position?: Vec3; // default [0,0,0]
        readonly rotation?: Quat; // default [0,0,0,1]
        readonly projectionMatrix?: Mat4;
        readonly viewMatrix?: Mat4;
    }
    export interface Data extends Params {
        readonly kind: "camera_perspective";
    }
    export declare const data: Data;
}
