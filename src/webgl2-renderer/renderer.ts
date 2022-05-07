import type { Renderer } from ".";
import { createContext, RendererContext } from "./context.js";
import { createProgram, ProgramIndex, ProgramParams } from "./program.js";
import { createBuffer, BufferIndex, BufferParams } from "./buffer.js";
import { createVertexArray, VertexArrayIndex, VertexArrayParams } from "./vao.js";
import { createSampler, SamplerIndex, SamplerParams } from "./sampler.js";
import { createTexture, TextureIndex, TextureParams } from "./texture.js";
import { createRenderBuffer, RenderBufferIndex, RenderBufferParams } from "./renderBuffer.js";
import { createFrameBuffer, FrameBufferIndex, FrameBufferParams } from "./frameBuffer.js";
import { clear, ClearParams } from "./clear.js";
import { setState, StateParams } from "./state.js";
import { draw, DrawParams } from "./draw.js";
import { blit, BlitParams } from "./blit.js";
export type { RendererContext };

export function createWebGL2Renderer(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): Renderer {
    const gl = canvas.getContext("webgl2", options);
    if (!gl)
        throw new Error("Unable to create WebGL 2 context!");

    canvas.addEventListener("webglcontextlost", function (event) {
        // event.preventDefault();
        // TODO: Handle!
        console.error("WebGL Context lost");
    }, false);

    canvas.addEventListener(
        "webglcontextrestored", function (event) {
            // event.preventDefault();
            // TODO: Handle!
            console.info("WebGL Context restored");
        }, false);

    return new WebGL2Renderer(gl);
}

export class WebGL2Renderer {
    readonly #context; // we dont want anything GL specific to leak outside

    constructor(gl: WebGL2RenderingContext) {
        this.#context = createContext(gl);
    }

    dispose() {
        // TODO: #implement
    }

    get width() {
        return this.#context.gl.drawingBufferWidth;
    }

    get height() {
        return this.#context.gl.drawingBufferHeight;
    }

    createProgram(index: ProgramIndex, params: ProgramParams) {
        const { programs } = this.#context;
        programs[index] = createProgram(this.#context, params);
        return index;
    }

    deleteProgram(index: ProgramIndex) {
        const { gl, programs } = this.#context;
        gl.deleteProgram(programs[index]);
        programs[index] = null;
        return index;
    }

    createBuffer(index: BufferIndex, params: BufferParams) {
        const { buffers } = this.#context;
        buffers[index] = createBuffer(this.#context, params);
        return index;
    }

    deleteBuffer(index: BufferIndex) {
        const { gl, buffers } = this.#context;
        gl.deleteBuffer(buffers[index]);
        buffers[index] = null;
    }

    createVertexArray(index: VertexArrayIndex, params: VertexArrayParams) {
        const { vertexArrays } = this.#context;
        vertexArrays[index] = createVertexArray(this.#context, params);
        return index;
    }

    deleteVertexArray(index: VertexArrayIndex) {
        const { gl, vertexArrays } = this.#context;
        gl.deleteVertexArray(vertexArrays[index]);
        vertexArrays[index] = null;
    }

    createSampler(index: SamplerIndex, params: SamplerParams) {
        const { samplers } = this.#context;
        samplers[index] = createSampler(this.#context, params);
        return index;
    }

    deleteSampler(index: SamplerIndex) {
        const { gl, samplers } = this.#context;
        gl.deleteSampler(samplers[index]);
        samplers[index] = null;
    }

    createTexture(index: TextureIndex, params: TextureParams) {
        const { textures } = this.#context;
        textures[index] = createTexture(this.#context, params);
        return index;
    }

    deleteTexture(index: TextureIndex) {
        const { gl, textures } = this.#context;
        gl.deleteTexture(textures[index]);
        textures[index] = null;
    }

    createRenderBuffer(index: RenderBufferIndex, params: RenderBufferParams) {
        const { renderBuffers } = this.#context;
        renderBuffers[index] = createRenderBuffer(this.#context, params);
        return index;
    }

    deleteRenderBuffer(index: RenderBufferIndex) {
        const { gl, renderBuffers } = this.#context;
        gl.deleteRenderbuffer(renderBuffers[index]);
        renderBuffers[index] = null;
    }

    createFrameBuffer(index: FrameBufferIndex, params: FrameBufferParams) {
        const { frameBuffers } = this.#context;
        frameBuffers[index] = createFrameBuffer(this.#context, params);
        return index;
    }

    deleteFrameBuffer(index: FrameBufferIndex) {
        const { gl, frameBuffers } = this.#context;
        gl.deleteFramebuffer(frameBuffers[index]);
        frameBuffers[index] = null;
    }

    state(params: StateParams) {
        setState(this.#context, params);
    }

    clear(params: ClearParams) {
        clear(this.#context, params);
    }

    blit(params: BlitParams) {
        blit(this.#context, params);
    }

    copy() {
    }

    draw(params: DrawParams) {
        draw(this.#context, params);
    }
}