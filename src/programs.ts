import drawMeshVS from "./shaders/drawMesh.vert";
import drawMeshFS from "./shaders/drawMesh.frag";
import { createShaderProgram } from "./util";

const programs = {
    "drawMesh": {
        shaders: {
            vertex: drawMeshVS,
            fragment: drawMeshFS,
        },
        flags: ["SOME_FLAG", "ANOTHER_FLAG"],
        uniforms: {
            // TODO: Describe uniforms
        }
    }
} as const;

export type ShaderName = keyof typeof programs;
export type FlagNames<T extends ShaderName> = typeof programs[T]["flags"][number];
// type Flags<T extends ShaderName> = readonly FlagNames<T>[];
// type TT = Flags<"drawMesh">;

// fixed layout for mesh vertex attributes
const meshAttributes = [
    "position",
    "normal",
    "color0",
    "tex0",
] as const;

export function createProgram<T extends ShaderName>(gl: WebGL2RenderingContext, name: T, flags?: readonly FlagNames<T>[]) {
    const programParams = programs[name];
    const program = createShaderProgram(gl, programParams.shaders, meshAttributes, flags);
    // uniforms?
    return program;
}