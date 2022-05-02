import { GL } from "/glEnum";
import type { FrameContext } from "/frameContext";
import { ActionBase, ActionCtorArgs } from "./actionBase";
import { UniformBlocks } from "/uniforms";
import { setAttributeDefaults } from "/attributes";
import { SamplerIndex, TextureIndex } from "/state";

class Action extends ActionBase {

    constructor(args: ActionCtorArgs) {
        super(args);
    }

    override execute(frameContext: FrameContext, params: DrawMeshAction.Params) {
        const { gl, resources } = frameContext;

        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(resources.programs[params.program]);

        if (params.baseColorTexture !== undefined) {
            const baseColorSamplerUniform = gl.getUniformLocation(resources.programs[params.program], "baseColorSampler"); // Can we store this in resources?
            gl.uniform1i(baseColorSamplerUniform, 0); // set texture binding index
            const baseColorTexture = resources.textures[params.baseColorTexture];
            gl.activeTexture(GL.TEXTURE0); // TODO: get slot from material constants?
            gl.bindTexture(GL.TEXTURE_2D, baseColorTexture);
        }
        if (params.baseColorSampler !== undefined) {
            const baseColorSampler = resources.samplers[params.baseColorSampler];
            gl.bindSampler(0, baseColorSampler); // TODO: get slot from material constants?
        }

        gl.bindBufferBase(GL.UNIFORM_BUFFER, UniformBlocks.camera, resources.buffers[params.cameraUniforms]);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, UniformBlocks.material, resources.buffers[params.materialUniforms]);
        gl.bindBufferBase(GL.UNIFORM_BUFFER, UniformBlocks.instance, resources.buffers[params.instanceUniforms]);

        const mesh = frameContext.resources.meshes[params.mesh];
        const { count, primitiveType, indices, vao } = mesh;
        gl.bindVertexArray(vao);
        setAttributeDefaults(gl);
        if (indices) {
            gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indices.buffer);
            gl.drawElements(primitiveType, count, indices.type, 0);
        } else {
            gl.drawArrays(primitiveType, 0, count);
        }
        gl.bindTexture(GL.TEXTURE_2D, null);
        gl.bindSampler(GL.TEXTURE0, null);

        gl.disable(gl.DEPTH_TEST);
    }
}

export namespace DrawMeshAction {
    export function create(args: ActionCtorArgs): ActionBase {
        return new Action(args);
    }
    export interface Params {
        readonly program: number; // index into resources/programs
        readonly mesh: number; // index into resources/meshes
        readonly cameraUniforms: number; // index into resources/buffers
        readonly materialUniforms: number; // index into resources/buffers
        readonly instanceUniforms: number; // index into resources/buffers
        readonly baseColorTexture?: TextureIndex;
        readonly baseColorSampler?: SamplerIndex;
    }
    export interface Data extends Params {
        readonly kind: "draw_mesh";
    }
    export declare const data: Data;
}

