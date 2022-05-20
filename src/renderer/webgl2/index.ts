import type { BlobIndex, BlobParams, BlitParams, BufferIndex, BufferParams, ClearParams, CopyParams, DrawParams, FrameBufferIndex, FrameBufferParams, ProgramIndex, ProgramParams, ReadPixelsParams, RenderBufferIndex, RenderBufferParams, Renderer, SamplerIndex, SamplerParams, StateParams, TextureIndex, TextureParams, VertexArrayIndex, VertexArrayParams, Pixels, InvalidateFrameBufferParams } from "..";
import { createContext, RendererContext } from "./context.js";
import { createAllocators } from "../allocator.js";
import { createTimer, Timer } from "./timer.js";
import { getBufferData } from "../binary.js";
import { blit } from "./blit.js";
import { createProgram } from "./program.js";
import { createBuffer } from "./buffer.js";
import { createVertexArray } from "./vao.js";
import { createSampler } from "./sampler.js";
import { createTexture } from "./texture.js";
import { createRenderBuffer } from "./renderBuffer.js";
import { createFrameBuffer, invalidateFrameBuffer } from "./frameBuffer.js";
import { clear } from "./clear.js";
import { copy } from "./copy.js";
import { draw } from "./draw.js";
import { setState } from "./state.js";
import { readPixelsAsync } from "./read.js";
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

export class WebGL2Renderer implements Renderer {
    readonly #context; // we dont want anything GL specific to leak outside
    readonly #promises: PolledPromise[] = [];
    #timer: Timer | undefined;
    #animFrameHandle: number | undefined;
    readonly version = "0.0.1";
    readonly allocators = createAllocators();

    constructor(gl: WebGL2RenderingContext) {
        this.#context = createContext(gl);
    }

    dispose() {
        if (this.#animFrameHandle !== undefined) {
            cancelAnimationFrame(this.#animFrameHandle);
            this.#animFrameHandle = undefined;
        }
        this.state(this.#context.defaultState); // make sure resources are unbound before deleting them.
        // this.resetState(); 
        const { gl } = this.#context;
        const ctx = this.#context;
        const arrays = ["program", "buffer", "vertexArray", "sampler", "texture", "renderbuffer", "framebuffer"] as const;
        type TA = typeof arrays[number];
        function deleteArray(name: TA) {
            const array = ctx[`${name}s`];
            for (const item of array) {
                const nameCapitalized = name[0].toUpperCase() + name.substring(1) as Capitalize<TA>;
                gl[`delete${nameCapitalized}`](item);
            }
            array.length = 0;
        }
        for (let ar of arrays) {
            deleteArray(ar);
        }
        for (const promise of this.#promises) {
            promise.dispose();
        }
    }

    get width() {
        return this.#context.gl.drawingBufferWidth;
    }

    get height() {
        return this.#context.gl.drawingBufferHeight;
    }

    pollPromises() {
        const promises = this.#promises;
        for (let i = 0; i < promises.length; i++) {
            const promise = promises[i];
            if (promise.poll()) {
                promises.splice(i--, 1);
            }
        }
        return promises.length > 0;
    }

    flush() {
        this.#context.gl.flush();
    }

    async nextFrame() {
        const promise = new Promise<number>(resolve => {
            this.#animFrameHandle = requestAnimationFrame(time => {
                this.#animFrameHandle = undefined;
                resolve(time);
            })
        });
        const time = await promise;
        this.pollPromises();
        return time;
    }

    measureBegin() {
        const timer = createTimer(this.#context.gl);
        this.#timer = timer;
        timer.begin();
    }

    measureEnd(): Promise<number> {
        const timer = this.#timer!;
        timer.end();
        this.#timer = undefined;
        this.#promises.push(timer);
        return timer.promise;
    }

    createBlob(index: BlobIndex, params: BlobParams) {
        const { blobs } = this.#context;
        blobs[index] = getBufferData(params.data);
        return index;
    }

    deleteBlob(index: BlobIndex) {
        const { blobs } = this.#context;
        blobs[index] = null;
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
        const { renderbuffers } = this.#context;
        renderbuffers[index] = createRenderBuffer(this.#context, params);
        return index;
    }

    deleteRenderBuffer(index: RenderBufferIndex) {
        const { gl, renderbuffers } = this.#context;
        gl.deleteRenderbuffer(renderbuffers[index]);
        renderbuffers[index] = null;
    }

    createFrameBuffer(index: FrameBufferIndex, params: FrameBufferParams) {
        const { framebuffers } = this.#context;
        framebuffers[index] = createFrameBuffer(this.#context, params);
        return index;
    }

    invalidateFrameBuffer(params: InvalidateFrameBufferParams) {
        invalidateFrameBuffer(this.#context, params);
    }

    deleteFrameBuffer(index: FrameBufferIndex) {
        const { gl, framebuffers } = this.#context;
        gl.deleteFramebuffer(framebuffers[index]);
        framebuffers[index] = null;
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

    readPixels(params: ReadPixelsParams): Promise<Pixels> {
        const result = readPixelsAsync(this.#context, params);
        this.#promises.push(result);
        return result.promise;
    }

    copy(params: CopyParams) {
        copy(this.#context, params);
    }

    draw(params: DrawParams) {
        draw(this.#context, params);
    }

    checkStatus(message: string = "GL") {
        const { gl } = this.#context;
        const status = gl.getError();
        switch (status) {
            case gl.NO_ERROR: break;
            case gl.INVALID_ENUM:
                throw `${message}: Invalid enum!`;
            case gl.INVALID_VALUE:
                throw `${message}: Invalid value!`;
            case gl.INVALID_OPERATION:
                throw `${message}: Invalid operation!`;
            case gl.INVALID_FRAMEBUFFER_OPERATION:
                throw `${message}: Invalid framebuffer operation!`;
            case gl.OUT_OF_MEMORY:
                throw `${message}: Out of memory!`;
            case gl.CONTEXT_LOST_WEBGL:
                throw `${message}: Context lost!`;
            default:
                throw `${message}: Unknown status!`;
        }
    }
}

export interface PolledPromise<T = any> {
    promise: Promise<T>;
    poll(): boolean;
    dispose(): void;
};

async function nextFrame(): Promise<number> {
    return new Promise<number>(resolve => {
        const handle = requestAnimationFrame(time => {
            resolve(time);
        })
    });
}

async function sleep(time: number) {
    return new Promise(resolve => {
        self.setTimeout(resolve, time);
    });
}

