import type { State } from "..";
import { createDefaultState } from "./state.js";

export interface RendererContext extends ReadonlyContextArray {
    readonly gl: WebGL2RenderingContext;
    readonly limits: LimitsGL;
    readonly extensions: {
        readonly multiDraw: WebGLMultiDrawExt;
    }
    readonly defaultState: State;
    currentProgram: WebGLProgram | null; // we cache this here to avoid possible pipeline flush/stall when reading current state.
};

export interface WebGLMultiDrawExt {
    multiDrawArraysWEBGL(mode: number,
        firstsList: Int32Array, firstsOffset: number,
        countsList: Int32Array, countsOffset: number,
        drawCount: number): void;
}

export function createContext(gl: WebGL2RenderingContext) {
    const limits = getLimits(gl);
    const defaultState = createDefaultState(limits);
    const extensions = {
        multiDraw: gl.getExtension("WEBGL_MULTI_DRAW") as WebGLMultiDrawExt,
        // multiDraw: undefined as unknown as WebGLMultiDrawExt,
    } as const;
    return { gl, extensions, limits, defaultState, currentProgram: null, ...contextArrays() } as const;
}

function contextArrays() {
    return {
        blobs: [] as (ArrayBuffer | null)[],
        programs: [] as (WebGLProgram | null)[],
        buffers: [] as (WebGLBuffer | null)[],
        vertexArrays: [] as (WebGLVertexArrayObject | null)[],
        samplers: [] as (WebGLSampler | null)[],
        textures: [] as (WebGLTexture | null)[],
        renderbuffers: [] as (WebGLRenderbuffer | null)[],
        framebuffers: [] as (WebGLFramebuffer | null)[],
    } as const;
}

type ContextArrays = ReturnType<typeof contextArrays>;
type ReadonlyContextArray = { [P in keyof ContextArrays]: readonly ContextArrays[P][0][] };

function getLimits(gl: WebGL2RenderingContext) {
    const names = [
        "MAX_TEXTURE_SIZE",
        "MAX_VIEWPORT_DIMS",
        "MAX_TEXTURE_IMAGE_UNITS",
        "MAX_VERTEX_UNIFORM_VECTORS",
        "MAX_VARYING_VECTORS",
        "MAX_VERTEX_ATTRIBS",
        "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
        "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
        "MAX_TEXTURE_IMAGE_UNITS",
        "MAX_FRAGMENT_UNIFORM_VECTORS",
        "MAX_CUBE_MAP_TEXTURE_SIZE",
        "MAX_RENDERBUFFER_SIZE",
        "MAX_3D_TEXTURE_SIZE",
        "MAX_ELEMENTS_VERTICES",
        "MAX_ELEMENTS_INDICES",
        "MAX_TEXTURE_LOD_BIAS",
        "MAX_FRAGMENT_UNIFORM_COMPONENTS",
        "MAX_VERTEX_UNIFORM_COMPONENTS",
        "MAX_ARRAY_TEXTURE_LAYERS",
        "MIN_PROGRAM_TEXEL_OFFSET",
        "MAX_PROGRAM_TEXEL_OFFSET",
        "MAX_VARYING_COMPONENTS",
        "MAX_VERTEX_OUTPUT_COMPONENTS",
        "MAX_FRAGMENT_INPUT_COMPONENTS",
        "MAX_SERVER_WAIT_TIMEOUT",
        "MAX_ELEMENT_INDEX",
        "MAX_DRAW_BUFFERS",
        "MAX_COLOR_ATTACHMENTS",
        "MAX_SAMPLES",
        "MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS",
        "MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS",
        "MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS",
        "MAX_VERTEX_UNIFORM_BLOCKS",
        "MAX_FRAGMENT_UNIFORM_BLOCKS",
        "MAX_COMBINED_UNIFORM_BLOCKS",
        "MAX_UNIFORM_BUFFER_BINDINGS",
        "MAX_UNIFORM_BLOCK_SIZE",
        "MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS",
        "MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS",
    ] as const;

    type Limits = { [P in typeof names[number]]: number };
    const limits = {} as Limits;
    for (const name of names) {
        limits[name] = gl.getParameter(gl[name]) as number;
    }
    return limits as Readonly<Limits>;
}
export type LimitsGL = ReturnType<typeof getLimits>;

