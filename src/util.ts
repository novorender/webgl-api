import { GL } from "./glEnum";

export function exhaustiveCheck(value: never) {
    throw new Error(`Unknown kind: ${value}!`);
}

export function createGLContext(canvas: HTMLCanvasElement) {
    // TODO: Add options (for creating context)
    const options: WebGLContextAttributes = {
        alpha: true,
        antialias: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        desynchronized: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        stencil: false
    };
    const gl = canvas.getContext("webgl2", options);
    return gl;
}


export type IndexBufferType = GL.UNSIGNED_BYTE | GL.UNSIGNED_SHORT | GL.UNSIGNED_INT;
export type AttributeType = GL.BYTE | GL.UNSIGNED_BYTE | GL.SHORT | GL.UNSIGNED_SHORT | GL.FLOAT | GL.HALF_FLOAT;

export interface AttributeParams {
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    readonly numComponents: 1 | 2 | 3 | 4;
    readonly componentType?: GL.BYTE | GL.UNSIGNED_BYTE | GL.SHORT | GL.UNSIGNED_SHORT | GL.FLOAT | GL.HALF_FLOAT; // default: FLOAT
    readonly normalized?: boolean; // default: false
    readonly stride?: number; // default: 0
    readonly offset?: number; // default: 0
    readonly buffer?: number; // default 0
}

export interface VertexBufferParams {
    readonly data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView;
    readonly usage?: GL.STATIC_DRAW | GL.DYNAMIC_DRAW | GL.STREAM_DRAW | GL.STATIC_READ | GL.DYNAMIC_READ | GL.STREAM_READ | GL.STATIC_COPY | GL.DYNAMIC_COPY | GL.STREAM_COPY; // default: STATIC_DRAW
}

export interface VertexAttributeParams {
    readonly buffers: readonly VertexBufferParams[];
    readonly attributes: { readonly [name: string]: AttributeParams };
}

export class VertexArrayObject {
    constructor(
        private readonly gl: WebGL2RenderingContext,
        readonly array: WebGLVertexArrayObject,
        private readonly buffers: WebGLBuffer[],
    ) {
    }

    dispose(): void {
        const { gl, buffers } = this;
        gl.deleteVertexArray(this.array);
        for (const buffer of buffers) {
            gl.deleteBuffer(buffer);
        }
    }
}

