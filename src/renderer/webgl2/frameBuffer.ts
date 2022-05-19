import type { FrameBufferBinding, FrameBufferParams, FrameBufferTextureBinding } from "..";
import type { RendererContext } from ".";

function isTextureAttachment(attachment: FrameBufferBinding): attachment is FrameBufferTextureBinding {
    return typeof attachment == "object" && "texture" in attachment;
}

export function createFrameBuffer(context: RendererContext, params: FrameBufferParams): WebGLFramebuffer {
    const { gl, textures, renderbuffers, limits } = context;

    const frameBuffer = gl.createFramebuffer();
    if (!frameBuffer)
        throw new Error("Could not create frame buffer!");
    console.assert(params.color.length <= limits.MAX_COLOR_ATTACHMENTS);

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    function bind(binding: FrameBufferBinding, attachment: number) {
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