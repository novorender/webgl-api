import type { RendererContext } from "./renderer";
import { GL } from "./glEnum.js";
import { getBufferSource, BinarySource } from "./binary.js";
import { getBufferViewType } from "./util.js";

export type TextureIndex = number;

export type TextureParams =
    TextureParams2DUncompressed | TextureParams2DCompressed | TextureParams2DUncompressedMipMapped | TextureParams2DCompressedMipMapped |
    TextureParamsCubeUncompressed | TextureParamsCubeCompressed | TextureParamsCubeUncompressedMipMapped | TextureParamsCubeCompressedMipMapped |
    TextureParams3DUncompressed | TextureParams3DCompressed | TextureParams3DUncompressedMipMapped | TextureParams3DCompressedMipMapped |
    TextureParams2DArrayUncompressed | TextureParams2DArrayCompressed | TextureParams2DArrayUncompressedMipMapped | TextureParams2DArrayCompressedMipMapped;

export function createTexture(context: RendererContext, params: TextureParams) {
    const { gl } = context;
    const texture = gl.createTexture();
    if (!texture)
        throw new Error("Could not create texture!");

    const { width, height } = params;
    const target = gl[params.target];
    const depth = "depth" in params ? params.depth : undefined;
    const border = 0;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(target, texture);

    const { internalFormat, format, type, arrayType } = getFormatInfo(gl, params.internalFormat, "type" in params ? params.type : undefined);

    function createImage(imgTarget: typeof gl[TextureImageTargetString], data: BinarySource | null, level: number, sizeX: number, sizeY: number, sizeZ = 0) {
        const source = data === null ? null : getBufferSource(context, data);
        const view = ArrayBuffer.isView(source) ? source : undefined;
        const buffer = ArrayBuffer.isView(view) ? view.buffer : source as ArrayBufferLike;
        const byteOffset = view?.byteOffset ?? 0;
        const byteLength = view?.byteLength ?? buffer?.byteLength;
        const pixels = buffer === null ? null : new arrayType(buffer, byteOffset, byteLength / arrayType.BYTES_PER_ELEMENT);
        if (type) {
            if (sizeZ) {
                gl.texImage3D(imgTarget, level, internalFormat, sizeX, sizeY, sizeZ, border, format as number, type, pixels);
            } else {
                gl.texImage2D(imgTarget, level, internalFormat, sizeX, sizeY, border, format as number, type, pixels);
            }
        } else {
            console.assert(pixels);
            if (sizeZ) {
                gl.compressedTexImage3D(imgTarget, level, internalFormat, sizeX, sizeY, sizeZ, border, pixels!);
            } else {
                gl.compressedTexImage2D(imgTarget, level, internalFormat, sizeX, sizeY, border, pixels!);
            }
        }
    }

    function createMipLevel(level: number, image: BinarySource | readonly BinarySource[] | null) {
        function isArray(img: typeof image): img is readonly BinarySource[] {
            return Array.isArray(img);
        }
        const n = 1 << level;
        if (isArray(image)) {
            console.assert(target == gl.TEXTURE_CUBE_MAP);
            const cubeImages = image[level];
            if (cubeImages) {
                let side = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
                for (let img of image) {
                    createImage(side++, img, level, width / n, height / n);
                }
            }
        } else {
            if (depth) {
                if (target == gl.TEXTURE_3D) {
                    createImage(gl.TEXTURE_3D, image, level, width / n, height / n, depth / n);
                }
                else {
                    console.assert(target == gl.TEXTURE_2D_ARRAY);
                    createImage(gl.TEXTURE_3D, image, level, width / n, height / n, depth);
                }
            } else {
                console.assert(target == gl.TEXTURE_2D);
                createImage(gl.TEXTURE_2D, image, level, width, height);
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

        const generateMipMaps = "generateMipMaps" in params && params.generateMipMaps;
        if (generateMipMaps) {
            if (isPowerOf2(width) && isPowerOf2(height) && type) {
                gl.generateMipmap(target);
            } else {
                throw new Error(`Cannot generate mip maps on a texture of non-power of two sizes (${width}, ${height})!`);
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

type Pow2 = 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32758 | 65536;
type CubeImages = readonly [posX: BinarySource, negX: BinarySource, posY: BinarySource, negZ: BinarySource, posZ: BinarySource, negZ: BinarySource];

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
    readonly image: BinarySource | null;
};

export interface TextureParams2DCompressed extends Compressed, Size2D {
    readonly target: "TEXTURE_2D";
    readonly image: BinarySource;
};

export interface TextureParams2DUncompressedMipMapped extends Uncompressed, Size2D<Pow2>, GenMipMap {
    readonly target: "TEXTURE_2D";
    readonly mipMaps: readonly (BinarySource | null)[];
};

export interface TextureParams2DCompressedMipMapped extends Compressed, Size2D<Pow2> {
    readonly target: "TEXTURE_2D";
    readonly mipMaps: readonly (BinarySource)[];
};

// Cube
export interface TextureParamsCubeUncompressed extends Uncompressed, Size2D, GenMipMap {
    readonly target: "TEXTURE_CUBE_MAP";
    readonly image: CubeImages | null;
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
    readonly mipMaps: readonly (CubeImages)[];
}

// 3D
export interface TextureParams3DUncompressed extends Uncompressed, Size3D, GenMipMap {
    readonly target: "TEXTURE_3D";
    readonly image: BinarySource;
}

export interface TextureParams3DCompressed extends Compressed, Size3D {
    readonly target: "TEXTURE_3D";
    readonly image: BinarySource;
}

export interface TextureParams3DUncompressedMipMapped extends Uncompressed, Size3D<Pow2> {
    readonly target: "TEXTURE_3D";
    readonly mipMaps: readonly (BinarySource | null)[];
}

export interface TextureParams3DCompressedMipMapped extends Compressed, Size3D<Pow2> {
    readonly target: "TEXTURE_3D";
    readonly mipMaps: readonly (BinarySource)[];
}

// 2D Array
export interface TextureParams2DArrayUncompressed extends Uncompressed, Size3D, GenMipMap {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly image: BinarySource | null;
}

export interface TextureParams2DArrayCompressed extends Compressed, Size3D {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly image: BinarySource;
}

export interface TextureParams2DArrayUncompressedMipMapped extends Uncompressed, Size3D<Pow2> {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly mipMaps: readonly (BinarySource | null)[];
}

export interface TextureParams2DArrayCompressedMipMapped extends Compressed, Size3D<Pow2> {
    readonly target: "TEXTURE_2D_ARRAY";
    readonly mipMaps: readonly (BinarySource)[];
}

function isPowerOf2(value: number) {
    return (value & (value - 1)) == 0;
}

function isFormatCompressed(format: UncompressedTextureFormatString | CompressedTextureFormatString): format is CompressedTextureFormatString {
    return format.startsWith("COMPRESSED");
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
    [GL.RGB10_A2UI]: GL.RGBA_INTEGER,
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
    [GL.R8I]: GL.RED_INTEGER,
    [GL.R8UI]: GL.RED_INTEGER,
    [GL.R16I]: GL.RED_INTEGER,
    [GL.R16UI]: GL.RED_INTEGER,
    [GL.R32I]: GL.RED_INTEGER,
    [GL.R32UI]: GL.RED_INTEGER,
    [GL.RG8I]: GL.RG_INTEGER,
    [GL.RG8UI]: GL.RG_INTEGER,
    [GL.RG16I]: GL.RG_INTEGER,
    [GL.RG16UI]: GL.RG_INTEGER,
    [GL.RG32I]: GL.RG_INTEGER,
    [GL.RG32UI]: GL.RG_INTEGER,
    [GL.RGB8I]: GL.RGB_INTEGER,
    [GL.RGB8UI]: GL.RGB_INTEGER,
    [GL.RGB16I]: GL.RGB_INTEGER,
    [GL.RGB16UI]: GL.RGB_INTEGER,
    [GL.RGB32I]: GL.RGB_INTEGER,
    [GL.RGB32UI]: GL.RGB_INTEGER,
    [GL.RGBA8I]: GL.RGBA_INTEGER,
    [GL.RGBA8UI]: GL.RGBA_INTEGER,
    [GL.RGBA16I]: GL.RGBA_INTEGER,
    [GL.RGBA16UI]: GL.RGBA_INTEGER,
    [GL.RGBA32I]: GL.RGBA_INTEGER,
    [GL.RGBA32UI]: GL.RGBA_INTEGER,
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
