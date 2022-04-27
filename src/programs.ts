import drawMeshVS from "./shaders/drawMesh.vert";
import drawMeshFS from "./shaders/drawMesh.frag";
import { createShaderProgram } from "./util";
import { bindUniformBlocks } from "./uniforms";
import { meshAttributes } from "./attributes";

const programs = {
    "drawMesh": {
        shaders: {
            vertex: drawMeshVS,
            fragment: drawMeshFS,
        },
        flags: ["SOME_FLAG", "ANOTHER_FLAG"],
        uniforms: {
            // TODO: Describe uniforms?
        }
    }
} as const;

export type ShaderNames = keyof typeof programs;
export type FlagNames<T extends ShaderNames> = typeof programs[T]["flags"][number];
export type ProgramFactory = { [P in ShaderNames]: (flags?: readonly FlagNames<P>[]) => WebGLProgram }
// type Flags<T extends ShaderName> = readonly FlagNames<T>[];
// type TT = Flags<"drawMesh">;

function createProgram<T extends ShaderNames>(gl: WebGL2RenderingContext, shaderName: T, flags?: readonly FlagNames<T>[]) {
    const programParams = programs[shaderName];
    const program = createShaderProgram(gl, programParams.shaders, meshAttributes, flags);
    bindUniformBlocks(gl, program);
    return program;
}

const factoryMap = new WeakMap<WebGL2RenderingContext, ProgramFactory>();

export function getProgramFactory(gl: WebGL2RenderingContext) {
    const existingFactory = factoryMap.get(gl);
    if (existingFactory)
        return existingFactory;

    const programMap = new Map<string, WebGLProgram>();
    const factory = {} as ProgramFactory;
    for (const [shaderName, args] of Object.entries(programs)) {
        factory[shaderName as ShaderNames] = (flags?: readonly FlagNames<ShaderNames>[]) => {
            const key = `${shaderName}:${flags?.join(",")}`;
            const existingProgram = programMap.get(key);
            if (existingProgram)
                return existingProgram;
            const program = createProgram(gl, shaderName as ShaderNames, flags);
            programMap.set(key, program);
            return program;
        }
    }
    factoryMap.set(gl, factory);
    return factory;
}
