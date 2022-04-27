import type { RenderActionData } from "./actions";
import type { MeshResourceVertexAttributes } from "./attributes";
import type { FlagNames, ShaderNames } from "./programs";
import type { Mat4, RGBA } from "./types";

export namespace RenderState {
    export type VertexSemantic = keyof typeof MeshResourceVertexAttributes;

    export interface Scene {
        readonly binaryUrl?: string;
        readonly view?: View;
        readonly resources?: Resources;
        readonly actions: readonly RenderActionData[];
    }

    export interface View {
        readonly width: number;
        readonly height: number;
    }

    export interface Resources {
        readonly binaryUrl?: string;
        readonly programs: readonly ProgramResource[];
        readonly buffers: readonly BufferResource[];
        readonly meshes: readonly MeshResource[];
        // TODO: Add textures
    }

    export interface BufferResourceBinary {
        readonly type: "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER" | "UNIFORM_BUFFER";
        readonly byteOffset: number;
        readonly byteLength: number;
    }

    export interface BufferResourceArray {
        readonly type: "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER" | "UNIFORM_BUFFER";
        readonly arrayType?: "Float32Array" | "Uint8Array" | "Uint16Array" | "Uint32Array"; // default Float32Array
        readonly array: readonly number[];
    }

    export interface BufferResourceUniformBlockInstance {
        readonly type: "UNIFORM_BUFFER";
        readonly instance: {
            modelMatrix?: Mat4; // default = identity matrix
        }
    }

    export interface BufferResourceUniformBlockMaterial {
        readonly type: "UNIFORM_BUFFER";
        readonly material: {
            baseColor?: RGBA; // default = [1,1,1,1]
        }
    }

    export interface BufferResourceUniformBlockCamera {
        readonly type: "UNIFORM_BUFFER";
        readonly camera: {
            readonly viewMatrix?: Mat4; // default = identity matrix
            readonly projectionMatrix?: { // we don't want a complete matrix here, since we want to inject aspect ratio from view width/height.
                readonly fov?: number; // vertical field of view in degrees. default = 30
                readonly near?: number; // default = 0.1
                readonly far?: number; // default = 1000
            }
        }
    }

    export type BufferResource = BufferResourceBinary | BufferResourceArray | BufferResourceUniformBlockCamera | BufferResourceUniformBlockMaterial | BufferResourceUniformBlockInstance;

    export interface MeshResource {
        readonly primitiveType?: "POINTS" | "LINE_STRIP" | "LINE_LOOP" | "LINES" | "TRIANGLE_STRIP" | "TRIANGLE_FAN" | "TRIANGLES"; // default is "TRIANGLES"
        readonly count: number; // # indices (or vertices)

        readonly attributes: {
            readonly [P in VertexSemantic]: {
                readonly buffer: number; // index into resources/buffers
                // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
                readonly numComponents: 1 | 2 | 3 | 4;
                readonly componentType?: "BYTE" | "UNSIGNED_BYTE" | "SHORT" | "UNSIGNED_SHORT" | "FLOAT" | "HALF_FLOAT"; // default: FLOAT
                readonly normalized?: boolean; // default: false
                readonly stride?: number; // default: 0
                readonly offset?: number; // default: 0
            }
        };

        readonly indices?: {
            readonly type: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
            readonly buffer: number;
        };
    }

    export interface ProgramResource<T extends ShaderNames = ShaderNames> {
        readonly shader: T;
        readonly flags?: readonly FlagNames<T>[]; // shader #ifdef's
        // uniform defaults?
        // attribute default?
    }

    export interface MaterialResource {
        readonly program: string;
        readonly uniforms: any;
        readonly attributes?: any; // default values for vertex attributes.
    }

    export interface MeshInstance {
        readonly mesh: number; // index into resources.meshes
        readonly camera: number; // index into resources.buffers
        readonly material: number; // index into resources.buffers
        readonly instance: number; // index into resources.buffers
    }

}


