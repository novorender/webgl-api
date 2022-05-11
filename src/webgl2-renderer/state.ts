import type { LimitsGL } from "./context.js";
import type { FrameBufferIndex } from "./frameBuffer.js";
import type { ProgramIndex } from "./program.js";
import type { RendererContext } from "./renderer.js";
import type { TextureIndex } from "./texture.js";
import type { VertexArrayIndex } from "./vao.js";
import type { BufferIndex } from "./buffer.js";
import type { SamplerIndex } from "./sampler.js";

export type BlendEquation = "FUNC_ADD" | "FUNC_SUBTRACT" | "FUNC_REVERSE_SUBTRACT" | "MIN" | "MAX";
export type BlendFunction = "ZERO" | "ONE" | "SRC_COLOR" | "ONE_MINUS_SRC_COLOR" | "DST_COLOR" | "ONE_MINUS_DST_COLOR" | "SRC_ALPHA" | "ONE_MINUS_SRC_ALPHA" | "DST_ALPHA" | "ONE_MINUS_DST_ALPHA" | "CONSTANT_COLOR" | "ONE_MINUS_CONSTANT_COLOR" | "CONSTANT_ALPHA" | "ONE_MINUS_CONSTANT_ALPHA" | "SRC_ALPHA_SATURATE";
export type CullMode = "FRONT" | "BACK" | "FRONT_AND_BACK";
export type DepthFunc = "NEVER" | "LESS" | "EQUAL" | "LEQUAL" | "GREATER" | "NOTEQUAL" | "GEQUAL" | "ALWAYS";
export type Winding = "CW" | "CCW";
export type ColorAttachment = `COLOR_ATTACHMENT${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;
export type RGBA = readonly [r: number, g: number, b: number, a: number];
export type XYZW = readonly [x: number, y: number, z: number, w: number];
type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];

export interface Rect {
    readonly x?: number;
    readonly y?: number;
    readonly width: number;
    readonly height: number;
}

export interface AttributeDefault {
    readonly type: "4f" | "I4i" | "I4ui";
    readonly values: XYZW;
}

export interface AttributeBinding {
    readonly type: "4f" | "I4i" | "I4ui";
    readonly values: XYZW;
}


type UniformTypeVector =
    "1f" | "2f" | "3f" | "4f" |
    "1i" | "2i" | "3i" | "4i" |
    "1ui" | "2ui" | "3ui" | "4ui";

type UniformTypeMatrix =
    "Matrix2f" | "Matrix3f" | "Matrix4f" |
    "Matrix2x3f" | "Matrix2x4f" |
    "Matrix3x2f" | "Matrix3x4f" |
    "Matrix4x2f" | "Matrix4x3f";

type UniformType = UniformTypeVector | UniformTypeMatrix;

export interface UniformBinding {
    readonly type: UniformType;
    readonly name: string;
    readonly value: readonly number[];
}

export interface TextureBinding {
    target: "TEXTURE_2D" | "TEXTURE_3D" | "TEXTURE_2D_ARRAY" | "TEXTURE_CUBE_MAP";
    index: TextureIndex;
}

export type State = ReturnType<typeof createDefaultState>;
export type StateParams = Partial<State>;

// https://github.com/regl-project/regl

function isUniformTypeMatrix(type: UniformType): type is UniformTypeMatrix {
    return type.startsWith("Matrix");
}

const defaultConstants = {
    blendEnable: false, // BLEND
    blendColor: [0, 0, 0, 0] as RGBA, // BLEND_COLOR
    blendDstAlpha: "ZERO" as BlendFunction, // BLEND_DST_ALPHA
    blendDstRGB: "ZERO" as BlendFunction, // BLEND_DST_RGB
    blendEquationAlpha: "FUNC_ADD" as BlendEquation, // BLEND_EQUATION_ALPHA
    blendEquationRGB: "FUNC_ADD" as BlendEquation, // BLEND_EQUATION_RGB
    blendSrcAlpha: "ONE" as BlendFunction, // BLEND_EQUATION_ALPHA
    blendSrcRGB: "ONE" as BlendFunction, // BLEND_SRC_RGB

    cullEnable: false, // CULL_FACE
    cullMode: "BACK" as CullMode, // CULL_FACE_MODE
    cullFrontFace: "CCW" as Winding, // FRONT_FACE

    depthTest: false, // DEPTH_TEST
    depthFunc: "LESS" as DepthFunc, // DEPTH_FUNC
    depthWriteMask: true, // DEPTH_WRITEMASK
    depthRange: [0, 1] as [near: number, far: number], // DEPTH_RANGE

    ditherEnable: true, // DITHER

    polygonOffsetFill: false, // POLYGON_OFFSET_FILL
    polygonOffsetFactor: 0, // POLYGON_OFFSET_FACTOR
    polygonOffsetUnits: 0, // POLYGON_OFFSET_UNITS

    sampleAlphaToCoverage: false, // SAMPLE_ALPHA_TO_COVERAGE
    sampleCoverage: false, // SAMPLE_COVERAGE
    sampleCoverageValue: 1, // SAMPLE_COVERAGE_VALUE
    sampleCoverageInvert: false, // SAMPLE_COVERAGE_INVERT

    stencilTest: false, // STENCIL_TEST
    stencilFunc: "ALWAYS" as DepthFunc, // STENCIL_FUNC
    stencilValueMask: 0x7FFFFFFF, // STENCIL_VALUE_MASK
    stencilRef: 0, // STENCIL_REF
    stencilBackFunc: "ALWAYS" as DepthFunc, // STENCIL_BACK_FUNC
    stencilBackValueMask: 0x7FFFFFFF, // STENCIL_BACK_VALUE_MASK
    stencilBackRef: 0, // STENCIL_BACK_REF
    viewport: { // VIEWPORT
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    } as Rect,

    scissorTest: false, // SCISSOR_TEST
    scissorBox: { // SCISSOR_BOX
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    } as Rect,

    rasterizerDiscard: false, // RASTERIZER_DISCARD

    // arrayBuffer: null as BufferIndex | null, // ARRAY_BUFFER
    // elementArrayBuffer: null as BufferIndex | null, // ELEMENT_ARRAY_BUFFER
    frameBuffer: null as FrameBufferIndex | null,
    vertexArrayObject: null as VertexArrayIndex | null,

    program: null as ProgramIndex | null,
    uniforms: null as readonly UniformBinding[] | null,
};

export function createDefaultState(limits: LimitsGL) {
    return {
        ...defaultConstants,
        drawBuffers: ["BACK"] as ReadonlyArray<ColorAttachment | "BACK" | "NONE">,
        attributeDefaults: Array<AttributeDefault | null>(limits.MAX_VERTEX_ATTRIBS).fill({ type: "4f", values: [0, 0, 0, 1] }) as ReadonlyArray<AttributeDefault | null>,
        uniformBuffers: Array<BufferIndex | null>(limits.MAX_VERTEX_ATTRIBS).fill(null) as ReadonlyArray<BufferIndex | null>,
        textures: Array<TextureBinding | null>(limits.MAX_COMBINED_TEXTURE_IMAGE_UNITS).fill(null) as ReadonlyArray<TextureBinding | null>,
        samplers: Array<SamplerIndex | null>(limits.MAX_COMBINED_TEXTURE_IMAGE_UNITS).fill(null) as ReadonlyArray<SamplerIndex | null>,
    } as const;
}

export function setState(context: RendererContext, params: StateParams) {
    const { gl } = context;

    function setFlag(cap: FilteredKeys<WebGL2RenderingContext, number>, key: keyof StateParams) {
        const value = params[key];
        if (value !== undefined) {
            if (value) {
                gl.enable(gl[cap]);
            } else {
                gl.disable(gl[cap]);
            }
        }
    }

    function set(setter: (this: WebGLRenderingContext, ...values: any) => void, ...keys: readonly (keyof typeof defaultConstants)[]) {
        if (keys.some(key => params[key] !== undefined)) {
            const values = keys.map(key => {
                const v = params[key] ?? defaultConstants[key];
                return typeof v == "string" ? gl[v as keyof WebGL2RenderingContext] : v;
            });
            (<Function>setter).apply(gl, values);
        }
    }

    setFlag("BLEND", "blendEnable");
    set((rgba: readonly [number, number, number, number]) => { gl.blendColor(...rgba); }, "blendColor");
    set(gl.blendEquationSeparate, "blendEquationRGB", "blendEquationAlpha");
    set(gl.blendFuncSeparate, "blendSrcRGB", "blendDstRGB", "blendSrcAlpha", "blendDstAlpha");

    setFlag("CULL_FACE", "cullEnable");
    set(gl.cullFace, "cullMode");
    set(gl.frontFace, "cullFrontFace");

    setFlag("DEPTH_TEST", "depthTest");
    set(gl.depthFunc, "depthFunc");
    set(gl.depthMask, "depthWriteMask");
    set((range: readonly [number, number]) => gl.depthRange(...range), "depthRange");

    setFlag("DITHER", "ditherEnable");

    setFlag("POLYGON_OFFSET_FILL", "polygonOffsetFill");
    set(gl.polygonOffset, "polygonOffsetFactor", "polygonOffsetUnits");

    setFlag("SAMPLE_ALPHA_TO_COVERAGE", "sampleAlphaToCoverage");
    setFlag("SAMPLE_COVERAGE", "sampleCoverage");
    set(gl.sampleCoverage, "sampleCoverageValue", "sampleCoverageInvert");

    setFlag("STENCIL_TEST", "stencilTest");
    set((func, ref, mask) => gl.stencilFuncSeparate(gl.FRONT, func, ref, mask), "stencilFunc", "stencilRef", "stencilValueMask");
    set((func, ref, mask) => gl.stencilFuncSeparate(gl.BACK, func, ref, mask), "stencilBackFunc", "stencilBackRef", "stencilBackValueMask");

    set(rect => gl.viewport(rect.x ?? 0, rect.y ?? 0, rect.width, rect.height), "viewport");

    setFlag("SCISSOR_TEST", "scissorTest");
    set(rect => gl.scissor(rect.x ?? 0, rect.y ?? 0, rect.width, rect.height), "scissorBox");

    setFlag("RASTERIZER_DISCARD", "rasterizerDiscard");

    const { /*arrayBuffer, elementArrayBuffer,*/ frameBuffer, vertexArrayObject, drawBuffers, attributeDefaults, uniformBuffers, textures, uniforms, samplers } = params;

    // if (arrayBuffer !== undefined) {
    //     const buffer = arrayBuffer == null ? null : context.buffers[arrayBuffer];
    //     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // }

    // if (elementArrayBuffer !== undefined) {
    //     const buffer = elementArrayBuffer == null ? null : context.buffers[elementArrayBuffer];
    //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    // }

    if (vertexArrayObject !== undefined) {
        const vao = vertexArrayObject == null ? null : context.vertexArrays[vertexArrayObject];
        gl.bindVertexArray(vao);
    }

    if (frameBuffer !== undefined) {
        const buffer = frameBuffer == null ? null : context.framebuffers[frameBuffer];
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    }

    if (drawBuffers) {
        gl.drawBuffers(drawBuffers.map(b => gl[b]));
    }

    if (attributeDefaults) {
        for (let i = 0; i < attributeDefaults.length; i++) {
            const defaults = attributeDefaults[i];
            if (defaults) {
                const { type, values } = defaults;
                gl[`vertexAttrib${type}v`](i, values);
            }
        }
    }
    if (uniformBuffers) {
        for (let i = 0; i < uniformBuffers.length; i++) {
            const index = uniformBuffers[i];
            const buffer = index == null ? null : context.buffers[index];
            gl.bindBufferBase(gl.UNIFORM_BUFFER, i, buffer);
        }
    }
    if (textures) {
        const texture0 = gl.TEXTURE0;
        for (let i = 0; i < textures.length; i++) {
            const tex = textures[i];
            const texture = tex == null ? null : context.textures[tex.index];
            gl.activeTexture(texture0 + i);
            gl.bindTexture(gl[tex?.target ?? "TEXTURE_2D"], texture);
        }
        gl.activeTexture(texture0);
    }

    if (samplers) {
        for (let i = 0; i < samplers.length; i++) {
            const index = samplers[i];
            const sampler = index == null ? null : context.samplers[index];
            gl.bindSampler(i, sampler);
        }
    }

    const program = params.program == null ? null : context.programs[params.program];
    if (params.program !== undefined) {
        gl.useProgram(program);
    }

    if (uniforms && program) {
        for (const { type, name, value } of uniforms) {
            const location = gl.getUniformLocation(program, name); // TODO: cache this?
            const n = `uniform${type}v` as const;
            if (isUniformTypeMatrix(type)) {
                gl[`uniform${type}v`](location, false, value);
            } else {
                gl[`uniform${type}v`](location, value);
            }
        }
    }
}
