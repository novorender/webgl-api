import { GL } from "./glEnum";

export type UnitFloat = number; // [0, 1]
// export type SignedUnitFloat = number; // [-1, 1]
export type UInt8 = number; // [0, 255]
export type Vec3 = readonly [x: number, y: number, z: number];
export type Mat4 = readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
export type Quat = readonly [number, number, number, number];

export type AsyncReturnType<T extends (...args: any) => any> =
    T extends (...args: any) => Promise<infer U> ? U :
    T extends (...args: any) => infer U ? U :
    any

export type RGB = readonly [red: number, green: number, blue: number];
export type RGBA = readonly [red: number, green: number, blue: number, alpha: number];

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


export type TexelTypeString =
    "UNSIGNED_BYTE" | "UNSIGNED_SHORT_5_6_5" | "UNSIGNED_SHORT_4_4_4_4" | "UNSIGNED_SHORT_5_5_5_1" |
    "BYTE" | "UNSIGNED_SHORT" | "SHORT" | "UNSIGNED_INT" | "INT" | "HALF_FLOAT" | "FLOAT" |
    "UNSIGNED_INT_2_10_10_10_REV" | "UNSIGNED_INT_10F_11F_11F_REV" | "UNSIGNED_INT_5_9_9_9_REV" | "UNSIGNED_INT_24_8" | "FLOAT_32_UNSIGNED_INT_24_8_REV";

export type IndexBufferType = GL.UNSIGNED_BYTE | GL.UNSIGNED_SHORT | GL.UNSIGNED_INT;
export type AttributeType = GL.BYTE | GL.UNSIGNED_BYTE | GL.SHORT | GL.UNSIGNED_SHORT | GL.FLOAT | GL.HALF_FLOAT;
export type MagFilter = GL.LINEAR | GL.NEAREST;
export type MinFilter = GL.LINEAR | GL.NEAREST | GL.NEAREST_MIPMAP_NEAREST | GL.LINEAR_MIPMAP_NEAREST | GL.NEAREST_MIPMAP_LINEAR | GL.LINEAR_MIPMAP_LINEAR;
export type WrapMode = GL.REPEAT | GL.CLAMP_TO_EDGE | GL.MIRRORED_REPEAT;
export type CompareFunc = GL.NEVER | GL.LESS | GL.EQUAL | GL.LEQUAL | GL.GREATER | GL.NOTEQUAL | GL.GEQUAL | GL.ALWAYS;
export type TextureImageTarget = GL.TEXTURE_2D | GL.TEXTURE_3D | GL.TEXTURE_2D_ARRAY | GL.TEXTURE_CUBE_MAP_POSITIVE_X | GL.TEXTURE_CUBE_MAP_NEGATIVE_X | GL.TEXTURE_CUBE_MAP_POSITIVE_Y | GL.TEXTURE_CUBE_MAP_NEGATIVE_Y | GL.TEXTURE_CUBE_MAP_POSITIVE_Z | GL.TEXTURE_CUBE_MAP_NEGATIVE_Z;

export type UniformType =
    GL.FLOAT | GL.FLOAT_VEC2 | GL.FLOAT_VEC3 | GL.FLOAT_VEC4 |
    GL.INT | GL.INT_VEC2 | GL.INT_VEC3 | GL.INT_VEC4 |
    GL.UNSIGNED_INT | GL.UNSIGNED_INT_VEC2 | GL.UNSIGNED_INT_VEC3 | GL.UNSIGNED_INT_VEC4 |
    GL.BOOL | GL.BOOL_VEC2 | GL.BOOL_VEC3 | GL.BOOL_VEC4 |
    GL.FLOAT_MAT2 | GL.FLOAT_MAT3 | GL.FLOAT_MAT4 |
    GL.FLOAT_MAT2x3 | GL.FLOAT_MAT2x4 | GL.FLOAT_MAT3x2 | GL.FLOAT_MAT3x4 | GL.FLOAT_MAT4x2 | GL.FLOAT_MAT4x3 |
    GL.SAMPLER_2D | GL.SAMPLER_2D_ARRAY | GL.SAMPLER_2D_ARRAY_SHADOW | GL.SAMPLER_2D_ARRAY_SHADOW | GL.SAMPLER_3D | GL.SAMPLER_CUBE | GL.SAMPLER_CUBE_SHADOW;


