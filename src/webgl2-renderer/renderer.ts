import { GL } from "/glEnum";
import { createProgram, ProgramIndex, ProgramParams } from "./program";
import { createBuffer, BufferIndex, BufferParams } from "./buffer";
import { createVertexArray, VertexArrayIndex, VertexArrayParams } from "./vao";
import { createSampler, SamplerIndex, SamplerParams } from "./sampler";
import { createTexture, TextureIndex, TextureParams } from "./texture";
import { createFrameBuffer, FrameBufferIndex, FrameBufferParams } from "./frameBuffer";
import { clear, ClearParams } from "./clear";
import { createContext } from "./context";
export type { RendererContext } from "./context";

export type BlobIndex = number;

export class WebGL2Renderer {
    readonly #context; // we dont want anything GL specific to leak outside

    constructor(gl: WebGL2RenderingContext) {
        this.#context = createContext(gl);
    }

    addBlob(blob: ArrayBufferView): BlobIndex {
        console.assert(ArrayBuffer.isView(blob));
        const { blobs } = this.#context;
        const index = blobs.length;
        blobs.push(blob);
        return index;
    }

    deleteBlob(blobIndex: BlobIndex) {
        // we can disable this when recording
        const { blobs } = this.#context;
        blobs[blobIndex] = null;
    }

    createProgram(index: ProgramIndex, params: ProgramParams) {
        const { programs } = this.#context;
        programs[index] = createProgram(this.#context, params);
    }

    createBuffer(index: BufferIndex, params: BufferParams) {
        const { buffers } = this.#context;
        buffers[index] = createBuffer(this.#context, params);
    }

    createVertexArray(index: VertexArrayIndex, params: VertexArrayParams) {
        const { vertexArrays } = this.#context;
        vertexArrays[index] = createVertexArray(this.#context, params);
    }

    createSampler(index: SamplerIndex, params: SamplerParams) {
        const { samplers } = this.#context;
        samplers[index] = createSampler(this.#context, params);
    }

    createTexture(index: TextureIndex, params: TextureParams) {
        const { textures } = this.#context;
        textures[index] = createTexture(this.#context, params);
    }

    createFrameBuffer(index: FrameBufferIndex, params: FrameBufferParams) {
        const { frameBuffers } = this.#context;
        frameBuffers[index] = createFrameBuffer(this.#context, params);
    }

    deleteProgram(index: ProgramIndex) {
        const { gl, programs } = this.#context;
        gl.deleteProgram(programs[index]);
        programs[index] = null;
    }

    deleteBuffer(index: BufferIndex) {
        const { gl, buffers } = this.#context;
        gl.deleteBuffer(buffers[index]);
        buffers[index] = null;
    }

    deleteVertexArray(index: VertexArrayIndex) {
        const { gl, vertexArrays } = this.#context;
        gl.deleteVertexArray(vertexArrays[index]);
        vertexArrays[index] = null;
    }

    deleteSampler(index: SamplerIndex) {
        const { gl, samplers } = this.#context;
        gl.deleteSampler(samplers[index]);
        samplers[index] = null;
    }

    deleteTexture(index: TextureIndex) {
        const { gl, textures } = this.#context;
        gl.deleteTexture(textures[index]);
        textures[index] = null;
    }

    deleteFrameBuffer(index: FrameBufferIndex) {
        const { gl, frameBuffers } = this.#context;
        gl.deleteFramebuffer(frameBuffers[index]);
        frameBuffers[index] = null;
    }

    clear(params: ClearParams) {
        clear(this.#context, params);
    }

    blit() {
    }

    copy() {
    }

    draw() {
    }
}