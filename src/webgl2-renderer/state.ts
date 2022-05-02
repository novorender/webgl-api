import { FrameBufferIndex } from "./frameBuffer";
import type { RendererContext } from "./renderer";
import { TextureIndex } from "./texture";
import { VertexArrayIndex } from "./vao";
import { GL } from "/glEnum";
import { BufferIndex, SamplerIndex } from "/state";

export type BlendEquation = "FUNC_ADD" | "FUNC_SUBTRACT" | "FUNC_REVERSE_SUBTRACT"; // | "MIN_EXT" | "MAX_EXT";
export type BlendFunction = "ZERO" | "ONE" | "SRC_COLOR" | "ONE_MINUS_SRC_COLOR" | "DST_COLOR" | "ONE_MINUS_DST_COLOR" | "SRC_ALPHA" | "ONE_MINUS_SRC_ALPHA" | "DST_ALPHA" | "ONE_MINUS_DST_ALPHA" | "CONSTANT_COLOR" | "ONE_MINUS_CONSTANT_COLOR" | "CONSTANT_ALPHA" | "ONE_MINUS_CONSTANT_ALPHA" | "SRC_ALPHA_SATURATE";
export type CullMode = "FRONT" | "BACK" | "FRONT_AND_BACK";
export type DepthFunc = "NEVER" | "LESS" | "EQUAL" | "LEQUAL" | "GREATER" | "NOTEQUAL" | "GEQUAL" | "ALWAYS";
export type Winding = "CW" | "CCW";
export type ColorAttachment = `COLOR_ATTACHMENT${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;

export interface StateParams {
    readonly "BLEND": boolean; // false
    readonly "BLEND_COLOR": readonly [red: number, green: number, blue: number, alpha: number]; // new Float32Array([0,0,0,0]) (r,g,b,a);
    readonly "BLEND_DST_ALPHA": BlendFunction; // ZERO
    readonly "BLEND_DST_RGB": BlendFunction; // ZERO 
    readonly "BLEND_EQUATION_ALPHA": BlendEquation; // FUNC_ADD
    readonly "BLEND_EQUATION_RGB": BlendEquation; // FUNC_ADD
    readonly "BLEND_SRC_ALPHA": BlendFunction; // ONE
    readonly "BLEND_SRC_RGB": BlendFunction; // ONE

    readonly "CULL_FACE": boolean; // false
    readonly "CULL_FACE_MODE": CullMode; // BACK
    readonly "FRONT_FACE": Winding; // CCW

    readonly "DEPTH_TEST": boolean; // false
    readonly "DEPTH_FUNC": DepthFunc; // LESS
    readonly "DEPTH_WRITEMASK": boolean; // true
    readonly "DEPTH_RANGE": readonly [near: number, far: number]; // new Float32Array([0, 1]) (near, far)

    readonly "DITHER": boolean; // true

    readonly "POLYGON_OFFSET_FILL": boolean; // false
    readonly "POLYGON_OFFSET_FACTOR": number; // 0
    readonly "POLYGON_OFFSET_UNITS": number; // 0

    readonly "SAMPLE_ALPHA_TO_COVERAGE": boolean; // false
    readonly "SAMPLE_COVERAGE": boolean; // false
    readonly "SAMPLE_COVERAGE_VALUE": number; // 1.0
    readonly "SAMPLE_COVERAGE_INVERT": boolean; // false

    readonly "STENCIL_TEST": boolean; // false
    readonly "STENCIL_FUNC": DepthFunc; // ALWAYS
    readonly "STENCIL_VALUE_MASK": number; // 0x7FFFFFFF
    readonly "STENCIL_REF": number; // 0
    readonly "STENCIL_BACK_FUNC": DepthFunc; // ALWAYS
    readonly "STENCIL_BACK_VALUE_MASK": number; // 0x7FFFFFFF,
    readonly "STENCIL_BACK_REF": number; // 0

    readonly "VIEWPORT": readonly [x: number, y: number, width: number, height: number]; // Does this even belong here?

    readonly "SCISSOR_TEST": boolean; // false
    readonly "SCISSOR_BOX": [x: number, y: number, width: number, height: number];

    readonly "RASTERIZER_DISCARD": boolean; // false

    readonly ARRAY_BUFFER_BINDING: BufferIndex | null;
    readonly ELEMENT_ARRAY_BUFFER_BINDING: BufferIndex | null;

    readonly VERTEX_ARRAY_OBJECT: VertexArrayIndex | null;
    readonly ATTRIBUTE_DEFAULTS: readonly [red: number, blue: number, green: number, alpha: number][]; // max length: MAX_VERTEX_ATTRIBS
    readonly UNIFORM_BUFFERS: readonly BufferIndex[]; // max length: MAX_UNIFORM_BUFFER_BINDINGS
    readonly TEXTURE_SAMPLER_UNIFORMS: readonly SamplerIndex[]; // max length: MAX_COMBINED_TEXTURE_IMAGE_UNITS
    readonly TEXTURES: readonly (TextureIndex | null)[]; // max length: MAX_COMBINED_TEXTURE_IMAGE_UNITS

    readonly FRAME_BUFFER: FrameBufferIndex | null;
    readonly DRAW_BUFFERS: readonly (ColorAttachment | null)[]; // max length: MAX_DRAW_BUFFERS
}

type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];
type FlagKeys = FilteredKeys<StateParams, boolean>;

// https://github.com/regl-project/regl
export function setState(context: RendererContext, params: StateParams) {
    const { gl } = context;

    // TODO: Implement sync with context previous state and update state

    function syncFlag(cap: FlagKeys) {
        const enable = params[cap];
        if (enable) {
            gl.enable(gl[cap]);
        } else {
            gl.disable(gl[cap]);
        }
        return enable;
    }

    function sync<T extends readonly (keyof StateParams)[]>(setter: (this: WebGLRenderingContext, ...values: any) => void, ...keys: T) {
        for (const key of keys) {
            const values = keys.map(key => params[key]);
            (<Function>setter).apply(gl, values);
        }
    }

    syncFlag("BLEND");
    sync((rgba: readonly [number, number, number, number]) => { gl.blendColor(...rgba); }, "BLEND_COLOR");
    sync(gl.blendEquationSeparate, "BLEND_EQUATION_RGB", "BLEND_EQUATION_ALPHA");
    sync(gl.blendFuncSeparate, "BLEND_SRC_RGB", "BLEND_DST_RGB", "BLEND_SRC_ALPHA", "BLEND_DST_ALPHA");

    syncFlag("CULL_FACE");
    sync(gl.cullFace, "CULL_FACE_MODE");
    sync(gl.frontFace, "FRONT_FACE");

    syncFlag("DEPTH_TEST");
    sync(gl.depthFunc, "DEPTH_FUNC");
    sync(gl.depthMask, "DEPTH_WRITEMASK");
    sync((range: readonly [number, number]) => gl.depthRange(...range), "DEPTH_RANGE");

    syncFlag("DITHER");

    syncFlag("POLYGON_OFFSET_FILL");
    sync(gl.polygonOffset, "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_UNITS");

    syncFlag("SAMPLE_ALPHA_TO_COVERAGE");
    syncFlag("SAMPLE_COVERAGE");
    sync(gl.sampleCoverage, "SAMPLE_COVERAGE_VALUE", "SAMPLE_COVERAGE_INVERT");

    syncFlag("STENCIL_TEST");
    sync((func, ref, mask) => gl.stencilFuncSeparate(gl.FRONT, func, ref, mask), "STENCIL_FUNC", "STENCIL_REF", "STENCIL_VALUE_MASK");
    sync((func, ref, mask) => gl.stencilFuncSeparate(gl.BACK, func, ref, mask), "STENCIL_BACK_FUNC", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK");

    sync((box: readonly [x: number, y: number, width: number, height: number]) => gl.viewport(...box), "VIEWPORT");

    syncFlag("SCISSOR_TEST");
    sync((box: readonly [x: number, y: number, width: number, height: number]) => gl.scissor(...box), "SCISSOR_BOX");

    syncFlag("RASTERIZER_DISCARD");

    // TODO: Implement arrays and remaining state
}