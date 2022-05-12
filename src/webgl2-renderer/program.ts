import type { RendererContext } from "./renderer.js";
import { getAttributesInfo } from "./util.js";

export type ProgramIndex = number;

export interface ProgramParams {
    readonly shaders: { vertex: string, fragment: string };
    readonly flags?: readonly string[];
}

type ShaderType = "VERTEX_SHADER" | "FRAGMENT_SHADER";

function compileShader(gl: WebGLRenderingContext, type: ShaderType, source: string): WebGLShader {
    const shader = gl.createShader(gl[type]);
    if (!shader) throw new Error("WebGL Shader could not be created.");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const typeName = type.split("_")[0].toLocaleLowerCase();
        const errorMsg = gl.getShaderInfoLog(shader);
        throw new Error(`: Failed to compile glsl ${typeName} shader!\r\n${errorMsg}`);
    }
    return shader;
}

export function createProgram(context: RendererContext, params: ProgramParams) {
    const { gl } = context;
    const { shaders, flags } = params;
    const header = "#version 300 es\nprecision highp float;\n";
    const defines = flags?.map(flag => `#define ${flag}\n`)?.join() ?? "";
    const vs = header + defines + shaders.vertex;
    const fs = header + defines + shaders.fragment;
    const vertexShader = compileShader(gl, "VERTEX_SHADER", vs);
    const fragmentShader = compileShader(gl, "FRAGMENT_SHADER", fs);
    const program = gl.createProgram();
    if (!program)
        throw new Error("Could not create WebGL shader program!");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // TODO: Consider doing linking in a separate stage, so as to take advantage of parallel shader compilation. (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#Compile_Shaders_and_Link_Programs_in_parallel)
    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(`: Failed to compile link shaders!\r\n${gl.getProgramInfoLog(program)}`);

    const info = getAttributesInfo(gl, program);
    // console.log(info);

    return program;
}
