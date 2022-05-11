import { RenderBufferIndex } from "./renderBuffer.js";
import type { RendererContext } from "./renderer.js";
import type { TextureImageTargetString, TextureIndex } from "./texture.js";

export type FrameBufferIndex = number;

export interface TextureBinding {
    readonly texture: TextureIndex;
    readonly target?: "TEXTURE_2D";
    readonly level?: number; // default: 0, mip-map level
    readonly layer?: number; // default: 0, face in cube map, z in 3d and index in 2d array
}

export interface RenderBufferBinding {
    readonly renderBuffer: RenderBufferIndex;
}

export type Binding = TextureBinding | RenderBufferBinding;

export interface FrameBufferParams {
    readonly depth?: Binding;
    readonly stencil?: Binding;
    readonly color: readonly (Binding | null)[]; // length: [0, MAX_COLOR_ATTACHMENTS>
}

function isTextureAttachment(attachment: Binding): attachment is TextureBinding {
    return typeof attachment == "object" && "texture" in attachment;
}

export function createFrameBuffer(context: RendererContext, params: FrameBufferParams): WebGLFramebuffer {
    const { gl, textures, renderbuffers, limits } = context;

    const frameBuffer = gl.createFramebuffer();
    if (!frameBuffer)
        throw new Error("Could not create frame buffer!");
    console.assert(params.color.length <= limits.MAX_COLOR_ATTACHMENTS);

    // var texture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // gl.bindTexture(gl.TEXTURE_2D, null);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    // const level = 0;
    function bind(binding: Binding, attachment: number) {
        if (isTextureAttachment(binding)) {
            const texture = textures[binding.texture];
            console.assert(texture);
            if (binding.layer === undefined) {
                const target = gl[binding.target ?? "TEXTURE_2D"];
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, target, texture, binding.level ?? 0);
            } else {
                gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachment, texture, binding.level ?? 0, binding.layer);
            }
        } else {
            const renderBuffer = renderbuffers[binding.renderBuffer];
            console.assert(renderBuffer);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, renderBuffer);
        }
    }
    if (params.depth)
        bind(params.depth, gl.DEPTH_ATTACHMENT);
    if (params.stencil)
        bind(params.stencil, gl.STENCIL_ATTACHMENT);
    let i = gl.COLOR_ATTACHMENT0;
    for (const color of params.color) {
        if (color) {
            bind(color, i);
        }
        i++;
    }
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    switch (status) {
        case gl.FRAMEBUFFER_COMPLETE:
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            throw new Error("Framebuffer incomplete attachment!");
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            throw new Error("Framebuffer missing attachment!")
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            throw new Error("Framebuffer incomplete dimensions!")
        case gl.FRAMEBUFFER_UNSUPPORTED:
            throw new Error("Framebuffer unsupported!")
        case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
            throw new Error("Framebuffer incomplete multisample!")
        default:
            throw new Error("Unknown framebuffer error!")
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return frameBuffer;
}