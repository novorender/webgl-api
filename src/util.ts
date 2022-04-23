import { GL } from "./glEnum";
import type { Mat4 } from "./types";

export function exhaustiveCheck(value: never) {
    throw new Error(`Unknown kind: ${value}!`);
}

export function getProjectionMatrix(fov: number, aspect: number, minZ: number, maxZ: number): Mat4 {
    const halfAngleTan = Math.tan((fov * .5) * Math.PI / 180);
    return [
        0.5 / halfAngleTan, 0, 0, 0,
        0, 0.5 * aspect / halfAngleTan, 0, 0,
        0, 0, -(maxZ + minZ) / (maxZ - minZ), -1,
        0, 0, (-2 * maxZ * minZ) / (maxZ - minZ), 0
    ];
}

export function rotateX(m: number[], angle: number) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1] * c - m[2] * s;
    m[5] = m[5] * c - m[6] * s;
    m[9] = m[9] * c - m[10] * s;

    m[2] = m[2] * c + mv1 * s;
    m[6] = m[6] * c + mv5 * s;
    m[10] = m[10] * c + mv9 * s;
}

export function rotateY(m: number[], angle: number) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c * m[0] + s * m[2];
    m[4] = c * m[4] + s * m[6];
    m[8] = c * m[8] + s * m[10];

    m[2] = c * m[2] - s * mv0;
    m[6] = c * m[6] - s * mv4;
    m[10] = c * m[10] - s * mv8;
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
    readonly index: number; // shader attribute location index
    readonly buffer: WebGLBuffer;
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    readonly numComponents: 1 | 2 | 3 | 4;
    readonly componentType?: GL.BYTE | GL.UNSIGNED_BYTE | GL.SHORT | GL.UNSIGNED_SHORT | GL.FLOAT | GL.HALF_FLOAT; // default: FLOAT
    readonly normalized?: boolean; // default: false
    readonly stride?: number; // default: 0
    readonly offset?: number; // default: 0
}

export function createVertexArrayBuffer(gl: WebGL2RenderingContext, attributes: readonly AttributeParams[]): WebGLVertexArrayObject {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    for (const attribParams of attributes) {
        const attribIndex = attribParams.index;
        gl.bindBuffer(GL.ARRAY_BUFFER, attribParams.buffer);
        gl.vertexAttribPointer(attribIndex, attribParams.numComponents, attribParams.componentType ?? GL.FLOAT, attribParams.normalized ?? false, attribParams.stride ?? 0, attribParams.offset ?? 0);
        gl.enableVertexAttribArray(attribIndex);
    };
    gl.bindBuffer(GL.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    return vao;
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

export type BufferTarget = GL.ARRAY_BUFFER | GL.ELEMENT_ARRAY_BUFFER | GL.COPY_READ_BUFFER | GL.COPY_WRITE_BUFFER | GL.TRANSFORM_FEEDBACK_BUFFER | GL.UNIFORM_BUFFER | GL.PIXEL_PACK_BUFFER | GL.PIXEL_UNPACK_BUFFER;
export type BufferUsage = GL.STATIC_DRAW | GL.DYNAMIC_DRAW | GL.STREAM_DRAW | GL.STATIC_READ | GL.DYNAMIC_READ | GL.STREAM_READ | GL.STATIC_COPY | GL.DYNAMIC_COPY | GL.STREAM_COPY;
export type PrimitiveType = GL.POINTS | GL.LINE_STRIP | GL.LINE_LOOP | GL.LINES | GL.TRIANGLE_STRIP | GL.TRIANGLE_FAN | GL.TRIANGLES;

export function createBuffer(gl: WebGL2RenderingContext, target: BufferTarget, byteSize: number, usage: BufferUsage): WebGLBuffer;
export function createBuffer(gl: WebGL2RenderingContext, target: BufferTarget, srcData: BufferSource, usage: BufferUsage): WebGLBuffer;
export function createBuffer(gl: WebGL2RenderingContext, target: BufferTarget, sizeOrData: number | BufferSource, usage: BufferUsage) {
    const buffer = gl.createBuffer();
    if (!buffer) {
        throw new Error("Unable to create buffer!");
    }
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, sizeOrData as any, GL.DYNAMIC_DRAW);
    gl.bindBuffer(target, null);
    return buffer;
}

export function createUniformBlockBuffer(gl: WebGL2RenderingContext, program: WebGLProgram, blockName: string, uniformInfos: readonly UniformInfo[]) {
    const blockIndex = gl.getUniformBlockIndex(program, blockName);
    const blockUniforms = uniformInfos.filter(u => u.blockIndex == blockIndex);
    console.assert(blockIndex >= 0);
    const blockInfo = getUniformBlockInfo(gl, program, blockIndex);
    gl.uniformBlockBinding(program, blockIndex, blockIndex);

    const buffer = createBuffer(gl, GL.UNIFORM_BUFFER, blockInfo.size, GL.DYNAMIC_DRAW);
    const data = new ArrayBuffer(blockInfo.size);
    const f32 = new Float32Array(data);

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
        gl.bufferSubData(GL.UNIFORM_BUFFER, 0, data);
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


type ShaderType = "VERTEX_SHADER" | "FRAGMENT_SHADER";

function compileShader(gl: WebGLRenderingContext, type: ShaderType, source: string): WebGLShader {
    const shader = gl.createShader(gl[type]);
    if (!shader) throw new Error("WebGL Shader could not be created.");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        const typeName = type.split("_")[0].toLocaleLowerCase();
        const errorMsg = gl.getShaderInfoLog(shader);
        throw new Error(`: Failed to compile glsl ${typeName} shader!\r\n${errorMsg}`);
    }

    return shader;
}

export function createShaderProgram(gl: WebGLRenderingContext, shaders: { readonly vertex: string; readonly fragment: string; }, attributeBindings?: { readonly [key: string]: number }): WebGLProgram {
    const vertexShader = compileShader(gl, "VERTEX_SHADER", shaders.vertex);
    const fragmentShader = compileShader(gl, "FRAGMENT_SHADER", shaders.fragment);
    const program = gl.createProgram();
    if (!program)
        throw new Error("Could not create WebGL shader program!");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    if (attributeBindings) {
        // do optional dynamic remapping of attributes before linking
        // this can also be done in glsl by explicit layout(location = ?)
        for (const [name, index] of Object.entries(attributeBindings)) {
            gl.bindAttribLocation(program, index, name);
        }
    }

    // TODO: Consider doing linking in a separate stage, so as to take advantage of parallel shader compilation. (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#Compile_Shaders_and_Link_Programs_in_parallel)
    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, GL.LINK_STATUS))
        throw new Error(`: Failed to compile link shaders!\r\n${gl.getProgramInfoLog(program)}`);

    return program;
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