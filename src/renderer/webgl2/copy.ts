import type { CopyParams } from "..";
import type { RendererContext } from ".";

export function copy(context: RendererContext, params: CopyParams) {
    const { gl, buffers } = context;
    const readOffset = params.readOffset ?? 0;
    const writeOffset = params.writeOffset ?? 0;
    gl.bindBuffer(gl.COPY_READ_BUFFER, buffers[params.readBuffer]);
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, buffers[params.writeBuffer]);
    gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, readOffset, writeOffset, params.size);
    gl.bindBuffer(gl.COPY_READ_BUFFER, null);
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, null);
}