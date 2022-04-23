import type { RenderActionData } from "./actions";
import type { MeshResourceVertexAttributes } from "./resource";
import { AttributeParams } from "./util";

export interface RenderState {
    readonly view?: RenderStateView;
    readonly resources?: RenderStateResources;
    readonly actions: readonly RenderActionData[];
}

export interface RenderStateView {
    readonly width: number;
    readonly height: number;
}

export interface RenderStateResources {
    readonly buffers: readonly RenderStateBufferResource[];
    readonly meshes: readonly RenderStateMeshResource[];
}

export interface RenderStateBufferResource {
    readonly type: "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER";
    // TODO: Reference into a binary blob instead/in addition.
    readonly arrayType?: "Float32Array" | "Uint8Array" | "Uint16Array" | "Uint32Array"; // default Float32Array
    readonly data: readonly number[];
}


export type VertexSemantic = keyof typeof MeshResourceVertexAttributes;

export interface RenderStateMeshResource {
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