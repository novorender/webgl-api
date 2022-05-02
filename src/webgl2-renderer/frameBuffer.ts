import type { RendererContext } from "./renderer";
import type { TextureImageTargetString, TextureIndex } from "./texture";

export type FrameBufferIndex = number;

export interface TextureAttachment {
    readonly texture: TextureIndex;
    readonly target?: TextureImageTargetString; // default: TEXTURE_2D
    readonly level?: number; // default: 0, mip-map level
    readonly layer?: number; // default: 0, face in cube map, z in 3d and index in 2d array
}

export interface FrameBufferParams {
    readonly depthTexture?: TextureAttachment;
    readonly stencilTexture?: TextureAttachment;
    readonly colorTextures: readonly (TextureAttachment | null)[]; // length: [0, MAX_COLOR_ATTACHMENTS>
}

export function createFrameBuffer(context: RendererContext, params: FrameBufferParams): WebGLFramebuffer {
    const { gl, textures, limits } = context;
    const frameBuffer = gl.createFramebuffer();
    if (!frameBuffer)
        throw new Error("Could not create frame buffer!");
    console.assert(params.colorTextures.length < limits.MAX_COLOR_ATTACHMENTS);
    // const level = 0;
    function bind(binding: TextureAttachment) {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl[binding.target ?? "TEXTURE_2D"], textures[binding.texture], binding.level ?? 0, binding.layer ?? 0);
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl[binding.target ?? "TEXTURE_2D"], textures[binding.texture], level);
    }
    if (params.depthTexture)
        bind(params.depthTexture);
    if (params.stencilTexture)
        bind(params.stencilTexture);
    const colorAttachment0 = gl.COLOR_ATTACHMENT0;
    for (const colorTexture of params.colorTextures) {
        if (colorTexture) {
            bind(colorTexture);
        }
    }
    return frameBuffer;
}