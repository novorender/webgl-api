import type { RenderActionData } from "./actions";
import type { MeshResourceVertexAttributes } from "./attributes";
import type { FlagNames, ShaderNames } from "./programs";
import type { CompressedTextureFormatString, Mat4, RGBA, TexelTypeString, UncompressedTextureFormatString } from "./types";

export type ProgramIndex = number;
export type BufferIndex = number;
export type MeshIndex = number;
export type ImageIndex = number;
export type SamplerIndex = number;
export type TextureIndex = number;

export namespace RenderState {
    export type VertexSemantic = keyof typeof MeshResourceVertexAttributes;

    export interface BlobRef {
        readonly blobIndex: number;
        readonly byteOffset?: number;
        readonly byteLength?: number;
    }

    export interface Scene {
        readonly binaryUrl?: string;
        readonly view?: View;
        readonly resources?: Resources;
        readonly actions: readonly RenderActionData[];
    }

    export interface View {
        readonly width: number;
        readonly height: number;
    }

    export interface Resources {
        readonly blobs: readonly { url: string }[];
        readonly programs: readonly ProgramResource[];
        readonly buffers: readonly BufferResource[];
        readonly samplers: readonly SamplerResource[];
        readonly textures: readonly TextureResource[];
        readonly meshes: readonly MeshResource[];
    }

    export interface ProgramResource<T extends ShaderNames = ShaderNames> {
        readonly shader: T;
        readonly flags?: readonly FlagNames<T>[]; // shader #ifdef's
        // uniform defaults?
        // attribute default?
    }

    export interface BufferResourceBinary extends BlobRef {
        readonly type: "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER" | "UNIFORM_BUFFER";
    }

    export interface BufferResourceArray {
        readonly type: "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER" | "UNIFORM_BUFFER";
        readonly arrayType?: "Float32Array" | "Uint8Array" | "Uint16Array" | "Uint32Array"; // default Float32Array
        readonly array: readonly number[];
    }

    export interface BufferResourceUniformBlockInstance {
        readonly type: "UNIFORM_BUFFER";
        readonly instance: {
            modelMatrix?: Mat4; // default = identity matrix
        }
    }

    export interface BufferResourceUniformBlockMaterial {
        readonly type: "UNIFORM_BUFFER";
        readonly material: {
            baseColor?: RGBA; // default = [1,1,1,1]
            baseColorTexture: TextureIndex;
            // TODO: add sampler and UV transform?
        }
    }

    export interface BufferResourceUniformBlockCamera {
        readonly type: "UNIFORM_BUFFER";
        readonly camera: {
            readonly viewMatrix?: Mat4; // default = identity matrix
            readonly projectionMatrix?: { // we don't want a complete matrix here, since we want to inject aspect ratio from view width/height.
                readonly fov?: number; // vertical field of view in degrees. default = 30
                readonly near?: number; // default = 0.1
                readonly far?: number; // default = 1000
            }
        }
    }

    export type BufferResource = BufferResourceBinary | BufferResourceArray | BufferResourceUniformBlockCamera | BufferResourceUniformBlockMaterial | BufferResourceUniformBlockInstance;


    export interface MeshResource {
        readonly primitiveType?: "POINTS" | "LINE_STRIP" | "LINE_LOOP" | "LINES" | "TRIANGLE_STRIP" | "TRIANGLE_FAN" | "TRIANGLES"; // default is "TRIANGLES"
        readonly count: number; // # indices (or vertices)

        readonly attributes: {
            readonly [P in VertexSemantic]: {
                readonly buffer: BufferIndex;
                // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
                readonly numComponents: 1 | 2 | 3 | 4;
                readonly componentType?: "BYTE" | "UNSIGNED_BYTE" | "SHORT" | "UNSIGNED_SHORT" | "FLOAT" | "HALF_FLOAT"; // default: FLOAT
                readonly normalized?: boolean; // default: false
                readonly stride?: number; // default: 0
                readonly offset?: number; // default: 0
            }
        };

        readonly indices?: {
            readonly type: "UNSIGNED_BYTE" | "UNSIGNED_SHORT" | "UNSIGNED_INT";
            readonly buffer: number;
        };
    }



