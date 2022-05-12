import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shadersDir = path.resolve(__dirname, "../shaders/");

function loadShader(name: string) {
    return fs.readFileSync(path.resolve(shadersDir, name), "utf8");
}

export const shaders = {
    basic: {
        vertex: loadShader("basic.vert"),
        fragment: loadShader("basic.frag"),
    },
    packedTri: {
        vertex: loadShader("packedTri.vert"),
        fragment: loadShader("packed.frag"),
    },
    packedEdges: {
        vertex: loadShader("packedEdges.vert"),
        fragment: loadShader("packed.frag"),
    },
    packedOutline: {
        vertex: loadShader("packedOutline.vert"),
        fragment: loadShader("packed.frag"),
    },
    ui32: {
        vertex: loadShader("ui32.vert"),
        fragment: loadShader("ui32.frag"),
    },
    vtxCol: {
        vertex: loadShader("vtxCol.vert"),
        fragment: loadShader("vtxCol.frag"),
    },
    tex: {
        vertex: loadShader("tex.vert"),
        fragment: loadShader("tex.frag"),
    }
} as const

export type Shaders = typeof shaders;
