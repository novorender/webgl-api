import type { Renderer } from "@novorender/webgl2-renderer";
import { allocators } from "@novorender/webgl2-renderer/allocator";
import vertex from "../shaders/vtxCol.vert";
import fragment from "../shaders/vtxCol.frag";

interface DiscParams {
    readonly radius: number;
    readonly x: number;
    readonly y: number;
    readonly segments: number;
    readonly useFloat: boolean;
}

function createDiscGeometry(params: DiscParams) {
    const { x, y, radius, segments, useFloat } = params;
    const d = Math.PI * 2 / 3;
    const positions = new (useFloat ? Float32Array : Uint16Array)((segments + 1) * 2);
    const colors = new (useFloat ? Float32Array : Uint8Array)((segments + 1) * 3);
    const posMag = useFloat ? 1 : 32767;
    const colMag = useFloat ? 1 : 255;
    for (let i = 0; i < segments; i++) {
        const angle = Math.PI * 2 * i / segments;
        positions[i * 2 + 0] = (Math.cos(angle) * radius + x) * posMag;
        positions[i * 2 + 1] = (Math.sin(angle) * radius + y) * posMag;
        colors[i * 3 + 0] = Math.max(0, Math.cos(angle)) * colMag;
        colors[i * 3 + 1] = Math.max(0, Math.cos(angle + d)) * colMag;
        colors[i * 3 + 2] = Math.max(0, Math.cos(angle + d * 2)) * colMag;
    }
    positions[segments * 2 + 0] = x * posMag;
    positions[segments * 2 + 1] = y * posMag;
    colors[segments * 3 + 0] = 0.5 * colMag;
    colors[segments * 3 + 1] = 0.5 * colMag;
    colors[segments * 3 + 2] = 0.5 * colMag;

    const indices = new Uint32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
        indices[i * 3 + 0] = i + 0;
        indices[i * 3 + 1] = (i + 1) % segments;
        indices[i * 3 + 2] = segments;
    }
    return { positions, colors, indices, count: segments * 3 };
}

function createDisc(renderer: Renderer, params: DiscParams) {
    const { buffers, vertexArrayObjects } = allocators;
    const { positions, colors, indices, count } = createDiscGeometry(params);
    const { useFloat } = params;
    const pos = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: positions });
    const col = renderer.createBuffer(buffers.alloc(), { target: "ARRAY_BUFFER", srcData: colors });
    const idx = renderer.createBuffer(buffers.alloc(), { target: "ELEMENT_ARRAY_BUFFER", srcData: indices });

    const vao = renderer.createVertexArray(vertexArrayObjects.alloc(), {
        attributes: [
            { buffer: pos, numComponents: 2, componentType: useFloat ? "FLOAT" : "SHORT", normalized: !useFloat },
            { buffer: col, numComponents: 3, componentType: useFloat ? "FLOAT" : "UNSIGNED_BYTE", normalized: !useFloat },
        ],
        indices: idx
    });
    return { vao, count };
}


export function discs(renderer: Renderer) {
    const { width, height } = renderer;
    const { programs } = allocators;
    const program = renderer.createProgram(programs.alloc(), { shaders: { vertex, fragment } });

    const segments = 32768;
    const useFloat = true;

    const n = 256;
    const a = 0;
    const d = Math.PI * 2 / n;
    const radius = 0.02;
    const r = 0.9;
    const discs: ReturnType<typeof createDisc>[] = [];
    for (let i = 0; i < n; i++) {
        discs.push(
            createDisc(renderer, { radius, x: Math.cos(a + i * d) * r, y: Math.sin(a + i * d) * r, segments, useFloat }),
        )
    }

    renderer.state({
        viewport: { width, height },
        program,
    });

    return function render(time: number) {
        const g = Math.max(0, Math.sin(time / 1000 * Math.PI) * 0.25 + 0.5);
        renderer.clear({ color: [0, g, 0.25, 1] });
        renderer.measureBegin();
        for (const { count, vao } of discs) {
            renderer.state({ vertexArrayObject: vao });
            renderer.draw({ count, indexType: "UNSIGNED_INT" });
        }
        renderer.measureEnd();
        renderer.commit();
        renderer.measurePrint();
        return true;
    }
}