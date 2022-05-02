import type { BlobIndex, RendererContext } from "./renderer";
import { GL } from "/glEnum";

export type TextureIndex = number;

export type TextureParams =
    TextureParams2DUncompressed | TextureParams2DCompressed | TextureParams2DUncompressedMipMapped | TextureParams2DCompressedMipMapped |
    TextureParamsCubeUncompressed | TextureParamsCubeCompressed | TextureParamsCubeUncompressedMipMapped | TextureParamsCubeCompressedMipMapped |
    TextureParams3DUncompressed | TextureParams3DCompressed | TextureParams3DUncompressedMipMapped | TextureParams3DCompressedMipMapped |
    TextureParams2DArrayUncompressed | TextureParams2DArrayCompressed | TextureParams2DArrayUncompressedMipMapped | TextureParams2DArrayCompressedMipMapped;

export function createTexture(context: RendererContext, params: TextureParams) {
    const { gl, blobs } = context;
    const texture = gl.createTexture();
    if (!texture)
        throw new Error("Could not create texture!");

    const { width, height } = params;
    const target = gl[params.target];
    const depth = "depth" in params ? params.depth : undefined;
    const border = 0;
    gl.bindTexture(target, texture);
    const { internalFormat, format, type, arrayType } = getFormatInfo(gl, params.internalFormat, "type" in params ? params.type : undefined);

    function createImage(imgTarget: typeof gl[TextureImageTargetString], blob: BlobIndex, level: number, sizeX: number, sizeY: number, sizeZ = 0) {
        const buffer = blobs[blob]!;
        const pixels = new arrayType(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        if (type) {
            if (sizeZ) {
                gl.texImage3D(imgTarget, level, internalFormat, sizeX, sizeY, sizeZ, border, format as number, type, pixels);
            } else {
                gl.texImage2D(imgTarget, level, internalFormat, sizeX, sizeY, border, format as number, type, pixels);
            }
        } else {
            if (sizeZ) {
                gl.compressedTexImage3D(imgTarget, level, internalFormat, sizeX, sizeY, sizeZ, border, pixels);
            } else {
                gl.compressedTexImage2D(imgTarget, level, internalFormat, sizeX, sizeY, border, pixels);
            }
        }
    }

    function createMipLevel(level: number, buffer: BlobIndex | readonly BlobIndex[]) {
        function isArray(img: typeof buffer): img is readonly BlobIndex[] {
            return Array.isArray(img);
        }
        const n = 1 << level;
        if (isArray(buffer)) {
            console.assert(target == gl.TEXTURE_CUBE_MAP);
            const cubeImages = buffer[level];
            if (cubeImages) {
                let side = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
                for (let img of buffer) {
                    createImage(side++, img, level, width / n, height / n);
                }
            }
        } else if (buffer) {
            if (depth) {
                if (target == gl.TEXTURE_3D) {
                    createImage(gl.TEXTURE_3D, buffer, level, width / n, height / n, depth / n);
                }
                else {
                    console.assert(target == gl.TEXTURE_2D_ARRAY);
                    createImage(gl.TEXTURE_3D, buffer, level, width / n, height / n, depth);
                }
            } else {
                console.assert(target == gl.TEXTURE_2D);
                createImage(gl.TEXTURE_2D, buffer, level, width, height);
            }
        }
    }

    if ("mipMaps" in params) {
        // mip mapped
        const { mipMaps } = params;
        for (let level = 0; level < mipMaps.length; level++) {
            const mipMap = mipMaps[level];
            if (mipMap) {
                createMipLevel(level, mipMap);
            }
        }
    } else {
        createMipLevel(0, params.image);
        if ("generateMipMaps" in params) {
            if (params.generateMipMaps) {
                if (isPowerOf2(width) && isPowerOf2(height) && type) {
                    gl.generateMipmap(target);
                } else {
                    throw new Error(`Cannot generate mip maps on a texture of non-power of two sizes (${width}, ${height})!`);
                }
            }
        }
    }
    gl.bindTexture(target, null);
    return texture;
}

export type TextureImageTargetString = "TEXTURE_2D" | "TEXTURE_3D" | "TEXTURE_2D_ARRAY" | "TEXTURE_CUBE_MAP_POSITIVE_X" | "TEXTURE_CUBE_MAP_NEGATIVE_X" | "TEXTURE_CUBE_MAP_POSITIVE_Y" | "TEXTURE_CUBE_MAP_NEGATIVE_Y" | "TEXTURE_CUBE_MAP_POSITIVE_Z" | "TEXTURE_CUBE_MAP_NEGATIVE_Z";

export type TexelTypeString =
    "UNSIGNED_BYTE" | "UNSIGNED_SHORT_5_6_5" | "UNSIGNED_SHORT_4_4_4_4" | "UNSIGNED_SHORT_5_5_5_1" |
    "BYTE" | "UNSIGNED_SHORT" | "SHORT" | "UNSIGNED_INT" | "INT" | "HALF_FLOAT" | "FLOAT" |
    "UNSIGNED_INT_2_10_10_10_REV" | "UNSIGNED_INT_10F_11F_11F_REV" | "UNSIGNED_INT_5_9_9_9_REV" | "UNSIGNED_INT_24_8" | "FLOAT_32_UNSIGNED_INT_24_8_REV";

export type UncompressedTextureFormatString =
    "ALPHA" | "RGB" | "RGBA" | "LUMINANCE" | "LUMINANCE_ALPHA" |
    "R8" | "R8_SNORM" | "RG8" | "RG8_SNORM" | "RGB8" | "RGB8_SNORM" |
    "RGB565" | "RGBA4" | "RGB5_A1" |
    "RGBA8" | "RGBA8_SNORM" |
    "RGB10_A2" | "RGB10_A2UI" |
    "SRGB8" | "SRGB8_ALPHA8" |
    "R16F" | "RG16F" | "RGB16F" | "RGBA16F" |
    "R32F" | "RG32F" | "RGB32F" | "RGBA32F" |
    "R11F_G11F_B10F" | "RGB9_E5" |
    "R8I" | "R8UI" |
    "R16I" | "R16UI" |
    "R32I" | "R32UI" |
    "RG8I" | "RG8UI" |
    "RG16I" | "RG16UI" |
    "RG32I" | "RG32UI" |
    "RGB8I" | "RGB8UI" |
    "RGB16I" | "RGB16UI" |
    "RGB32I" | "RGB32UI" |
    "RGBA8I" | "RGBA8UI" |
    "RGBA16I" | "RGBA16UI" |
    "RGBA32I" | "RGBA32UI";

export type CompressedTextureFormatString =
    // WEBGL_compressed_texture_s3tc
    "COMPRESSED_RGB_S3TC_DXT1_EXT" | "COMPRESSED_RGBA_S3TC_DXT1_EXT" | "COMPRESSED_RGBA_S3TC_DXT3_EXT" | "COMPRESSED_RGBA_S3TC_DXT5_EXT" |

    // WEBGL_compressed_texture_s3tc_srgb    
    "COMPRESSED_SRGB_S3TC_DXT1_EXT" | "COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT" | "COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT" | "COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT" |

    // WEBGL_compressed_texture_etc
    "COMPRESSED_R11_EAC" | "COMPRESSED_SIGNED_R11_EAC" | "COMPRESSED_RG11_EAC" | "COMPRESSED_SIGNED_RG11_EAC" | "COMPRESSED_RGB8_ETC2" | "COMPRESSED_RGBA8_ETC2_EAC" | "COMPRESSED_SRGB8_ETC2" | "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC" | "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2" | "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2" |

    // WEBGL_compressed_texture_pvrtc
    "COMPRESSED_RGB_PVRTC_4BPPV1_IMG" | "COMPRESSED_RGBA_PVRTC_4BPPV1_IMG" | "COMPRESSED_RGB_PVRTC_2BPPV1_IMG" | "COMPRESSED_RGBA_PVRTC_2BPPV1_IMG" |

    // WEBGL_compressed_texture_etc1
    "COMPRESSED_RGB_ETC1_WEBGL" |

    // WEBGL_compressed_texture_astc    
    "COMPRESSED_RGBA_ASTC_4x4_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR" |
    "COMPRESSED_RGBA_ASTC_5x4_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR" |
    "COMPRESSED_RGBA_ASTC_5x5_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR" |
    "COMPRESSED_RGBA_ASTC_6x5_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR" |
    "COMPRESSED_RGBA_ASTC_6x6_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR" |
    "COMPRESSED_RGBA_ASTC_8x5_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR" |
    "COMPRESSED_RGBA_ASTC_8x6_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR" |
    "COMPRESSED_RGBA_ASTC_8x8_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR" |
    "COMPRESSED_RGBA_ASTC_10x5_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR" |
    "COMPRESSED_RGBA_ASTC_10x6_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR" |
    "COMPRESSED_RGBA_ASTC_10x10_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR" |
    "COMPRESSED_RGBA_ASTC_12x10_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR" |
    "COMPRESSED_RGBA_ASTC_12x12_KHR" | "COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR" |

    // EXT_texture_compression_bptc
    "COMPRESSED_RGBA_BPTC_UNORM_EXT" | "COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT" | "COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT" | "COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT" |

    // EXT_texture_compression_rgtc
    "COMPRESSED_RED_RGTC1_EXT" | "COMPRESSED_SIGNED_RED_RGTC1_EXT" | "COMPRESSED_RED_GREEN_RGTC2_EXT" | "COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT";

type Pow2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32758 | 65536;
type CubeImages = readonly [posX: BlobIndex, negX: BlobIndex, posY: BlobIndex, negZ: BlobIndex, posZ: BlobIndex, negZ: BlobIndex];

interface Uncompressed {
    readonly internalFormat: UncompressedTextureFormatString;
    readonly type: Exclude<TexelTypeString, "FLOAT_32_UNSIGNED_INT_24_8_REV">; // FLOAT_32_UNSIGNED_INT_24_8_REV is for reading z-buffer and can't be created from an image: https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texImage3D
}

interface Compressed {
    readonly internalFormat: CompressedTextureFormatString;
}

interface GenMipMap {
    readonly generateMipMaps?: boolean; //  default: false. Mip maps can only be created for textures with power of 2 sizes.
}

interface Size2D<T extends number = number> {
    readonly width: T;
    readonly height: T;
}

interface Size3D<T extends number = number> {
    readonly width: T;
    readonly height: T;
    readonly depth: T;
}

// 2D
export interface TextureParams2DUncompressed extends Uncompressed, Size2D, GenMipMap {
    readonly target: "TEXTURE_2D";
    readonly image: BlobIndex;
};

export interface TextureParams2DCompressed extends Compressed, Size2D {
    readonly target: "TEXTURE_2D";
    readonly image: BlobIndex;
};

export interface TextureParams2DUncompressedMipMapped extends Uncompressed, Size2D<Pow2>, GenMipMap {
    readonly target: "TEXTURE_2D";
    readonly mipMaps: readonly (BlobIndex | null)[];
};

export interface TextureParams2DCompressedMipMapped extends Compressed, Size2D<Pow2> {
    readonly target: "TEXTURE_2D";
    readonly mipMaps: readonly (BlobIndex | null)[];
};

// Cube
export interface TextureParamsCubeUncompressed extends Uncompressed, Size2D, GenMipMap {
    readonly target: "TEXTURE_CUBE_MAP";
    readonly image: CubeImages;
}

export interface TextureParamsCubeCompressed extends Compressed, Size2D {
    readonly target: "TEXTURE_CUBE_MAP";
    readonly image: CubeImages;
}

export interface TextureParamsCubeUncompressedMipMapped extends Uncompressed, Size2D<Pow2> {
    readonly target: "TEXTURE_CUBE_MAP";
    readonly mipMaps: readonly (CubeImages | null)[];
}

export interface TextureParamsCubeCompressedMipMapped extends Compressed, Size2D<Pow2> {
    readonly target: "TEXTURE_CUBE_MAP";
    readonly mipMaps: readonly (CubeImages | null)[];
}

// 3D
export interface TextureParams3DUncompressed extends Uncompressed, Size3D, GenMipMap {
    readonly target: "TEXTURE_3D";
    readonly image: BlobIndex;
}

export interface TextureParams3DCompressed extends Compressed, Size3D {
    readonly target: "TEXTURE_3D";
    readonly image: BlobIndex;
}

export interface TextureParams3DUncompressedMipMapped extends Uncompressed, Size3D<Pow2> {
    readonly target: "TEXTURE_3D";
    readonly mipMaps: readonly (BlobIndex | null)[];
}

export interface TextureParams3DCompressedMipMapped extends Compressed, Size3D<Pow2> {
    readonly target: "TEXTURE_3D";
    readonly mipMaps: readonly (BlobIndex | null)[];
}

// 2D Array
export interface TextureParams2DArrayUncompressed extends Uncompressed, Size3D, GenMipMap {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly image: BlobIndex;
}

export interface TextureParams2DArrayCompressed extends Compressed, Size3D {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly image: BlobIndex;
}

export interface TextureParams2DArrayUncompressedMipMapped extends Uncompressed, Size3D<Pow2> {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly mipMaps: readonly (BlobIndex | null)[];
}

export interface TextureParams2DArrayCompressedMipMapped extends Compressed, Size3D<Pow2> {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly mipMaps: readonly (BlobIndex | null)[];
}

function isPowerOf2(value: number) {
    return (value & (value - 1)) == 0;
}

function isFormatCompressed(format: UncompressedTextureFormatString | CompressedTextureFormatString): format is CompressedTextureFormatString {
    return format.startsWith("COMPRESSED");
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


function getFormatInfo(gl: WebGL2RenderingContext, internalFormatString: UncompressedTextureFormatString | CompressedTextureFormatString, typeString?: Exclude<TexelTypeString, "FLOAT_32_UNSIGNED_INT_24_8_REV">) {
    if (isFormatCompressed(internalFormatString)) {
        const internalFormat = compressedFormats[internalFormatString];
        const format = undefined;
        const type = undefined;
        const arrayType = Uint8Array;
        return { internalFormat, format, type, arrayType };
    } else {
        const internalFormat = gl[internalFormatString] as keyof typeof internalFormat2FormatLookup;
        const format = internalFormat2FormatLookup[internalFormat];
        console.assert(format);
        const type = gl[typeString!];
        const arrayType = getBufferViewType(type);
        return { internalFormat, format, type, arrayType };
    }
}

// https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
const internalFormat2FormatLookup = {
    [GL.RGB]: GL.RGB,
    [GL.RGBA]: GL.RGBA,
    [GL.LUMINANCE_ALPHA]: GL.LUMINANCE_ALPHA,
    [GL.LUMINANCE]: GL.LUMINANCE,
    [GL.ALPHA]: GL.ALPHA,
    [GL.R8]: GL.RED,
    [GL.R8_SNORM]: GL.RED,
    [GL.RG8]: GL.RG,
    [GL.RG8_SNORM]: GL.RG,
    [GL.RGB8]: GL.RGB,
    [GL.RGB8_SNORM]: GL.RGB,
    [GL.RGB565]: GL.RGB,
    [GL.RGBA4]: GL.RGBA,
    [GL.RGB5_A1]: GL.RGBA,
    [GL.RGBA8]: GL.RGBA,
    [GL.RGBA8_SNORM]: GL.RGBA,
    [GL.RGB10_A2]: GL.RGBA,
    [GL.RGB10_A2UI]: GL.RGBA,
    [GL.SRGB8]: GL.RGB,
    [GL.SRGB8_ALPHA8]: GL.RGBA,
    [GL.R16F]: GL.RED,
    [GL.RG16F]: GL.RG,
    [GL.RGB16F]: GL.RGB,
    [GL.RGBA16F]: GL.RGBA,
    [GL.R32F]: GL.RED,
    [GL.RG32F]: GL.RG,
    [GL.RGB32F]: GL.RGB,
    [GL.RGBA32F]: GL.RGBA,
    [GL.R11F_G11F_B10F]: GL.RGB,
    [GL.RGB9_E5]: GL.RGB,
    [GL.R8I]: GL.RED,
    [GL.R8UI]: GL.RED,
    [GL.R16I]: GL.RED,
    [GL.R16UI]: GL.RED,
    [GL.R32I]: GL.RED,
    [GL.R32UI]: GL.RED,
    [GL.RG8I]: GL.RG,
    [GL.RG8UI]: GL.RG,
    [GL.RG16I]: GL.RG,
    [GL.RG16UI]: GL.RG,
    [GL.RG32I]: GL.RG,
    [GL.RG32UI]: GL.RG,
    [GL.RGB8I]: GL.RGB,
    [GL.RGB8UI]: GL.RGB,
    [GL.RGB16I]: GL.RGB,
    [GL.RGB16UI]: GL.RGB,
    [GL.RGB32I]: GL.RGB,
    [GL.RGB32UI]: GL.RGB,
    [GL.RGBA8I]: GL.RGBA,
    [GL.RGBA8UI]: GL.RGBA,
    [GL.RGBA16I]: GL.RGBA,
    [GL.RGBA16UI]: GL.RGBA,
    [GL.RGBA32I]: GL.RGBA,
    [GL.RGBA32UI]: GL.RGBA,
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
