import { GL } from "./glEnum";
import type { RenderState } from "./state";
import type { CompressedTextureFormatString, TexelTypeString, TextureImageTarget, UncompressedTextureFormatString } from "./types";
import { isFormatCompressed, isPowerOf2 } from "./util";


export function createTextureResource(gl: WebGL2RenderingContext, textureParams: RenderState.TextureResource, blobs: readonly ArrayBuffer[]) {
    const texture = gl.createTexture();
    if (texture) {
        const target = gl[textureParams.target];
        const { width, height } = textureParams;
        const depth = "depth" in textureParams ? textureParams.depth : undefined;
        const border = 0;
        gl.bindTexture(target, texture);
        const typeString = "type" in textureParams ? textureParams.type : undefined;
        const { internalFormat, format, type, arrayType } = getFormatInfo(gl, textureParams.internalFormat, typeString);

        function createImage(imgTarget: TextureImageTarget, imageRef: RenderState.BlobRef, level: number, sizeX: number, sizeY: number, sizeZ = 0) {
            const blobIndex = 0;
            const blob = blobs[blobIndex];
            const byteLength = imageRef.byteLength ?? blob.byteLength;
            const pixels = new arrayType(blobs[blobIndex], imageRef.byteOffset, byteLength / arrayType.BYTES_PER_ELEMENT);
            if (type) {
                if (sizeZ) {
                    gl.texImage3D(target, level, internalFormat, sizeX, sizeY, sizeZ, border, format as number, type, pixels);
                } else {
                    gl.texImage2D(imgTarget, level, internalFormat, sizeX, sizeY, border, format as number, type, pixels);
                }
            } else {
                if (sizeZ) {
                    gl.compressedTexImage3D(target, level, internalFormat, sizeX, sizeY, sizeZ, border, pixels);
                } else {
                    gl.compressedTexImage2D(target, level, internalFormat, sizeX, sizeY, border, pixels);
                }
            }
        }

        function createMipLevel(level: number, imageRef: RenderState.BlobRef | readonly RenderState.BlobRef[]) {
            function isArray(img: typeof imageRef): img is readonly RenderState.BlobRef[] {
                return Array.isArray(img);
            }
            const n = 1 << level;
            if (isArray(imageRef)) {
                console.assert(target == GL.TEXTURE_CUBE_MAP);
                const cubeImages = imageRef[level];
                if (cubeImages) {
                    let side = GL.TEXTURE_CUBE_MAP_POSITIVE_X;
                    for (let img of imageRef) {
                        createImage(side++, img, level, width / n, height / n);
                    }
                }
            } else if (imageRef) {
                if (depth) {
                    if (target == GL.TEXTURE_3D) {
                        createImage(GL.TEXTURE_3D, imageRef, level, width / n, height / n, depth / n);
                    }
                    else {
                        console.assert(target == GL.TEXTURE_2D_ARRAY);
                        createImage(GL.TEXTURE_3D, imageRef, level, width / n, height / n, depth);
                    }
                } else {
                    console.assert(target == GL.TEXTURE_2D);
                    createImage(GL.TEXTURE_2D, imageRef, level, width, height);
                }
            }
        }

        if ("mipMaps" in textureParams) {
            // mip mapped
            const { mipMaps } = textureParams;
            for (let level = 0; level < mipMaps.length; level++) {
                const mipMap = mipMaps[level];
                if (mipMap) {
                    createMipLevel(level, mipMap);
                }
            }
        } else {
            createMipLevel(0, textureParams.image);
            if ("generateMipMaps" in textureParams) {
                if (textureParams.generateMipMaps) {
                    if (isPowerOf2(width) && isPowerOf2(height) && type) {
                        gl.generateMipmap(target);
                    } else {
                        throw new Error(`Cannot generate mip maps on a texture of non-power of two sizes (${width}, ${height})!`);
                    }
                }
            }
        }
        gl.bindTexture(target, null);
    }
    return texture;
}

function getFormatInfo(gl: WebGL2RenderingContext, internalFormatString: UncompressedTextureFormatString | CompressedTextureFormatString, typeString?: Exclude<TexelTypeString, "FLOAT_32_UNSIGNED_INT_24_8_REV">) {
    if (isFormatCompressed(internalFormatString)) {
        const internalFormat = compressedFormats[internalFormatString];
        const format = undefined;
        const type = undefined;
        const arrayType = Uint8Array;
        return { internalFormat, format, type, arrayType };
    } else {
        // uncompressed
        const internalFormat = gl[internalFormatString] as keyof typeof internalFormat2FormatLookup;
        const format = internalFormat2FormatLookup[internalFormat];
        console.assert(format);
        const type = gl[typeString!];
        const arrayType = getBufferViewType(type);
        return { internalFormat, format, type, arrayType };
    }
}

