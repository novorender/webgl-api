import type { Renderer, BufferIndex } from "../renderer";
import { shaders } from "./shaders.js";

interface DiscParams {
    readonly radius: number;
    readonly centerX: number;
    readonly centerY: number;
    readonly segments: number;
    readonly useFloat: boolean;
    readonly interleaved: boolean;
}

function createDiscGeometry(params: DiscParams) {
    const { centerX, centerY, radius, segments, useFloat, interleaved } = params;

    const posComponents = 2;
    const colComponents = 4;
    const posBytes = posComponents * (useFloat ? 4 : 2);
    const colBytes = colComponents * (useFloat ? 4 : 1);
    const posOffset = 0;
    const colOffset = interleaved ? posBytes : 0;
    const posStride = interleaved ? posBytes + colBytes : posBytes;
    const colStride = interleaved ? posBytes + colBytes : colBytes;
    let positionsBuffer: ArrayBuffer = undefined!;
    let colorsBuffer: ArrayBuffer = undefined!;
    if (interleaved) {
        const byteSize = (segments + 1) * (posBytes + colBytes);
        const byteSizeRounded = byteSize % 4 ? (byteSize | 3) + 1 : byteSize; // round up to nearest four bytes
        positionsBuffer = colorsBuffer = new ArrayBuffer(byteSizeRounded);
    } else {
        positionsBuffer = new ArrayBuffer((segments + 1) * posBytes);
        colorsBuffer = new ArrayBuffer((segments + 1) * colBytes);
    }

    function setPos(i: number, x: number, y: number) {
        const byteOffset = i * posStride + posOffset;
        const view = new (useFloat ? Float32Array : Uint16Array)(positionsBuffer, byteOffset);
        const magnitude = useFloat ? 1 : 32767;
        view[0] = x * magnitude;
        view[1] = y * magnitude;
    }

    function setCol(i: number, r: number, g: number, b: number, a = 1) {
        const byteOffset = i * colStride + colOffset;
        const view = new (useFloat ? Float32Array : Uint8Array)(colorsBuffer, byteOffset);
        const magnitude = useFloat ? 1 : 255;
        view[0] = r * magnitude;
        view[1] = g * magnitude;
        view[2] = b * magnitude;
        if (colComponents as number == 4)
            view[4] = a * magnitude;
    }

    const d = Math.PI * 2 / 3;
    for (let i = 0; i < segments; i++) {
        const angle = Math.PI * 2 * i / segments;
        const x = (Math.cos(angle) * radius + centerX);
        const y = (Math.sin(angle) * radius + centerY);
        const r = Math.max(0, Math.cos(angle));
        const g = Math.max(0, Math.cos(angle + d));
        const b = Math.max(0, Math.cos(angle + d * 2));
        setPos(i, x, y);
        setCol(i, r, g, b);
    }
    setPos(segments, centerX, centerY);
    setCol(segments, 0.5, 0.5, 0.5);

    const indices = new Uint32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
        indices[i * 3 + 0] = i + 0;
        indices[i * 3 + 1] = (i + 1) % segments;
        indices[i * 3 + 2] = segments;
    }
    const normalized = !useFloat;
    const positions = { /*buffer,*/ numComponents: posComponents, componentType: useFloat ? "FLOAT" : "SHORT", normalized, stride: posStride, offset: 0 } as const;
    const colors = { /*buffer,*/ numComponents: colComponents, componentType: useFloat ? "FLOAT" : "UNSIGNED_BYTE", normalized, stride: colStride, offset: interleaved ? posBytes : 0 } as const;
    return { positionsBuffer, colorsBuffer, positions, colors, indices, count: segments * 3 };
}

function createDisc(renderer: Renderer, params: DiscParams) {
    const { buffers, vertexArrayObjects } = renderer.allocators;
    const { positionsBuffer, colorsBuffer, positions, colors, indices, count } = createDiscGeometry(params);
    let pos: BufferIndex = undefined!;
    let col: BufferIndex = undefined!;
    if (params.interleaved) {
        pos = col = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: positionsBuffer })
    } else {
        pos = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: positionsBuffer });
        col = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: colorsBuffer });
    }
    const idx = renderer.createBuffer(buffers.alloc(), { target: "ELEMENT_ARRAY_BUFFER", srcData: indices });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), {
        attributes: [
            { buffer: pos, ...positions },
            { buffer: col, ...colors },
        ],
        indices: idx
    });
    return { vao, count };
}


export function discs(renderer: Renderer, segments = 32768, useFloat: boolean = false, interleaved = false) {
    const { width, height } = renderer;
    const { programs } = renderer.allocators;
    const program = renderer.createProgram(programs.alloc(), { shaders: shaders.vtxCol });

    const n = 256;
    const a = 0;
    const d = Math.PI * 2 / n;
    const radius = 0.02;
    const r = 0.9;
    const discs: ReturnType<typeof createDisc>[] = [];
    for (let i = 0; i < n; i++) {
        discs.push(
            createDisc(renderer, { radius, centerX: Math.cos(a + i * d) * r, centerY: Math.sin(a + i * d) * r, segments, useFloat, interleaved }),
        )
    }

    renderer.state({
        viewport: { width, height },
        program,
    });

    renderer.clear({ color: [0, 0, 0.25, 1] });
    renderer.measureBegin();
    for (const { count, vao } of discs) {
        renderer.state({ vertexArrayObject: vao });
        renderer.draw({ count, indexType: "UNSIGNED_INT" });
    }
    renderer.measureEnd();
    renderer.commit();
}