import type { RenderActionData } from "./actions";
import type { FlagNames, ShaderName } from "./programs";
import type { MeshResourceVertexAttributes } from "./resource";
// import { AttributeParams } from "./util";

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
        readonly buffers: readonly BufferResource[];
        readonly meshes: readonly MeshResource[];
        readonly programs: readonly ProgramResource[];
        // TODO: Add materials?
        // TODO: Add textures
    }

    export interface BufferResource {
        readonly type: "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER";
    }

    export interface BufferResourceBinary extends BufferResource {
        readonly byteOffset: number;
        readonly byteLength: number;
    }

    export interface BufferResourceArray extends BufferResource {
        readonly arrayType?: "Float32Array" | "Uint8Array" | "Uint16Array" | "Uint32Array"; // default Float32Array
        readonly array: readonly number[];
    }

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

    export interface ProgramResource<T extends ShaderName = ShaderName> {
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
        readonly mesh: number;
        readonly material: number;
        // TODO: Add per-instance uniforms, e.g. model-world transform
        // TODO: Add per-instance material overrides?
    }

}