export function getBufferViewType(type: number) {
    switch (type) {
        case GL.BYTE:
            return Int8Array;
        case GL.UNSIGNED_BYTE:
            return Uint8Array;
        case GL.SHORT:
            return Int16Array;
        case GL.UNSIGNED_SHORT_5_6_5:
        case GL.UNSIGNED_SHORT_4_4_4_4:
        case GL.UNSIGNED_SHORT_5_5_5_1:
        case GL.HALF_FLOAT:
        case GL.HALF_FLOAT_OES:
            return Uint16Array;
        case GL.UNSIGNED_INT:
        case GL.UNSIGNED_INT_24_8_WEBGL:
        case GL.UNSIGNED_INT_5_9_9_9_REV:
        case GL.UNSIGNED_INT_2_10_10_10_REV:
        case GL.UNSIGNED_INT_10F_11F_11F_REV:
            return Uint32Array;
        case GL.INT:
            return Int32Array;
        case GL.FLOAT:
            return Float32Array;
        // case GL.FLOAT_32_UNSIGNED_INT_24_8_REV:
        //     return null;
    }
    throw new Error(`Unknown buffer type: ${type}!`);
}

// https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
const internalFormat2FormatLookup = {
    [GL.RGB]: GL.RGB, // UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5
    [GL.RGBA]: GL.RGBA, // UNSIGNED_BYTE, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1
    [GL.LUMINANCE_ALPHA]: GL.LUMINANCE_ALPHA, // UNSIGNED_BYTE
    [GL.LUMINANCE]: GL.LUMINANCE, // UNSIGNED_BYTE
    [GL.ALPHA]: GL.ALPHA, // UNSIGNED_BYTE
    [GL.R8]: GL.RED, // UNSIGNED_BYTE
    [GL.R16F]: GL.RED, // HALF_FLOAT, GL.FLOAT
    [GL.R32F]: GL.RED, // FLOAT
    [GL.R8UI]: GL.RED_INTEGER, // UNSIGNED_BYTE
    [GL.RG8]: GL.RG, // UNSIGNED_BYTE
    [GL.RG16F]: GL.RG, // HALF_FLOAT, GL.FLOAT
    [GL.RG32F]: GL.RG, // FLOAT
    [GL.RG8UI]: GL.RG_INTEGER, // UNSIGNED_BYTE
    [GL.RGB8]: GL.RGB, // UNSIGNED_BYTE
    [GL.SRGB8]: GL.RGB, // UNSIGNED_BYTE
    [GL.RGB565]: GL.RGB, // UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5
    [GL.R11F_G11F_B10F]: GL.RGB, // UNSIGNED_INT_10F_11F_11F_REV, HALF_FLOAT, FLOAT
    [GL.RGB9_E5]: GL.RGB, // HALF_FLOAT, FLOAT
    [GL.RGB16F]: GL.RGB, // HALF_FLOAT, FLOAT
    [GL.RGB32F]: GL.RGB, // FLOAT
    [GL.RGB8UI]: GL.RGB_INTEGER, // UNSIGNED_BYTE
    [GL.RGBA8]: GL.RGBA, // UNSIGNED_BYTE
    [GL.SRGB8_ALPHA8]: GL.RGBA, // UNSIGNED_BYTE
    [GL.RGB5_A1]: GL.RGBA, // UNSIGNED_BYTE, UNSIGNED_SHORT_5_5_5_1
    [GL.RGB10_A2]: GL.RGBA, // UNSIGNED_INT_2_10_10_10_REV
    [GL.RGBA4]: GL.RGBA, // UNSIGNED_BYTE, UNSIGNED_SHORT_4_4_4_4
    [GL.RGBA16F]: GL.RGBA, // HALF_FLOAT, FLOAT
    [GL.RGBA32F]: GL.RGBA, // FLOAT
    [GL.RGBA8UI]: GL.RGBA_INTEGER, // UNSIGNED_BYTE
} as const;

