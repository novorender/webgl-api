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
import { createTimer, Timer } from "./timer.js";
import { createAllocators } from "./allocator.js";
import { readPixels, ReadPixelsParams } from "./read.js";
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

async function sleep(time: number) {
    return new Promise(resolve => {
        self.setTimeout(resolve, time);
    });
}

export type BlobIndex = number;

export class WebGL2Renderer {
    readonly #context; // we dont want anything GL specific to leak outside
    readonly #timers: Timer[] = [];
    readonly allocators = createAllocators();

    constructor(gl: WebGL2RenderingContext) {
        this.#context = createContext(gl);
    }

    dispose() {
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
    }

    // resetState() {
    //     const { gl, limits } = this.#context;
    //     const { MAX_TEXTURE_IMAGE_UNITS, MAX_UNIFORM_BUFFER_BINDINGS } = limits;

    //     gl.useProgram(null);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    //     gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //     gl.bindVertexArray(null);
    //     // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    //     gl.drawBuffers([]);

    //     for (let i = 0; i < MAX_TEXTURE_IMAGE_UNITS; i++) {
    //         gl.activeTexture(gl.TEXTURE0 + i);
    //         gl.bindTexture(gl.TEXTURE_2D, null);
    //         gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    //     }
    //     gl.activeTexture(gl.TEXTURE0);

    //     for (let i = 0; i < MAX_UNIFORM_BUFFER_BINDINGS; i++) {
    //         gl.bindBufferBase(gl.UNIFORM_BUFFER, i, null);
    //     }
    // }

    get width() {
        return this.#context.gl.drawingBufferWidth;
    }

    get height() {
        return this.#context.gl.drawingBufferHeight;
    }

    get measurements() {
        const timers = this.#timers;
        const measurements: number[] = [];
        for (let i = 0; i < timers.length; i++) {
            const timer = timers[i];
            const measurement = timer.getMeasurement();
            if (typeof measurement == "number") {
                timers.splice(i--, 1);
                measurements.push(measurement);
            } else if (measurement) {
                // measurement timed out
                timers.splice(i--, 1);
            }
        }
        return measurements;
    }

    commit() {
        // on webGL, this is (still) a bit of a no-op, but on angle it could be the swapBuffers() function, or in open gl, the glutSwapBuffers() function.
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/commit
        this.#context.gl.flush();
    }

    measureBegin() {
        const timer = createTimer(this.#context.gl);
        this.#timers.push(timer);
        timer.begin();
    }

    measureEnd() {
        const timers = this.#timers;
        console.assert(timers.length > 0);
        const timer = timers[timers.length - 1];
        timer.end();
    }

    createBlob(index: BlobIndex, blob: ArrayBuffer) {
        const { blobs } = this.#context;
        blobs[index] = blob;
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

    readPixels(params: ReadPixelsParams) {
        const pixels = readPixels(this.#context, params);
        throw pixels;
    }

    copy() {
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