export function createVertexArrayBuffer(gl: WebGL2RenderingContext, program: WebGLProgram, params: VertexAttributeParams): VertexArrayObject {
    const buffers = params.buffers.map(bufferParams => {
        const buf = gl.createBuffer()!;
        gl.bindBuffer(GL.ARRAY_BUFFER, buf);
        gl.bufferData(GL.ARRAY_BUFFER, bufferParams.data, bufferParams.usage ?? GL.STATIC_DRAW);
        gl.bindBuffer(GL.ARRAY_BUFFER, null);
        return buf;
    });
    console.assert(buffers.length > 0);

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    for (const [attribName, attribParams] of Object.entries(params.attributes)) {
        const attribIndex = gl.getAttribLocation(program, attribName);
        gl.bindBuffer(GL.ARRAY_BUFFER, buffers[attribParams.buffer ?? 0]);
        gl.vertexAttribPointer(attribIndex, attribParams.numComponents, attribParams.componentType ?? GL.FLOAT, attribParams.normalized ?? false, attribParams.stride ?? 0, attribParams.offset ?? 0);
        gl.enableVertexAttribArray(attribIndex);
    };
    gl.bindBuffer(GL.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    return new VertexArrayObject(gl, vao, buffers);
}

export type UniformType =
    GL.FLOAT | GL.FLOAT_VEC2 | GL.FLOAT_VEC3 | GL.FLOAT_VEC4 |
    GL.INT | GL.INT_VEC2 | GL.INT_VEC3 | GL.INT_VEC4 |
    GL.UNSIGNED_INT | GL.UNSIGNED_INT_VEC2 | GL.UNSIGNED_INT_VEC3 | GL.UNSIGNED_INT_VEC4 |
    GL.BOOL | GL.BOOL_VEC2 | GL.BOOL_VEC3 | GL.BOOL_VEC4 |
    GL.FLOAT_MAT2 | GL.FLOAT_MAT3 | GL.FLOAT_MAT4 |
    GL.FLOAT_MAT2x3 | GL.FLOAT_MAT2x4 | GL.FLOAT_MAT3x2 | GL.FLOAT_MAT3x4 | GL.FLOAT_MAT4x2 | GL.FLOAT_MAT4x3 |
    GL.SAMPLER_2D | GL.SAMPLER_2D_ARRAY | GL.SAMPLER_2D_ARRAY_SHADOW | GL.SAMPLER_2D_ARRAY_SHADOW | GL.SAMPLER_3D | GL.SAMPLER_CUBE | GL.SAMPLER_CUBE_SHADOW;


export interface UniformInfo {
    readonly name: string;
    readonly type: UniformType
    readonly size: number; // num elements
    readonly blockIndex: number; // -1 if not in block
    readonly offset: number; // -1 if not in block
}

export function getUniformsInfo(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const numUniforms = gl.getProgramParameter(program, GL.ACTIVE_UNIFORMS);
    const uniformData: any[] = [];
    const uniformIndices: number[] = [];

    for (let i = 0; i < numUniforms; ++i) {
        uniformIndices.push(i);
        uniformData.push({});
        const uniformInfo = gl.getActiveUniform(program, i)!;
        uniformData[i].name = uniformInfo.name;
    }

    function getInfo(pname: number, key: string) {
        gl.getActiveUniforms(program, uniformIndices, pname).forEach(function (value: string, idx: number) {
            uniformData[idx][key] = value;
        });
    }
    getInfo(GL.UNIFORM_TYPE, "type");
    getInfo(GL.UNIFORM_SIZE, "size");
    getInfo(GL.UNIFORM_BLOCK_INDEX, "blockIndex");
    getInfo(GL.UNIFORM_OFFSET, "offset");
    return uniformData as readonly UniformInfo[];
}

function getUniformBlockInfo(gl: WebGL2RenderingContext, program: WebGLProgram, blockIndex: number) {
    // const name = gl.getActiveUniformBlockName(program, ii)!;
    // const index = gl.getUniformBlockIndex(program, name) as number;
    const usedByVertexShader = gl.getActiveUniformBlockParameter(program, blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER) as boolean;
    const usedByFragmentShader = gl.getActiveUniformBlockParameter(program, blockIndex, GL.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER) as boolean;
    const size = gl.getActiveUniformBlockParameter(program, blockIndex, GL.UNIFORM_BLOCK_DATA_SIZE) as number;
    const uniformIndices = gl.getActiveUniformBlockParameter(program, blockIndex, GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES) as Uint32Array;
    const used = usedByVertexShader || usedByFragmentShader;
    return { blockIndex, usedByVertexShader, usedByFragmentShader, size, uniformIndices, used } as const;
}

export interface UniformParams {
    readonly [name: string]: boolean | number | readonly number[];
}

export interface UniformBlock {
    readonly buffer: WebGLBuffer;
    readonly blockIndex: number;
    set(uniforms: UniformParams): void;
    dispose(): void;
}

export function createUniformBlockBuffer(gl: WebGL2RenderingContext, program: WebGLProgram, blockName: string, uniformInfos: readonly UniformInfo[]) {
    const blockIndex = gl.getUniformBlockIndex(program, blockName);
    console.assert(blockIndex >= 0);
    const blockInfo = getUniformBlockInfo(gl, program, blockIndex);
    gl.uniformBlockBinding(program, blockIndex, blockIndex);

    const data = new ArrayBuffer(blockInfo.size);
    const f32 = new Float32Array(data);
    const buffer = gl.createBuffer()!;
    const blockUniforms = uniformInfos.filter(u => u.blockIndex == blockIndex);

    function set(uniforms: UniformParams) {
        for (const uniformInfo of blockUniforms) {
            const uniformValue = uniforms[uniformInfo.name];
            if (uniformValue !== undefined) {
                switch (uniformInfo.type) {
                    case GL.FLOAT_VEC2:
                    case GL.FLOAT_VEC3:
                    case GL.FLOAT_VEC4:
                    case GL.FLOAT_MAT2:
                    case GL.FLOAT_MAT3:
                    case GL.FLOAT_MAT4:
                        f32.set(uniformValue as number[], uniformInfo.offset / f32.BYTES_PER_ELEMENT);
                        break;
                    default:
                        throw new Error("Unsupported uniform type!");
                }
            }
        }
        gl.bindBuffer(GL.UNIFORM_BUFFER, buffer);
        gl.bufferData(GL.UNIFORM_BUFFER, data, GL.DYNAMIC_DRAW);
        gl.bindBuffer(GL.UNIFORM_BUFFER, null);
    }

    return {
        buffer,
        blockIndex,
        set,
        dispose: () => {
            gl.deleteBuffer(buffer);
        }
    } as UniformBlock;
}

// code adapted from https://github.com/sindresorhus/strip-json-comments
export function stripJsonComments(jsonString: string) {
    const singleComment = Symbol('singleComment');
    const multiComment = Symbol('multiComment');
    let isInsideString = false;
    let isInsideComment: typeof singleComment | typeof multiComment | false = false;
    let offset = 0;
    let result = '';

    function isEscaped(jsonString: string, quotePosition: number) {
        let index = quotePosition - 1;
        let backslashCount = 0;

        while (jsonString[index] === '\\') {
            index -= 1;
            backslashCount += 1;
        }

        return Boolean(backslashCount % 2);
    };

    for (let index = 0; index < jsonString.length; index++) {
        const currentCharacter = jsonString[index];
        const nextCharacter = jsonString[index + 1];

        if (!isInsideComment && currentCharacter === '"') {
            const escaped = isEscaped(jsonString, index);
            if (!escaped) {
                isInsideString = !isInsideString;
            }
        }

        if (isInsideString) {
            continue;
        }

        if (!isInsideComment && currentCharacter + nextCharacter === '//') {
            result += jsonString.slice(offset, index);
            offset = index;
            isInsideComment = singleComment;
            index++;
        } else if (isInsideComment === singleComment && currentCharacter + nextCharacter === '\r\n') {
            index++;
            isInsideComment = false;
            offset = index;
            continue;
        } else if (isInsideComment === singleComment && currentCharacter === '\n') {
            isInsideComment = false;
            offset = index;
        } else if (!isInsideComment && currentCharacter + nextCharacter === '/*') {
            result += jsonString.slice(offset, index);
            offset = index;
            isInsideComment = multiComment;
            index++;
            continue;
        } else if (isInsideComment === multiComment && currentCharacter + nextCharacter === '*/') {
            index++;
            isInsideComment = false;
            offset = index + 1;
            continue;
        }
    }

    return result + (isInsideComment ? '' : jsonString.slice(offset));
}