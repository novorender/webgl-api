import { GL } from "./glEnum.js";

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