// we could read these from extensions instead...
const compressedFormats = {
    // WEBGL_compressed_texture_s3tc
    COMPRESSED_RGB_S3TC_DXT1_EXT: GL.COMPRESSED_RGB_S3TC_DXT1_EXT,
    COMPRESSED_RGBA_S3TC_DXT1_EXT: GL.COMPRESSED_RGBA_S3TC_DXT1_EXT,
    COMPRESSED_RGBA_S3TC_DXT3_EXT: GL.COMPRESSED_RGBA_S3TC_DXT3_EXT,
    COMPRESSED_RGBA_S3TC_DXT5_EXT: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT,
    // WEBGL_compressed_texture_s3tc_srgb
    COMPRESSED_SRGB_S3TC_DXT1_EXT: GL.COMPRESSED_SRGB_S3TC_DXT1_EXT,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
    // WEBGL_compressed_texture_etc
    COMPRESSED_R11_EAC: GL.COMPRESSED_R11_EAC,
    COMPRESSED_SIGNED_R11_EAC: GL.COMPRESSED_SIGNED_R11_EAC,
    COMPRESSED_RG11_EAC: GL.COMPRESSED_RG11_EAC,
    COMPRESSED_SIGNED_RG11_EAC: GL.COMPRESSED_SIGNED_RG11_EAC,
    COMPRESSED_RGB8_ETC2: GL.COMPRESSED_RGB8_ETC2,
    COMPRESSED_RGBA8_ETC2_EAC: GL.COMPRESSED_RGBA8_ETC2_EAC,
    COMPRESSED_SRGB8_ETC2: GL.COMPRESSED_SRGB8_ETC2,
    COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
    COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
    COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
    // WEBGL_compressed_texture_pvrtc
    COMPRESSED_RGB_PVRTC_4BPPV1_IMG: GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
    COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
    COMPRESSED_RGB_PVRTC_2BPPV1_IMG: GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
    COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
    // WEBGL_compressed_texture_etc1    
    COMPRESSED_RGB_ETC1_WEBGL: GL.COMPRESSED_RGB_ETC1_WEBGL,
    // WEBGL_compressed_texture_astc    
    COMPRESSED_RGBA_ASTC_4x4_KHR: GL.COMPRESSED_RGBA_ASTC_4x4_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
    COMPRESSED_RGBA_ASTC_5x4_KHR: GL.COMPRESSED_RGBA_ASTC_5x4_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
    COMPRESSED_RGBA_ASTC_5x5_KHR: GL.COMPRESSED_RGBA_ASTC_5x5_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
    COMPRESSED_RGBA_ASTC_6x5_KHR: GL.COMPRESSED_RGBA_ASTC_6x5_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
    COMPRESSED_RGBA_ASTC_6x6_KHR: GL.COMPRESSED_RGBA_ASTC_6x6_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
    COMPRESSED_RGBA_ASTC_8x5_KHR: GL.COMPRESSED_RGBA_ASTC_8x5_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
    COMPRESSED_RGBA_ASTC_8x6_KHR: GL.COMPRESSED_RGBA_ASTC_8x6_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
    COMPRESSED_RGBA_ASTC_8x8_KHR: GL.COMPRESSED_RGBA_ASTC_8x8_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
    COMPRESSED_RGBA_ASTC_10x5_KHR: GL.COMPRESSED_RGBA_ASTC_10x5_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
    COMPRESSED_RGBA_ASTC_10x6_KHR: GL.COMPRESSED_RGBA_ASTC_10x6_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
    COMPRESSED_RGBA_ASTC_10x10_KHR: GL.COMPRESSED_RGBA_ASTC_10x10_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
    COMPRESSED_RGBA_ASTC_12x10_KHR: GL.COMPRESSED_RGBA_ASTC_12x10_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
    COMPRESSED_RGBA_ASTC_12x12_KHR: GL.COMPRESSED_RGBA_ASTC_12x12_KHR,
    COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR,
    // EXT_texture_compression_bptc    
    COMPRESSED_RGBA_BPTC_UNORM_EXT: GL.COMPRESSED_RGBA_BPTC_UNORM_EXT,
    COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT: GL.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,
    COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT: GL.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
    COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT: GL.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
    // EXT_texture_compression_rgtc    
    COMPRESSED_RED_RGTC1_EXT: GL.COMPRESSED_RED_RGTC1_EXT,
    COMPRESSED_SIGNED_RED_RGTC1_EXT: GL.COMPRESSED_SIGNED_RED_RGTC1_EXT,
    COMPRESSED_RED_GREEN_RGTC2_EXT: GL.COMPRESSED_RED_GREEN_RGTC2_EXT,
    COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT: GL.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
} as const;
