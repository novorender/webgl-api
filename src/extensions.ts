export function getExtensions(gl: WebGL2RenderingContext) {
    const requiredExtensions = {
        EXT_color_buffer_float: gl.getExtension("EXT_color_buffer_float")!, // also includes half floats
        WEBGL_multi_draw: gl.getExtension('WEBGL_multi_draw')!,
        // OES_texture_float_linear: gl.getExtension("OES_texture_float_linear")!,
        // EXT_color_buffer_half_float: gl.getExtension("EXT_color_buffer_half_float")!,
    } as const;
    // validate
    for (let ext in requiredExtensions) {
        if (!Reflect.get(requiredExtensions, ext)) {
            throw new Error(`WebGL ${ext} extension not supported!`);
        }
    }
    const optionalExtensions = {
        OES_texture_half_float_linear: gl.getExtension("OES_texture_half_float_linear"), // this is now webgl 2.0 core and no longer available as an extension. we still request it for older browsers (e.g. mac/safari experimental webgl2 support).
        // EXT_color_buffer_float: gl.getExtension("EXT_color_buffer_float"),
        WEBGL_compressed_texture_astc: gl.getExtension("WEBGL_compressed_texture_astc"),
        WEBGL_compressed_texture_atc: gl.getExtension("WEBGL_compressed_texture_atc"),
        WEBGL_compressed_texture_etc: gl.getExtension("WEBGL_compressed_texture_etc"),
        WEBGL_compressed_texture_pvrtc: gl.getExtension("WEBGL_compressed_texture_pvrtc"),
        WEBGL_compressed_texture_s3tc: gl.getExtension("WEBGL_compressed_texture_s3tc"),
        WEBGL_compressed_texture_s3tc_srgb: gl.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
    };
    return {
        glVersion: 2,
        ...requiredExtensions,
        ...optionalExtensions
    } as const;
}
