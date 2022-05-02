type TextureIndex = number;
type SamplerIndex = number;


type FixedSizeArray<N extends number, T> = N extends 0
    ? never[]
    : {
        0: T;
        length: N;
    } & ReadonlyArray<T>;

export type BlendFunction = "ZERO" | "ONE" | "SRC_COLOR" | "ONE_MINUS_SRC_COLOR" | "DST_COLOR" | "ONE_MINUS_DST_COLOR" | "SRC_ALPHA" | "ONE_MINUS_SRC_ALPHA" | "DST_ALPHA" | "ONE_MINUS_DST_ALPHA" | "CONSTANT_COLOR" | "ONE_MINUS_CONSTANT_COLOR" | "CONSTANT_ALPHA" | "ONE_MINUS_CONSTANT_ALPHA" | "SRC_ALPHA_SATURATE";
export type BlendEquation = "FUNC_ADD" | "FUNC_SUBTRACT" | "FUNC_REVERSE_SUBTRACT"; // | "MIN_EXT" | "MAX_EXT";
export type CullMode = "FRONT" | "BACK" | "FRONT_AND_BACK";
export type DepthFunc = "NEVER" | "LESS" | "EQUAL" | "LEQUAL" | "GREATER" | "NOTEQUAL" | "GEQUAL" | "ALWAYS";
export type Winding = "CW" | "CCW";
export type ColorAttachment = `COLOR_ATTACHMENT${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;
export type DrawBufferType = "NONE" | "BACK" | ColorAttachment;

interface GLState {
    readonly BLEND: boolean; // false
    readonly BLEND_COLOR: readonly [number, number, number, number]; // new Float32Array([0,0,0,0) (r,g,b,a);
    readonly BLEND_DST_ALPHA: BlendFunction; // ZERO
    readonly BLEND_DST_RGB: BlendFunction; // ZERO 
    readonly BLEND_EQUATION_ALPHA: BlendEquation; // FUNC_ADD
    readonly BLEND_EQUATION_RGB: BlendEquation; // FUNC_ADD
    readonly BLEND_SRC_ALPHA: BlendFunction; // ONE
    readonly BLEND_SRC_RGB: BlendFunction; // ONE

    readonly CULL_FACE: boolean; // false
    readonly CULL_FACE_MODE: CullMode; // BACK
    readonly FRONT_FACE: Winding; // CCW

    readonly DEPTH_TEST: boolean; // false
    readonly DEPTH_FUNC: DepthFunc; // LESS
    readonly DEPTH_WRITEMASK: boolean; // true
    readonly DEPTH_RANGE: readonly [number, number]; // new Float32Array([0, 1) (near, far)

    readonly DITHER: boolean; // true

    readonly POLYGON_OFFSET_FILL: boolean; // false
    readonly POLYGON_OFFSET_FACTOR: number; // 0
    readonly POLYGON_OFFSET_UNITS: number; // 0

    readonly SAMPLE_ALPHA_TO_COVERAGE: boolean; // false
    readonly SAMPLE_COVERAGE: boolean; // false
    readonly SAMPLE_COVERAGE_VALUE: number; // 1.0
    readonly SAMPLE_COVERAGE_INVERT: boolean; // false

    readonly STENCIL_TEST: boolean; // false
    readonly STENCIL_FUNC: DepthFunc; // ALWAYS
    readonly STENCIL_VALUE_MASK: number; // 0x7FFFFFFF
    readonly STENCIL_REF: number; // 0
    readonly STENCIL_BACK_FUNC: DepthFunc; // ALWAYS
    readonly STENCIL_BACK_VALUE_MASK: number; // 0x7FFFFFFF,
    readonly STENCIL_BACK_REF: number; // 0
}

interface TextureSlotState {
    readonly textureResource: TextureIndex | null;
    readonly samplerResource: SamplerIndex | null;
}

// interface FrameBufferSlotState {
//     readonly frameBufferResource: Index | null;
// }

interface State {
    state: Partial<GLState>;
    textures: readonly TextureSlotState[];
    drawBuffers: readonly DrawBufferType[]; // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawBuffers
    uniformBuffers: readonly (number | null)[]; // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferBase
}