    export type Wrap = "CLAMP_TO_EDGE" | "MIRRORED_REPEAT" | "REPEAT";

    export interface SamplerResource {
        readonly minificationFilter?: "NEAREST" | "LINEAR" | "NEAREST_MIPMAP_NEAREST" | "LINEAR_MIPMAP_NEAREST" | "NEAREST_MIPMAP_LINEAR" | "LINEAR_MIPMAP_LINEAR"; // default: NEAREST_MIPMAP_LINEAR
        readonly magnificationFilter?: "NEAREST" | "LINEAR"; // default: LINEAR
        readonly wrap?: readonly [Wrap, Wrap] | readonly [Wrap, Wrap, Wrap]; // ST, or STR coordinate wrapping. default: REPEAT
        readonly minLOD?: number; // default: -1000
        readonly maxLOD?: number; // default: 1000
        readonly compareFunction?: "NEVER" | "LESS" | "EQUAL" | "LEQUAL" | "GREATER" | "NOTEQUAL" | "GEQUAL" | "ALWAYS";
        readonly compareMode?: "COMPARE_REF_TO_TEXTURE" | "NONE";
    }

    export interface Uncompressed {
        readonly internalFormat: UncompressedTextureFormatString;
        readonly type: Exclude<TexelTypeString, "FLOAT_32_UNSIGNED_INT_24_8_REV">; // FLOAT_32_UNSIGNED_INT_24_8_REV is for reading z-buffer and can't be created from an image: https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texImage3D
    }

    export interface Compressed {
        readonly internalFormat: CompressedTextureFormatString;
    }

    export interface GenMipMap {
        readonly generateMipMaps?: boolean; //  default: false. Mip maps can only be created for textures with power of 2 sizes.
    }

    export type Pow2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32758 | 65536;
    export type CubeImages = readonly [posX: BlobRef, negX: BlobRef, posY: BlobRef, negZ: BlobRef, posZ: BlobRef, negZ: BlobRef];

    export interface TextureSize2D<T extends number = number> {
        readonly width: T;
        readonly height: T;
    }

    export interface TextureSize3D<T extends number = number> {
        readonly width: T;
        readonly height: T;
        readonly depth: T;
    }


    export interface TextureResource2D extends TextureSize2D {
        readonly target: "TEXTURE_2D";
        readonly image: BlobRef;
    }

    export interface TextureResource2DMipMapped extends TextureSize2D<Pow2> {
        readonly target: "TEXTURE_2D";
        readonly mipMaps: readonly (BlobRef | null)[];
    }

    export interface TextureResourceCube extends TextureSize2D {
        readonly target: "TEXTURE_CUBE_MAP";
        readonly image: CubeImages;
    }

    export interface TextureResourceCubeMipMapped extends TextureSize2D<Pow2> {
        readonly target: "TEXTURE_CUBE_MAP";
        readonly mipMaps: readonly (CubeImages | null)[];
    }

    export interface TextureResource3D extends TextureSize3D {
        readonly target: "TEXTURE_3D";
        readonly image: BlobRef;
    }

    export interface TextureResource3DMipMapped extends TextureSize3D<Pow2> {
        readonly target: "TEXTURE_2D";
        readonly mipMaps: readonly (BlobRef | null)[];
    }

    export interface TextureResource2DArray extends TextureSize3D {
        readonly target: "TEXTURE_2D_ARRAY";
        readonly image: BlobRef;
    }

    export interface TextureResource2DArrayMipMapped extends TextureSize3D<Pow2> {
        readonly target: "TEXTURE_2D_ARRAY";
        readonly mipMaps: readonly (BlobRef | null)[];
    }

    export type TextureResource =
        (Uncompressed & ((GenMipMap & (TextureResource2D | TextureResourceCube | TextureResource3D | TextureResource2DArray)) | (TextureResource2DMipMapped | TextureResourceCubeMipMapped | TextureResource3DMipMapped | TextureResource2DArrayMipMapped))) |
        (Compressed & (TextureResource2D | TextureResourceCube | TextureResource2DMipMapped | TextureResourceCubeMipMapped | TextureResource3D | TextureResource2DArray | TextureResource3DMipMapped | TextureResource2DArrayMipMapped));
}



